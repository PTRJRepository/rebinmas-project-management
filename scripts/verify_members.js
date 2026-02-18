
const API_URL = process.env.API_QUERY_URL || 'http://10.0.0.110:8001';
const API_TOKEN = process.env.API_TOKEN || '2a993486e7a448474de66bfaea4adba7a99784defbcaba420e7f906176b94df6';

async function verify() {
    console.log('Verifying pm_project_members table...');
    try {
        const response = await fetch(`${API_URL}/v1/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': API_TOKEN },
            body: JSON.stringify({
                sql: "SELECT COUNT(*) as count FROM pm_project_members",
                server: 'SERVER_PROFILE_1',
                database: 'extend_db_ptrj'
            }),
        });
        const data = await response.json();
        if (data.success) {
            console.log('✅ Table pm_project_members exists! Count:', data.data.recordset[0].count);
        } else {
            console.error('❌ Query Failed:', data.error);
        }
    } catch (e) {
        console.error('Fetch Error:', e);
    }
}

verify();
