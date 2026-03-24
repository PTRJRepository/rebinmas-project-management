import { sqlGateway } from '../../lib/api/sql-gateway';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function addTagsToProjects() {
    console.log('Adding "tags" column to pm_projects table...');

    try {
        // Check if the column already exists
        const checkResult = await sqlGateway.query(`
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'pm_projects' AND COLUMN_NAME = 'tags'
        `);

        if (checkResult.recordset.length > 0) {
            console.log('Column "tags" already exists in pm_projects table.');
            return;
        }

        // Add the column
        await sqlGateway.query(`
            ALTER TABLE pm_projects
            ADD tags NVARCHAR(MAX) NULL
        `);

        console.log('Successfully added "tags" column to pm_projects table.');

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

addTagsToProjects().then(() => process.exit(0));
