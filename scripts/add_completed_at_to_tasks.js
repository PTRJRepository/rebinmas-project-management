
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
    throw new Error(result.error || 'Query failed');
  }
  return result.data;
}

async function main() {
  console.log('Adding completed_at column to pm_tasks...');
  
  try {
    await runQuery(`
      IF NOT EXISTS (
        SELECT * FROM sys.columns 
        WHERE object_id = OBJECT_ID('pm_tasks') AND name = 'completed_at'
      )
      BEGIN
        ALTER TABLE pm_tasks ADD completed_at DATETIME NULL;
        PRINT 'Column completed_at added to pm_tasks.';
      END
      ELSE
      BEGIN
        PRINT 'Column completed_at already exists.';
      END
    `);
    
    console.log('Migration successful!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

main();
