import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { writeFile } from 'fs/promises';

const isDev = process.env.NODE_ENV === 'development';
const GDRIVE_BASE_URL = isDev ? 'http://10.0.0.110:5178' : 'http://223.25.98.220:3001';
const GDRIVE_GATEWAY_URL = `${GDRIVE_BASE_URL}/file/upload`;

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file: File | null = formData.get('file') as unknown as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        console.log(`[Upload API] Processing file: ${file.name} (${file.size} bytes)`);

        // Try forwarding to Gdrive Gateway first
        try {
            const gatewayFormData = new FormData();
            gatewayFormData.append('file', file);

            console.log(`[Upload API] Attempting to forward to gateway: ${GDRIVE_GATEWAY_URL}`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

            const response = await fetch(GDRIVE_GATEWAY_URL, {
                method: 'POST',
                body: gatewayFormData,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const result = await response.json();
                console.log('[Upload API] Gateway success result:', result);

                let url = result.url || result.fileUrl || result.data?.url || result.data?.fileUrl;
                
                if (!url && (result.file_id || result.fileId || result.id)) {
                    const fileId = result.file_id || result.fileId || result.id;
                    url = `${GDRIVE_BASE_URL}/file/download/${fileId}`;
                }

                if (url) {
                    if (!url.startsWith('http')) {
                        url = url.startsWith('/') ? `${GDRIVE_BASE_URL}${url}` : `${GDRIVE_BASE_URL}/${url}`;
                    }
                    
                    const previewUrl = result.webViewLink || result.viewUrl || url;
                    return NextResponse.json({ url, previewUrl });
                }
            } else {
                console.warn(`[Upload API] Gateway returned ${response.status}. Falling back to local storage.`);
            }
        } catch (gatewayError) {
            console.warn('[Upload API] Gateway unreachable or failed. Falling back to local storage:', (gatewayError as any).message);
        }

        // FALLBACK: Local Storage
        console.log('[Upload API] Using local storage fallback');
        
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Define path
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        
        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = `${uniqueSuffix}-${file.name.replace(/\s+/g, '-')}`;
        const filePath = path.join(uploadDir, filename);

        await writeFile(filePath, buffer);
        const url = `/uploads/${filename}`;

        console.log(`[Upload API] Local upload successful: ${url}`);
        return NextResponse.json({ url });

    } catch (error: any) {
        console.error('[Upload API] CRITICAL ERROR:', error);
        return NextResponse.json({ 
            error: 'Upload failed', 
            details: error.message 
        }, { status: 500 });
    }
}
