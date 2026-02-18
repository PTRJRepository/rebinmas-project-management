
const { chromium } = require('playwright');

(async () => {
    // 1. Launch browser
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // 2. Navigate to projects page
        console.log('Navigating to projects page...');
        await page.goto('http://localhost:3000/projects');

        // 3. Create a test project to delete
        console.log('Creating a test project...');
        await page.click('button:has-text("Proyek Baru")');
        await page.fill('input[name="name"]', 'Test Trash Project');
        await page.click('button:has-text("Simpan")');

        // 4. Move to Trash
        console.log('Moving project to trash...');
        await page.click('button[title="Hapus"]'); // Assuming delete button has title="Hapus" or similar based on UI analysis
        // Note: The UI code uses `handleMoveToTrash` which likely triggers a toast. 
        // We need to confirm the project is gone from active view.

        // 5. Switch to Trash View
        console.log('Switching to Trash view...');
        await page.click('button:has-text("Sampah")');

        // 6. Verify project is in Trash
        console.log('Verifying project in Trash...');
        const trashProject = await page.waitForSelector('text=Test Trash Project');
        if (trashProject) {
            console.log('✅ Project found in Trash.');
        } else {
            console.error('❌ Project NOT found in Trash.');
        }

        // 7. Restore Project
        console.log('Restoring project...');
        await page.click('button[title="Pulihkan"]');

        // 8. Verify project is back in Active View
        console.log('Verifying project back in Active view...');
        await page.click('button:has-text("Aktif")');
        const activeProject = await page.waitForSelector('text=Test Trash Project');
        if (activeProject) {
            console.log('✅ Project restored successfully.');
        } else {
            console.error('❌ Project NOT restored.');
        }

        // 9. Cleanup: Move to Trash and Delete Permanently
        console.log('Cleaning up...');
        await page.click('button[title="Hapus"]'); // Move to trash again
        await page.click('button:has-text("Sampah")');
        await page.click('button[title="Hapus Permanen"]');

        // Handle confirmation dialog if any
        page.on('dialog', dialog => dialog.accept());

        console.log('✅ Cleanup complete.');

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        await browser.close();
    }
})();
