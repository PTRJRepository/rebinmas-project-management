/**
 * Simplified Migration Script - Create pm_project_members table only
 */

const SQL_GATEWAY_URL = process.env.SQL_GATEWAY_URL || 'http://10.0.0.110:8001';
const SQL_GATEWAY_TOKEN = process.env.SQL_GATEWAY_TOKEN || '2a993486e7a448474de66bfaea4adba7a99784defbcaba420e7f906176b94df6';
const SQL_GATEWAY_SERVER = process.env.SQL_GATEWAY_SERVER || 'SERVER_PROFILE_1';
const SQL_GATEWAY_DATABASE = process.env.SQL_GATEWAY_DATABASE || 'extend_db_ptrj';

async function executeSQL(sql) {
  const response = await fetch(`${SQL_GATEWAY_URL}/v1/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': SQL_GATEWAY_TOKEN,
    },
    body: JSON.stringify({
      sql,
      server: SQL_GATEWAY_SERVER,
      database: SQL_GATEWAY_DATABASE,
    }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(`SQL Gateway error: ${result.error || 'Unknown error'}`);
  }

  return result;
}

async function runMigration() {
  console.log('🚀 Starting simplified migration...');
  console.log(`📡 SQL Gateway: ${SQL_GATEWAY_URL}`);
  console.log(`🗄️  Database: ${SQL_GATEWAY_DATABASE}`);
  console.log('');

  try {
    // Step 1: Create the table
    console.log('📝 Creating pm_project_members table...');
    await executeSQL(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'pm_project_members')
      BEGIN
          CREATE TABLE pm_project_members (
              id VARCHAR(255) PRIMARY KEY,
              project_id VARCHAR(255) NOT NULL,
              user_id VARCHAR(255) NOT NULL,
              role VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
              joined_at DATETIME DEFAULT GETDATE(),
              added_by VARCHAR(255)
          );
          PRINT 'Table pm_project_members created';
      END
      ELSE
      BEGIN
          PRINT 'Table pm_project_members already exists';
      END
    `);
    console.log('✅ Table created (or already exists)');
    console.log('');

    // Step 2: Create indexes
    console.log('📝 Creating indexes...');
    await executeSQL(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_pm_members_project' AND object_id = OBJECT_ID('pm_project_members'))
      BEGIN
          CREATE INDEX idx_pm_members_project ON pm_project_members(project_id);
          PRINT 'Index idx_pm_members_project created';
      END
    `);
    console.log('✅ Index created (or already exists)');
    console.log('');

    // Step 3: Backfill existing owners
    console.log('📝 Backfilling existing project owners...');
    const backfillResult = await executeSQL(`
      INSERT INTO pm_project_members (id, project_id, user_id, role, joined_at)
      SELECT
          'pm_' + CONVERT(VARCHAR(255), NEWID()) as id,
          p.id as project_id,
          p.owner_id as user_id,
          'OWNER' as role,
          ISNULL(p.created_at, GETDATE()) as joined_at
      FROM pm_projects p
      WHERE p.owner_id IS NOT NULL
      AND NOT EXISTS (
          SELECT 1 FROM pm_project_members pm
          WHERE pm.project_id = p.id AND pm.user_id = p.owner_id
      );

      SELECT @@ROWCOUNT as rows_affected;
    `);
    console.log(`✅ Backfilled ${backfillResult.data.recordset[0].rows_affected} project owners`);
    console.log('');

    // Step 4: Verification
    console.log('📊 Verification:');
    const verifyResult = await executeSQL(`
      SELECT
          'Total Projects' as metric,
          COUNT(*) as value
      FROM pm_projects
      UNION ALL
      SELECT
          'Projects with owner_id' as metric,
          COUNT(*) as value
      FROM pm_projects WHERE owner_id IS NOT NULL
      UNION ALL
      SELECT
          'Project Members (Owners)' as metric,
          COUNT(*) as value
      FROM pm_project_members WHERE role = 'OWNER'
      UNION ALL
      SELECT
          'Total Project Members' as metric,
          COUNT(*) as value
      FROM pm_project_members
    `);

    for (const row of verifyResult.data.recordset) {
      console.log(`   ${row.metric}: ${row.value}`);
    }
    console.log('');
    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('');
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
