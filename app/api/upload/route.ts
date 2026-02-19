import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    try {
        const data = await request.formData();
        const file: File | null = data.get('file') as unknown as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create unique filename
        const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
        const originalName = file.name.replace(/[^a-zA-Z0-9.]/g, ''); // Sanitize
        const extension = originalName.split('.').pop() || 'jpg';
        const filename = `image-${uniqueSuffix}.${extension}`;

        // Save to public/uploads (ensure directory exists)
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadDir, { recursive: true });
        const filepath = join(uploadDir, filename);

        await writeFile(filepath, buffer);

        // Return the public URL
        const url = `/uploads/${filename}`;

        return NextResponse.json({ url });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
