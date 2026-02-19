
const API_URL = 'http://10.0.0.110:8001';
const API_TOKEN = '2a993486e7a448474de66bfaea4adba7a99784defbcaba420e7f906176b94df6';
const SERVER = 'SERVER_PROFILE_1';
const DATABASE = 'extend_db_ptrj';

async function runQuery(sql, params = {}) {
  const response = await fetch(`${API_URL}/v1/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_TOKEN,
    },
    body: JSON.stringify({
      sql,
      server: SERVER,
      database: DATABASE,
      params,
    }),
  });

  const result = await response.json();
  if (!result.success) {
    console.error('Query Error:', result.error);
    return null;
  }
  return result.data;
}

async function main() {
  const projectId = 'proj_mlqbyncqp9w7csgbia'; // From logs
  const projectAssetsTaskId = `pa_${projectId}`;
  
  console.log('Checking attachments for project:', projectId);
  console.log('Looking for taskId:', projectAssetsTaskId);
  
  const result = await runQuery(`
    SELECT id, task_id, title, LEFT(CAST(content AS NVARCHAR(MAX)), 50) as content_preview, created_at
    FROM pm_task_docs
    WHERE task_id = @taskId
  `, { taskId: projectAssetsTaskId });
  
  if (result && result.recordset.length > 0) {
    console.table(result.recordset);
  } else {
    console.log('No attachments found in DB for this project.');
    
    // Check if maybe they are stored with different prefix
    const allDocs = await runQuery(`
      SELECT TOP 10 id, task_id, title, LEFT(CAST(content AS NVARCHAR(MAX)), 50) as content_preview
      FROM pm_task_docs
      WHERE content LIKE '[FILE]%'
      ORDER BY created_at DESC
    `);
    
    if (allDocs && allDocs.recordset.length > 0) {
      console.log('Found these other file attachments in DB:');
      console.table(allDocs.recordset);
    }
  }
}

main();
