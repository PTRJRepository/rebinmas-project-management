#!/usr/bin/env node

/**
 * Production Connection Test Script
 *
 * This script tests the SQL Gateway API connection and authentication system
 * to ensure login will work in production.
 *
 * Usage:
 *   node scripts/test-production-connection.js
 *
 * Environment Variables Required:
 *   - API_QUERY_URL: SQL Gateway API URL
 *   - API_TOKEN: SQL Gateway API Token
 */

const API_URL = process.env.API_QUERY_URL || process.env.SQL_GATEWAY_URL || 'http://10.0.0.110:8001';
const API_TOKEN = process.env.API_TOKEN || process.env.SQL_GATEWAY_TOKEN || '2a993486e7a448474de66bfaea4adba7a99784defbcaba420e7f906176b94df6';
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log('===================================');
console.log('PRODUCTION CONNECTION TEST');
console.log('===================================\n');
console.log(`Environment: ${NODE_ENV}`);
console.log(`API URL: ${API_URL}`);
console.log(`API Token: ${API_TOKEN ? `${API_TOKEN.slice(0, 8)}...` : 'NOT SET'}\n`);

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.blue}--- ${title} ---${colors.reset}`);
}

async function testHealthCheck() {
  logSection('1. Health Check');

  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();

    if (data.status === 'ok') {
      log('✓ SQL Gateway is healthy', 'green');
      log(`  Response: ${JSON.stringify(data)}`);
      return true;
    } else {
      log('✗ SQL Gateway health check failed', 'red');
      log(`  Response: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (error) {
    log('✗ Cannot connect to SQL Gateway', 'red');
    log(`  Error: ${error.message}`);
    log(`  Make sure the URL is correct: ${API_URL}`);
    return false;
  }
}

async function testServerList() {
  logSection('2. Server List');

  try {
    const response = await fetch(`${API_URL}/v1/servers`, {
      headers: {
        'x-api-key': API_TOKEN,
      },
    });

    const data = await response.json();

    if (data.success && data.data?.servers) {
      log('✓ Successfully retrieved server list', 'green');
      log(`  Servers: ${data.data.servers.join(', ')}`);
      return true;
    } else {
      log('✗ Failed to retrieve server list', 'red');
      log(`  Response: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (error) {
    log('✗ Server list request failed', 'red');
    log(`  Error: ${error.message}`);
    log('  Check your API_TOKEN');
    return false;
  }
}

async function testUserQuery() {
  logSection('3. User Query (Login System)');

  const query = 'SELECT TOP(1) id, username, email, name, role FROM pm_users';

  try {
    const response = await fetch(`${API_URL}/v1/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_TOKEN,
      },
      body: JSON.stringify({
        sql: query,
        server: 'SERVER_PROFILE_1',
        database: 'extend_db_ptrj',
      }),
    });

    const result = await response.json();

    if (result.success && result.data) {
      log('✓ User query successful', 'green');
      log(`  Users found: ${result.data.recordset?.length || 0}`);
      if (result.data.recordset?.length > 0) {
        const user = result.data.recordset[0];
        log(`  Sample user: ${user.username} (${user.email})`);
      }
      return true;
    } else {
      log('✗ User query failed', 'red');
      log(`  Error: ${result.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    log('✗ User query request failed', 'red');
    log(`  Error: ${error.message}`);
    return false;
  }
}

async function testLoginFlow() {
  logSection('4. Login Flow Test');

  const testEmail = 'test@example.com';

  const query = 'SELECT id, username, email, password, name, role FROM pm_users WHERE email = @email';

  try {
    const response = await fetch(`${API_URL}/v1/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_TOKEN,
      },
      body: JSON.stringify({
        sql: query,
        server: 'SERVER_PROFILE_1',
        database: 'extend_db_ptrj',
        params: { email: testEmail },
      }),
    });

    const result = await response.json();

    if (result.success) {
      if (result.data?.recordset?.length > 0) {
        log('✓ Login query successful (test user exists)', 'green');
        log(`  User: ${result.data.recordset[0].username}`);
        log('  Login will work with correct password');
      } else {
        log('⚠ No user found with test email', 'yellow');
        log('  This is expected if test user does not exist');
        log('  Login will work for registered users');
      }
      return true;
    } else {
      log('✗ Login flow test failed', 'red');
      log(`  Error: ${result.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    log('✗ Login flow test request failed', 'red');
    log(`  Error: ${error.message}`);
    return false;
  }
}

function checkEnvironment() {
  logSection('5. Environment Check');

  const isProduction = NODE_ENV === 'production';
  const isLocalhost = API_URL.includes('localhost') ||
                       API_URL.includes('127.0.0.1') ||
                       API_URL.includes('10.0.0.');

  if (isProduction && isLocalhost) {
    log('⚠ WARNING: NODE_ENV=production but using local IP!', 'yellow');
    log('  This will NOT work in production!');
    log(`  Current API_URL: ${API_URL}`);
    log('  Update to production URL before deploying');
    return false;
  }

  if (isProduction) {
    log('✓ Running in production mode', 'green');
    log('  Cookie secure flag will be enabled (HTTPS required)');
  } else {
    log('⚠ Running in development mode', 'yellow');
    log('  Cookie secure flag is disabled');
  }

  if (API_URL.startsWith('https://')) {
    log('✓ Using HTTPS for SQL Gateway', 'green');
  } else if (isProduction) {
    log('⚠ WARNING: Using HTTP in production!', 'yellow');
    log('  Consider using HTTPS for better security');
  }

  return true;
}

async function main() {
  const results = {
    healthCheck: false,
    serverList: false,
    userQuery: false,
    loginFlow: false,
    environment: checkEnvironment(),
  };

  results.healthCheck = await testHealthCheck();
  results.serverList = await testServerList();
  results.userQuery = await testUserQuery();
  results.loginFlow = await testLoginFlow();

  // Summary
  console.log('\n===================================');
  console.log('TEST SUMMARY');
  console.log('===================================\n');

  const allPassed = Object.values(results).every(v => v === true);

  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✓ PASS' : '✗ FAIL';
    const color = passed ? 'green' : 'red';
    log(`${status} - ${test}`, color);
  });

  console.log('\n===================================');

  if (allPassed) {
    log('ALL TESTS PASSED!', 'green');
    log('Login system should work in production.', 'green');
  } else {
    log('SOME TESTS FAILED!', 'red');
    log('Please fix the issues before deploying.', 'red');
  }

  console.log('===================================\n');

  // Recommendations
  if (!results.healthCheck || !results.serverList) {
    log('RECOMMENDATIONS:', 'yellow');
    log('1. Check if SQL Gateway is running', 'yellow');
    log('2. Verify API_QUERY_URL is correct', 'yellow');
    log('3. Check network connectivity from production server', 'yellow');
  }

  if (!results.userQuery || !results.loginFlow) {
    log('RECOMMENDATIONS:', 'yellow');
    log('1. Verify API_TOKEN is valid', 'yellow');
    log('2. Check database permissions', 'yellow');
    log('3. Ensure pm_users table exists in extend_db_ptrj', 'yellow');
  }

  process.exit(allPassed ? 0 : 1);
}

main().catch(error => {
  log(`\nUnexpected error: ${error.message}`, 'red');
  process.exit(1);
});
