
const { sqlGateway } = require('../lib/api/sql-gateway');

async function main() {
    try {
        console.log('Checking pm_project_members table...');
        const result = await sqlGateway.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'pm_project_members'
    `);

        if (result.recordset.length > 0) {
            console.log('✅ Table pm_project_members EXISTS');
        } else {
            console.log('❌ Table pm_project_members DOES NOT EXIST');
        }

        console.log('Checking pm_projects columns...');
        const columns = await sqlGateway.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pm_projects'
    `);

        const columnNames = columns.recordset.map(c => c.column_name);
        console.log('Project columns:', columnNames.join(', '));

        if (columnNames.includes('created_by')) {
            console.log('✅ Column created_by EXISTS');
        } else {
            console.log('❌ Column created_by DOES NOT EXIST');
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Mocking sqlGateway for the script since we can't import TS directly in JS script easily without compilation
// But wait, the user environment supports bun, so I can run TS scripts directly?
// Let's try to make it a .ts file or use bun to run it.
// Actually, I can use the existing `scripts/test-production-connection.js` pattern which uses fetch.

const API_URL = process.env.API_QUERY_URL || 'http://10.0.0.110:8001';
const API_TOKEN = process.env.API_TOKEN || '2a993486e7a448474de66bfaea4adba7a99784defbcaba420e7f906176b94df6';

async function checkSchema() {
    console.log('Checking Schema via API...');

    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('pm_project_members', 'pm_projects')
    `;

    try {
        const response = await fetch(`${API_URL}/v1/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_TOKEN,
            },
            body: JSON.stringify({
                sql: query,
                server: 'SERVER_PROFILE_1',
                database: 'extend_db_ptrj'
            }),
        });

        const data = await response.json();
        if (data.success) {
            console.log('Tables found:', data.data.recordset.map(r => r.table_name));
        } else {
            console.error('Query failed:', data.error);
        }

        // Check columns for pm_projects
        const colQuery = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'pm_projects'
        `;
        const colResponse = await fetch(`${API_URL}/v1/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': API_TOKEN },
            body: JSON.stringify({ sql: colQuery, server: 'SERVER_PROFILE_1', database: 'extend_db_ptrj' }),
        });
        const colData = await colResponse.json();
        if (colData.success) {
            console.log('pm_projects columns:', colData.data.recordset.map(r => r.column_name));
        }

    } catch (e) {
        console.error('Fetch error:', e);
    }
}

checkSchema();
