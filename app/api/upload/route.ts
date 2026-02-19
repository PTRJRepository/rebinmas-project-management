import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

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

        // Save to public/uploads (ensure directory exists)
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        console.log('[Upload API] Saving to directory:', uploadDir);
        
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (err: any) {
            console.warn('[Upload API] Directory creation warning (might exist):', err.message);
        }

        const filepath = join(uploadDir, filename);
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
