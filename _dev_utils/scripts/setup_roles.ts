import { sqlGateway } from '../../lib/api/sql-gateway';
import { hashPassword } from '../../lib/auth';

function generateId(prefix = 'pm') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`;
}

async function setupRoles() {
    console.log("=== Starting Role Setup Script ===");
    try {
        // 1. Elevate users containing 'Yun' to MANAGER role
        console.log("Searching for users with name 'Yun'...");
        const yunUsers = await sqlGateway.query(`
            SELECT id, name, username, email, role FROM pm_users 
            WHERE name LIKE '%Yun%' OR username LIKE '%Yun%'
        `);
        
        if (yunUsers.recordset.length > 0) {
            console.log(`Found ${yunUsers.recordset.length} user(s) matching 'Yun'. Updating roles to MANAGER...`);
            await sqlGateway.query(`
                UPDATE pm_users 
                SET role = 'MANAGER' 
                WHERE name LIKE '%Yun%' OR username LIKE '%Yun%'
            `);
            console.log("✅ Users updated to MANAGER successfully!");
        } else {
            console.log("⚠️ No users found matching 'Yun'. They might need to register first.");
        }

        // 2. Setup the admin account
        console.log("Checking if 'admin' user exists...");
        const existingAdmin = await sqlGateway.query(`
            SELECT id FROM pm_users WHERE username = 'admin' OR email = 'admin'
        `);

        if (existingAdmin.recordset.length > 0) {
            console.log("Admin user already exists. Updating credentials and role...");
            const pwdHash = await hashPassword('admin123');
            await sqlGateway.query(`
                UPDATE pm_users 
                SET role = 'ADMIN', password = @pwdHash
                WHERE username = 'admin' OR email = 'admin'
            `, { pwdHash });
            console.log("✅ Admin credentials and role refreshed!");
        } else {
            console.log("Admin user not found. Creating new 'admin' superuser...");
            const newId = generateId('usr');
            const pwdHash = await hashPassword('admin123');
            const now = new Date();
            
            await sqlGateway.query(`
                INSERT INTO pm_users (id, username, email, password, name, role, created_at, updated_at)
                VALUES (@id, 'admin', 'admin', @pwdHash, 'Administrator', 'ADMIN', @now, @now)
            `, {
                id: newId,
                pwdHash,
                now
            });
            console.log("✅ Admin user created successfully (admin/admin123)!");
        }

        process.exit(0);
    } catch (e) {
        console.error("❌ Script failed:", e);
        process.exit(1);
    }
}

setupRoles();
