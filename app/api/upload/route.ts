import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// Get the project root directory reliably
const getProjectRoot = () => {
    // In production (standalone), the working directory may differ
    // Use __dirname as fallback which is more reliable
    try {
        // Try process.cwd() first (development)
        const cwdPath = process.cwd();
        if (cwdPath) return cwdPath;
    } catch (e) {
        // Ignore
    }
    
    // Fallback to current file's directory and traverse up
    // This works in both dev and production
    return process.env.NEXT_PROJECT_ROOT || process.cwd();
};

export async function POST(request: NextRequest) {
    try {
        console.log('[Upload API] Received upload request');
        const data = await request.formData();
        const file: File | null = data.get('file') as unknown as File;

        if (!file) {
            console.error('[Upload API] No file found in form data');
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        console.log('[Upload API] File info:', {
            name: file.name,
            type: file.type,
            size: file.size
        });

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create unique filename
        const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
        
        // Handle generic names like 'blob' or missing names
        let name = file.name || 'pasted-image';
        let extension = 'png';
        
        if (name === 'blob' || !name.includes('.')) {
            // Get extension from mime type
            extension = file.type.split('/').pop() || 'png';
            // Sanitize extension (remove stuff like 'svg+xml')
            extension = extension.split('+')[0];
            name = `upload-${Date.now()}.${extension}`;
        } else {
            extension = name.split('.').pop() || 'png';
        }

        const filename = `img-${uniqueSuffix}.${extension}`;

        // Save to public/uploads - use multiple fallback paths for reliability
        const projectRoot = getProjectRoot();
        const uploadDirs = [
            join(projectRoot, 'public', 'uploads'),
            // Fallback paths for different production setups
            join(process.cwd(), 'public', 'uploads'),
            join('/app', 'public', 'uploads'), // Common Docker path
        ];

        console.log('[Upload API] Project root:', projectRoot);
        
        let uploadDir: string | null = null;
        let filepath: string | null = null;

        // Try each possible upload directory
        for (const dir of uploadDirs) {
            try {
                await mkdir(dir, { recursive: true });
                uploadDir = dir;
                filepath = join(dir, filename);
                console.log('[Upload API] Using upload directory:', dir);
                break;
            } catch (err: any) {
                console.warn('[Upload API] Cannot create directory:', dir, err.message);
            }
        }

        if (!uploadDir || !filepath) {
            console.error('[Upload API] Could not create upload directory');
            return NextResponse.json({ 
                error: 'Could not create upload directory',
            }, { status: 500 });
        }

        console.log('[Upload API] Full file path:', filepath);

        await writeFile(filepath, buffer);
        console.log('[Upload API] File written successfully');

        // Return the public URL
        const url = `/uploads/${filename}`;

        return NextResponse.json({ url });
    } catch (error: any) {
        console.error('[Upload API] CRITICAL ERROR:', error);
        return NextResponse.json({ 
            error: 'Upload failed', 
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
