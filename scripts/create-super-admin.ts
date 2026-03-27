/**
 * Create Super Admin User Script
 *
 * This script creates the SUPER_ADMIN user admin@mail.com with password admin123
 *
 * Run: npx ts-node scripts/create-super-admin.ts
 */

import * as bcrypt from 'bcryptjs';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  server?: string;
  db?: string;
  execution_ms?: number;
}

interface QueryResult {
  recordset: any[];
  rowsAffected: number[];
}

const CONFIG = {
  API_URL: 'http://10.0.0.110:8001',
  API_TOKEN: '2a993486e7a448474de66bfaea4adba7a99784defbcaba420e7f906176b94df6',
  SERVER: 'SERVER_PROFILE_1',
  DATABASE: 'extend_db_ptrj',
};

async function query(sql: string, params?: Record<string, any>): Promise<QueryResult> {
  const response = await fetch(`${CONFIG.API_URL}/v1/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CONFIG.API_TOKEN,
    },
    body: JSON.stringify({
      sql,
      server: CONFIG.SERVER,
      database: CONFIG.DATABASE,
      params,
    }),
  });

  const result: ApiResponse = await response.json();

  if (!result.success) {
    throw new Error(`Query failed: ${result.error}`);
  }

  return result.data as QueryResult;
}

function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `${prefix}${timestamp}${random}`;
}

async function main() {
  console.log('==========================================');
  console.log(' Create Super Admin User');
  console.log('==========================================');
  console.log('');

  const email = 'admin@mail.com';
  const password = 'admin123';
  const name = 'Super Administrator';
  const username = 'superadmin';

  // Generate password hash
  console.log('Generating password hash...');
  const passwordHash = await bcrypt.hash(password, 10);
  console.log('  Password hash generated!');

  // Check if user already exists
  console.log('');
  console.log('Checking if user exists...');
  const existingUser = await query(
    'SELECT id, email, role FROM pm_users WHERE email = @email',
    { email }
  );

  const userId = generateId('user');
  const now = new Date();

  if (existingUser.recordset.length > 0) {
    const user = existingUser.recordset[0];
    console.log(`  User found: ${user.email} (current role: ${user.role})`);

    // Update existing user to SUPER_ADMIN
    console.log('');
    console.log('Updating user to SUPER_ADMIN...');
    await query(
      `UPDATE pm_users SET role = 'SUPER_ADMIN', updated_at = @updatedAt WHERE id = @userId`,
      { userId: user.id, updatedAt: now }
    );
    console.log('  User updated to SUPER_ADMIN!');
  } else {
    // Create new SUPER_ADMIN user
    console.log('  User does not exist, creating new user...');
    console.log('');
    console.log('Creating SUPER_ADMIN user...');

    await query(`
      INSERT INTO pm_users (id, username, email, password, name, role, avatar_url, created_at, updated_at)
      VALUES (@id, @username, @email, @password, @name, 'SUPER_ADMIN', NULL, @createdAt, @updatedAt)
    `, {
      id: userId,
      username,
      email,
      password: passwordHash,
      name,
      createdAt: now,
      updatedAt: now,
    });

    console.log('  SUPER_ADMIN user created!');
  }

  console.log('');
  console.log('==========================================');
  console.log(' ✅ Super Admin User Setup Complete!');
  console.log('==========================================');
  console.log('');
  console.log('Login credentials:');
  console.log(`  Email: ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`  Role: SUPER_ADMIN`);
  console.log('');
}

main().catch((error) => {
  console.error('');
  console.error('==========================================');
  console.error(' ❌ Failed to create Super Admin!');
  console.error('==========================================');
  console.error(error);
  process.exit(1);
});
