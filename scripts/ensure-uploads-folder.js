const fs = require('fs');
const path = require('path');

// Possible locations for uploads folder
const possiblePaths = [
    // Standard Next.js build output
    path.join(__dirname, '..', 'public', 'uploads'),
    // Standalone build output
    path.join(__dirname, '..', '.next', 'standalone', 'public', 'uploads'),
];

console.log('[ensure-uploads-folder] Checking uploads folder locations...');

for (const uploadsPath of possiblePaths) {
    try {
        if (!fs.existsSync(uploadsPath)) {
            fs.mkdirSync(uploadsPath, { recursive: true });
            console.log(`[ensure-uploads-folder] Created: ${uploadsPath}`);
        } else {
            console.log(`[ensure-uploads-folder] Already exists: ${uploadsPath}`);
        }
    } catch (err) {
        console.warn(`[ensure-uploads-folder] Could not create ${uploadsPath}: ${err.message}`);
    }
}

console.log('[ensure-uploads-folder] Done!');
