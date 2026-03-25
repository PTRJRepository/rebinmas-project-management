import fs from 'fs';
import { createAttachment, getAttachmentsByProject, getProjects } from '../../lib/api/projects';

async function runCleanTest() {
    try {
        const result: any = { status: "started", logs: [] };
        const log = (msg: string) => result.logs.push(msg);

        const projects = await getProjects();
        if (projects.length === 0) {
            result.status = "failed";
            result.error = "No projects found";
            fs.writeFileSync('_dev_utils/tests/test_result.json', JSON.stringify(result, null, 2));
            return;
        }
        
        const testProject = projects[0];
        log(`Using Project: ${testProject.id}`);

        const dummyFileName = `dummy-clean-asset-${Date.now()}.png`;
        const dummyFileUrl = `https://example.com/uploads/${dummyFileName}`;
        
        log(`Creating attachment ${dummyFileName}`);
        const attachment = await createAttachment({
            projectId: testProject.id,
            fileName: dummyFileName,
            fileUrl: dummyFileUrl,
            fileType: 'image/png',
            fileSize: 4096,
        });

        log(`Fetching assets for project...`);
        const projectAssets = await getAttachmentsByProject(testProject.id);
        result.totalAssets = projectAssets.length;
        
        const found = projectAssets.find((a: any) => a.id === attachment.id);
        
        if (found) {
            result.status = "success";
            result.message = "Successfully uploaded and retrieved the asset!";
            result.foundAsset = found;
        } else {
            result.status = "failed";
            result.error = "Asset was uploaded but not returned in `getAttachmentsByProject`.";
        }

        fs.writeFileSync('_dev_utils/tests/test_result.json', JSON.stringify(result, null, 2));
        process.exit(0);
    } catch (e: any) {
        fs.writeFileSync('_dev_utils/tests/test_result.json', JSON.stringify({ status: "error", message: e.message }));
        process.exit(1);
    }
}
runCleanTest();
