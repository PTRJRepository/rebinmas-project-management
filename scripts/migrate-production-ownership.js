/**
 * Production Migration Script - Ownership System
 *
 * This script executes the ownership system migration on the production
 * SQL Server database via the SQL Gateway API.
 *
 * Usage:
 *   node scripts/migrate-production-ownership.js
 *
 * Environment variables (set in .env.local or production environment):
 *   - SQL_GATEWAY_URL: URL of the SQL Gateway API
 *   - SQL_GATEWAY_TOKEN: API token for SQL Gateway
 *   - SQL_GATEWAY_SERVER: Server profile (default: SERVER_PROFILE_1)
 *   - SQL_GATEWAY_DATABASE: Database name (default: extend_db_ptrj)
 */

// SQL Gateway configuration
const SQL_GATEWAY_URL = process.env.SQL_GATEWAY_URL || 'http://10.0.0.110:8001';
const SQL_GATEWAY_TOKEN = process.env.SQL_GATEWAY_TOKEN || '';
const SQL_GATEWAY_SERVER = process.env.SQL_GATEWAY_SERVER || 'SERVER_PROFILE_1';
const SQL_GATEWAY_DATABASE = process.env.SQL_GATEWAY_DATABASE || 'extend_db_ptrj';

/**
 * Execute SQL query via SQL Gateway API
 */
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
    throw new Error(`SQL Gateway error: ${response.status} - ${result.error || 'Unknown error'}`);
  }

  return result;
}

/**
 * Migration SQL script
 */
const MIGRATION_SQL = `
-- ==================================================
-- Migration: Add Project Ownership System
-- Date: 2026-02-17
-- Description: Creates pm_project_members table for ownership-based access control
-- ==================================================

-- Create project members table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'pm_project_members')
BEGIN
    CREATE TABLE pm_project_members (
        id VARCHAR(255) PRIMARY KEY,
        project_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
        joined_at DATETIME DEFAULT GETDATE(),
        added_by VARCHAR(255),
        CONSTRAINT fk_pm_members_project FOREIGN KEY (project_id)
            REFERENCES pm_projects(id) ON DELETE CASCADE,
        CONSTRAINT fk_pm_members_user FOREIGN KEY (user_id)
            REFERENCES pm_users(id) ON DELETE CASCADE,
        CONSTRAINT fk_pm_members_added_by FOREIGN KEY (added_by)
            REFERENCES pm_users(id) ON DELETE SET NULL,
        CONSTRAINT uq_project_member UNIQUE (project_id, user_id)
    );

    PRINT 'Table pm_project_members created successfully';
END
ELSE
BEGIN
    PRINT 'Table pm_project_members already exists';
END

-- Add indexes for performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_pm_members_project' AND object_id = OBJECT_ID('pm_project_members'))
BEGIN
    CREATE INDEX idx_pm_members_project ON pm_project_members(project_id);
    PRINT 'Index idx_pm_members_project created';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_pm_members_user' AND object_id = OBJECT_ID('pm_project_members'))
BEGIN
    CREATE INDEX idx_pm_members_user ON pm_project_members(user_id);
    PRINT 'Index idx_pm_members_user created';
END

-- Add created_by column to pm_projects if not exists
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('pm_projects') AND name = 'created_by')
BEGIN
    ALTER TABLE pm_projects ADD created_by VARCHAR(255);
    PRINT 'Column created_by added to pm_projects';
END

-- Add foreign key constraint for created_by
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'fk_projects_created_by')
BEGIN
    ALTER TABLE pm_projects ADD CONSTRAINT fk_projects_created_by
        FOREIGN KEY (created_by) REFERENCES pm_users(id) ON DELETE SET NULL;
    PRINT 'Foreign key fk_projects_created_by added';
END

-- ==================================================
-- BACKFILL: Migrate existing owners to pm_project_members
-- ==================================================

-- Insert existing owners as OWNER in members table
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

PRINT 'Backfill completed: Existing owners added to pm_project_members';

-- Update existing records to set created_by = owner_id
UPDATE pm_projects
SET created_by = owner_id
WHERE created_by IS NULL AND owner_id IS NOT NULL;

PRINT 'Backfill completed: created_by set for existing projects';

-- ==================================================
-- VERIFICATION
-- ==================================================

-- Show summary
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
FROM pm_project_members;

PRINT 'Migration completed successfully!';
`;

/**
 * Split SQL into batches (GO statements are not supported via API)
 */
function splitSQLIntoBatches(sql) {
  // Split by GO statements (case-insensitive, must be on its own line)
  const batches = sql.split(/\nGO\n|\nGO\r\n/i);
  return batches
    .map(batch => batch.trim())
    .filter(batch => batch.length > 0);
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('🚀 Starting ownership system migration...');
  console.log(`📡 SQL Gateway: ${SQL_GATEWAY_URL}`);
  console.log(`🗄️  Database: ${SQL_GATEWAY_DATABASE}`);
  console.log('');

  try {
    // Check SQL Gateway connection
    console.log('🔍 Checking SQL Gateway connection...');
    const testResult = await executeSQL('SELECT GETDATE() as server_time');
    console.log(`✅ SQL Gateway connected. Server time: ${testResult.data.recordset[0].server_time}`);
    console.log('');

    // Check if table already exists
    console.log('🔍 Checking existing schema...');
    const tableCheck = await executeSQL(`
      SELECT COUNT(*) as count FROM sys.tables WHERE name = 'pm_project_members'
    `);
    const tableExists = tableCheck.data.recordset[0].count > 0;
    console.log(tableExists ? '⚠️  Table pm_project_members already exists' : '✅ Table pm_project_members does not exist yet');
    console.log('');

    // Split migration into batches
    const batches = splitSQLIntoBatches(MIGRATION_SQL);
    console.log(`📝 Executing ${batches.length} SQL batches...`);
    console.log('');

    let successCount = 0;
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`[${i + 1}/${batches.length}] Executing batch...`);

      try {
        const result = await executeSQL(batch);

        // Print any messages from SQL PRINT statements
        if (result.data && result.data.recordset && result.data.recordset.length > 0) {
          for (const row of result.data.recordset) {
            if (row.metric) {
              console.log(`   ${row.metric}: ${row.value}`);
            }
          }
        }

        successCount++;
      } catch (error) {
        console.error(`   ❌ Batch ${i + 1} failed:`, error.message);
        // Continue with other batches
      }
    }

    console.log('');
    console.log('=================================================');
    console.log(`✅ Migration completed: ${successCount}/${batches.length} batches successful`);
    console.log('=================================================');
    console.log('');
    console.log('📊 Final verification:');
    console.log('');

    // Run final verification query
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
    console.log('');
    console.log('🔄 Next steps:');
    console.log('   1. Verify the data above looks correct');
    console.log('   2. Restart the production server to load new code');
    console.log('   3. Test login and access control with production data');

  } catch (error) {
    console.error('');
    console.error('❌ Migration failed:', error.message);
    console.error('');
    console.error('Please check:');
    console.error('   - SQL Gateway URL is correct');
    console.error('   - SQL Gateway token is valid');
    console.error('   - Database exists and is accessible');
    process.exit(1);
  }
}

// Run the migration
runMigration();
