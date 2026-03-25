import { createAttachment, getAttachmentsByProject, getProjects } from '../../lib/api/projects';

async function runTest() {
    console.log("=== Starting Asset Upload Backend Test ===");
    try {
        // 1. Get an existing project to test on
        const projects = await getProjects();
        if (projects.length === 0) {
            console.error("No projects found to test on! Create a project first.");
            process.exit(1);
        }
        const testProject = projects[0];
        console.log(`Using Project: "${testProject.name}" (ID: ${testProject.id})`);

        // 2. Create a dummy attachment
        const dummyFileName = `dummy-test-asset-${Date.now()}.png`;
        const dummyFileUrl = `https://example.com/uploads/${dummyFileName}`;
        
        console.log(`\n[Test Action] Simulating upload (creating attachment) for: ${dummyFileName}`);
        const attachment = await createAttachment({
            projectId: testProject.id,
            fileName: dummyFileName,
            fileUrl: dummyFileUrl,
            fileType: 'image/png',
            fileSize: 2048,
        });
        
        console.log("✅ Dummy asset created successfully in the database!");
        console.log(attachment);

        // 3. Verify retrieving attachments for the project
        console.log(`\n[Test Action] Fetching assets for Project ID: ${testProject.id}`);
        const projectAssets = await getAttachmentsByProject(testProject.id);

        console.log(`Total assets returned for this project: ${projectAssets.length}`);
        const found = projectAssets.find(a => a.id === attachment.id);
        
        if (found) {
            console.log("\n✅ SUCCESS! The newly uploaded asset is available in the project assets list and ready for preview.");
            console.log("Asset Preview URL:", found.previewUrl);
        } else {
            console.error("\n❌ FAILURE! The newly uploaded asset was NOT found in the project assets list.");
        }
        process.exit(0);
    } catch (e) {
        console.error("\n❌ Test execution failed with error:", e);
        process.exit(1);
    }
}

runTest();
