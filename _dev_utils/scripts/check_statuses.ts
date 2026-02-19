
import { sqlGateway } from '../../lib/api/sql-gateway';

async function main() {
    console.log('Fetching projects...');
    const projects = await sqlGateway.query('SELECT id, name FROM pm_projects');
    console.log('Projects:', projects.recordset);

    for (const p of projects.recordset) {
        const statuses = await sqlGateway.query('SELECT id, name, [order] FROM pm_task_statuses WHERE project_id = @id ORDER BY [order]', { id: p.id });
        console.log(`\nStatuses for Project "${p.name}" (${p.id}):`);
        console.table(statuses.recordset);
    }
}

main().catch(console.error);
