
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

async function migrate_soft_delete() {
    console.log('Starting Soft Delete Migration...');

    console.log('1. Checking deleted_at column in pm_projects...');
    const colExists = await runQuery(`
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pm_projects' AND column_name = 'deleted_at'
    `);

    if (colExists && colExists.data.recordset.length === 0) {
        console.log('   Adding deleted_at column...');
        await runQuery(`
            ALTER TABLE pm_projects ADD deleted_at DATETIME;
        `);
        console.log('   Column deleted_at added successfully.');
    } else {
        console.log('   Column deleted_at already exists.');
    }

    console.log('Migration Completed!');
}

migrate_soft_delete();
