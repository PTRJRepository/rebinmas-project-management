
import { sqlGateway } from '../lib/api/sql-gateway';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
    console.log('🔍 Debugging Projects Query...');
    console.log('----------------------------------------');

    const sql = `
    SELECT
      p.id, p.name, p.description, p.start_date, p.end_date, p.priority, p.banner_image, p.status, p.owner_id, p.created_at, p.updated_at,
      u.id as owner_id,
      u.username as owner_username,
      u.email as owner_email,
      u.name as owner_name,
      COUNT(t.id) as task_count
    FROM pm_projects p
    LEFT JOIN pm_users u ON p.owner_id = u.id
    LEFT JOIN pm_tasks t ON p.id = t.project_id
    GROUP BY p.id, p.name, p.description, p.start_date, p.end_date, p.priority, p.banner_image, p.status, p.owner_id, p.created_at, p.updated_at, u.id, u.username, u.email, u.name
    ORDER BY p.created_at DESC
  `;

    console.log('📝 Executing SQL Query:');
    //   console.log(sql);

    try {
        const result = await sqlGateway.query(sql);
        console.log('✅ Query Successful!');
        console.log(`   Rows return: ${result.recordset.length}`);
        if (result.recordset.length > 0) {
            console.log('   Sample Row:', result.recordset[0]);
        }
    } catch (error: any) {
        console.error('❌ Query Failed!');
        console.error('   Error Message:', error.message);
        if (error.sql) console.error('   SQL:', error.sql);
        // console.error('   Full Error:', error);
    }

    console.log('\n----------------------------------------');
}

main();
