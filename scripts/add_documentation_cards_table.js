// Use native fetch (Node.js 18+)
// const fetch = require('node-fetch');

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
  console.log('Creating pm_task_docs table...');
  
  try {
    // Create pm_task_docs table
    await runQuery(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'pm_task_docs')
      BEGIN
        CREATE TABLE pm_task_docs (
          id NVARCHAR(50) PRIMARY KEY,
          task_id NVARCHAR(50) NOT NULL,
          title NVARCHAR(255) NOT NULL,
          content NVARCHAR(MAX) NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        PRINT 'Table pm_task_docs created.';
      END
      ELSE
      BEGIN
        PRINT 'Table pm_task_docs already exists.';
      END
    `);
    
    console.log('Migration successful!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

main();
