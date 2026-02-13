/**
 * Push data from SQLite to SQL Server
 * 
 * This script pushes all data from local SQLite to SQL Server.
 * Run with: bun run scripts/push-to-sql-server.ts
 */

import { config } from 'dotenv';
config({ path: '.env' });

import { syncData } from '../lib/sync/sql-sync';

async function main() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║       Push Data: SQLite -> SQL Server                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('\n⚠️  This will push ALL data from SQLite to SQL Server');
    console.log('   Existing records in SQL Server will be UPDATED');
    console.log('   New records will be INSERTED\n');

    // Run the actual push (not dry run)
    const result = await syncData({ direction: 'push', dryRun: false });

    console.log('\n' + '═'.repeat(60));
    console.log('PUSH RESULTS:');
    console.log('═'.repeat(60));

    for (const table of result.tables) {
        console.log(`\n${table.name}:`);
        console.log(`   Inserted: ${table.inserted}`);
        console.log(`   Updated: ${table.updated}`);
        console.log(`   Skipped: ${table.skipped}`);
        if (table.errors > 0) {
            console.log(`   ❌ Errors: ${table.errors}`);
        }
    }

    console.log('\n' + '═'.repeat(60));

    if (result.success) {
        console.log('✅ PUSH COMPLETED SUCCESSFULLY');
    } else {
        console.log('❌ PUSH COMPLETED WITH ERRORS');
        if (result.errors.length > 0) {
            console.log('Errors:', result.errors);
        }
    }

    console.log('═'.repeat(60) + '\n');

    process.exit(result.success ? 0 : 1);
}

main().catch(console.error);
