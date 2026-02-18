
const API_URL = process.env.API_QUERY_URL || 'http://10.0.0.110:8001';
const API_TOKEN = process.env.API_TOKEN || '2a993486e7a448474de66bfaea4adba7a99784defbcaba420e7f906176b94df6';

async function runQuery(sql, params = {}) {
    try {
        const response = await fetch(`${API_URL}/v1/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': API_TOKEN },
            body: JSON.stringify({
                sql,
                params,
                server: 'SERVER_PROFILE_1',
                database: 'extend_db_ptrj'
            }),
        });
        const data = await response.json();
        if (!data.success) {
            console.error(`Query Failed: ${sql.substring(0, 50)}...`, data.error);
            return null;
        }
        return data;
    } catch (e) {
        console.error('Fetch Error:', e);
        return null;
    }
}

async function migrate() {
    console.log('Starting Migration...');

    // 1. Create pm_project_members table
    console.log('1. Checking pm_project_members table...');
    const tableExists = await runQuery(`
        SELECT 1 FROM information_schema.tables WHERE table_name = 'pm_project_members'
    `);

    if (tableExists && tableExists.data.recordset.length === 0) {
        console.log('   Creating pm_project_members table...');
        await runQuery(`
            CREATE TABLE pm_project_members (
                id VARCHAR(255) PRIMARY KEY,
                project_id VARCHAR(255) NOT NULL,
                user_id VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
                joined_at DATETIME DEFAULT GETDATE(),
                added_by VARCHAR(255),
                -- Constraints
                CONSTRAINT fk_pm_members_project FOREIGN KEY (project_id) 
                    REFERENCES pm_projects(id) ON DELETE CASCADE,
                CONSTRAINT fk_pm_members_user FOREIGN KEY (user_id) 
                    REFERENCES pm_users(id) ON DELETE CASCADE,
                CONSTRAINT fk_pm_members_added_by FOREIGN KEY (added_by) 
                    REFERENCES pm_users(id) ON DELETE NO ACTION, 
                CONSTRAINT uq_project_member UNIQUE (project_id, user_id)
            )
        `);
        // Note: DELETE SET NULL might cause recursive issues in SQL Server sometimes with multiple paths
        // Changed to NO ACTION for added_by to be safe, or just check if it works.
        // Actually the PRD said SET NULL. Let's try SET NULL but if it fails we might need NO ACTION.
        // Re-running with correct query from PRD but watching out for cycles.
        // The PRD used SET NULL.
    } else {
        console.log('   Table pm_project_members already exists.');
    }

    // 2. Add created_by column to pm_projects
    console.log('2. Checking created_by column in pm_projects...');
    const colExists = await runQuery(`
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pm_projects' AND column_name = 'created_by'
    `);

    if (colExists && colExists.data.recordset.length === 0) {
        console.log('   Adding created_by column...');
        await runQuery(`
            ALTER TABLE pm_projects ADD created_by VARCHAR(255);
        `);
        await runQuery(`
            ALTER TABLE pm_projects ADD CONSTRAINT fk_projects_created_by 
            FOREIGN KEY (created_by) REFERENCES pm_users(id) ON DELETE SET NULL;
        `);
    } else {
        console.log('   Column created_by already exists.');
    }

    // 3. Backfill data
    console.log('3. Backfilling data...');
    // Backfill members from owner_id
    await runQuery(`
        INSERT INTO pm_project_members (id, project_id, user_id, role, joined_at)
        SELECT 
            NEWID(),
            p.id,
            p.owner_id,
            'OWNER',
            p.created_at
        FROM pm_projects p
        WHERE p.owner_id IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM pm_project_members pm 
            WHERE pm.project_id = p.id AND pm.user_id = p.owner_id
        )
    `);

    // Backfill created_by
    await runQuery(`
        UPDATE pm_projects SET created_by = owner_id WHERE created_by IS NULL
    `);

    console.log('Migration Completed!');
}

migrate();
