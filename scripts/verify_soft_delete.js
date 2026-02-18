
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
        if (!data.success) throw new Error(data.error);
        return data.data.recordset;
    } catch (e) {
        console.error('Query Error:', e.message);
        return null;
    }
}

async function verifySoftDelete() {
    console.log('--- Verifying Soft Delete ---');

    // 1. Create a test project
    console.log('1. Creating test project...');
    const ownerId = 'user_cm734dbu90000356sl1562142'; // Using a known user or fetch one
    const pId = 'proj_test_' + Date.now();

    await runQuery(`
        INSERT INTO pm_projects (id, name, owner_id, status, created_at, updated_at)
        VALUES (@id, 'Tes Soft Delete', 'user_cm734dbu90000356sl1562142', 'RENCANA', GETDATE(), GETDATE())
    `, { id: pId });

    // 2. Soft delete it
    console.log(`2. Soft deleting project ${pId}...`);
    await runQuery(`UPDATE pm_projects SET deleted_at = GETDATE() WHERE id = @id`, { id: pId });

    // 3. Verify it is deleted (deleted_at IS NOT NULL)
    const deleted = await runQuery(`SELECT deleted_at FROM pm_projects WHERE id = @id`, { id: pId });
    if (deleted && deleted[0].deleted_at) {
        console.log('✅ Project soft deleted successfully.');
    } else {
        console.error('❌ Project NOT soft deleted.');
    }

    // 4. Restore it
    console.log('3. Restoring project...');
    await runQuery(`UPDATE pm_projects SET deleted_at = NULL WHERE id = @id`, { id: pId });
    const restored = await runQuery(`SELECT deleted_at FROM pm_projects WHERE id = @id`, { id: pId });
    if (restored && restored[0].deleted_at === null) {
        console.log('✅ Project restored successfully.');
    } else {
        console.error('❌ Project NOT restored.');
    }

    // 5. Permanent delete
    console.log('4. Permanently deleting project...');
    await runQuery(`DELETE FROM pm_projects WHERE id = @id`, { id: pId });
    const gone = await runQuery(`SELECT id FROM pm_projects WHERE id = @id`, { id: pId });
    if (gone && gone.length === 0) {
        console.log('✅ Project permanently deleted.');
    } else {
        console.error('❌ Project still exists.');
    }
}

verifySoftDelete();
