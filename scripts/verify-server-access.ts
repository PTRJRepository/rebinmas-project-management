/**
 * Verify Server Access & Connectivity
 * 
 * Run with: bun run scripts/verify-server-access.ts
 */

import { networkInterfaces } from 'os';
import { sqlGateway } from '../lib/api/sql-gateway';

async function main() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║       Server Access Diagnostic Utility                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    // 1. Check Network Interfaces
    console.log('\n📡 Network Interfaces (Server IPs):');
    const nets = networkInterfaces();
    const results = Object.create(null);

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]!) {
            // Skip internal (i.e. 127.0.0.1) and non-IPv4 addresses
            if (net.family === 'IPv4' && !net.internal) {
                if (!results[name]) {
                    results[name] = [];
                }
                results[name].push(net.address);
            }
        }
    }

    if (Object.keys(results).length === 0) {
        console.log('   ⚠️  No external IPv4 interfaces found. Server might be isolated.');
    } else {
        for (const name of Object.keys(results)) {
            for (const ip of results[name]) {
                console.log(`   - ${name}: http://${ip}:3000`);
            }
        }
        console.log('\n   👉 Try accessing these URLs from your browser.');
    }

    // 2. Check Database Connectivity
    console.log('\n🔄 Checking Database Connectivity (SQL Gateway)...');
    try {
        const isConnected = await sqlGateway.healthCheck();
        if (isConnected) {
            console.log('   ✅ SQL Gateway is REACHABLE.');
        } else {
            console.log('   ❌ SQL Gateway is UNREACHABLE.');
            console.log('      Check if the server can access the SQL Gateway IP.');
        }
    } catch (error: any) {
        console.log('   ❌ Error connecting to SQL Gateway:', error.message);
    }

    console.log('\n📋 Environment Configuration:');
    console.log(`   - SQL_GATEWAY_URL: ${process.env.SQL_GATEWAY_URL || process.env.API_QUERY_URL || 'Not Set (Using Default)'}`);
    console.log(`   - NODE_ENV: ${process.env.NODE_ENV}`);

    console.log('\n💡 Troubleshooting Tips:');
    console.log('   1. If the app is running but you cannot access it, check your server FIREWALL (allow port 3000).');
    console.log('   2. Ensure "bun run start" is running.');
    console.log('   3. If database fails, ensure this server has access to the SQL Gateway network.');
    console.log('\n');
}

main().catch(console.error);
