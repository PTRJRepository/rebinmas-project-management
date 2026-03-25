import { sqlGateway } from '../../lib/api/sql-gateway';
import { getProjects } from '../../lib/api/projects';

async function debugDB() {
    try {
        const projects = await getProjects();
        if (projects.length === 0) return;
        const testProject = projects[0];
        
        console.log(`Checking project ID: ${testProject.id}`);
        const pa_id = `pa_${testProject.id}`;
        
        // 1. Direct query what's recorded
        const result = await sqlGateway.query(`
            SELECT id, task_id, title, CAST(content AS NVARCHAR(MAX)) as content 
            FROM pm_task_docs 
            WHERE task_id = @taskId
        `, { taskId: pa_id });
        
        console.log(`Query found ${result.recordset.length} docs`);
        
        if (result.recordset.length > 0) {
            console.log("Sample doc content:", result.recordset[0].content);
        } else {
             // Let's just find exactly 1 newly uploaded file to see what task_id it got
             const anyResult = await sqlGateway.query(`
                SELECT TOP 1 id, task_id, title, CAST(content AS NVARCHAR(MAX)) as content 
                FROM pm_task_docs 
                WHERE title LIKE 'dummy-test-asset-%'
                ORDER BY created_at DESC
             `);
             console.log("Looking globally for dummy asset:");
             if (anyResult.recordset.length > 0) {
                 console.log("Found:", anyResult.recordset[0]);
             } else {
                 console.log("NOTHING FOUND AT ALL globally.");
             }
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
debugDB();
