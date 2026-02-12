// Simple script to find user ID
const Database = require('better-sqlite3')('dev.db');

try {
  // Query for the user
  const user = Database.prepare('SELECT id, username, email FROM User WHERE email = ?').get('athabarokahfc@gmail.com');

  if (user) {
    console.log('User found:', user);
    console.log('User ID:', user.id);
    console.log('Username:', user.username);

    // Update password hash
    const bcryptjs = require('bcryptjs');
    const newPassword = bcryptjs.hashSync('windows0819');

    // Update user with hashed password
    const updateStmt = Database.prepare('UPDATE User SET password = ? WHERE id = ?');
    updateStmt.run(newPassword, [user.id]);

    console.log('Password updated successfully');
    console.log('New password hash:', newPassword);
  } else {
    console.log('User not found!');
  }

} catch (error) {
  console.error('Error:', error);
} finally {
  if (Database) {
    Database.close();
  }
  console.log('Done');
}
