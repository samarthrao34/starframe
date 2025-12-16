// Initialize admin user with specific credentials
require('dotenv').config();

const Database = require('./server/models/Database');
const auth = require('./server/middleware/auth');

async function initializeAdmin() {
    try {
        console.log('Initializing admin user...');
        
        await Database.init();
        
        const adminUsername = 'sam';
        const adminPassword = 'S#tar1527';
        const adminEmail = 'sam@starframe.studio';
        
        // Check if admin exists
        const existingAdmin = await Database.getUserByUsername(adminUsername);
        
        // Hash the password
        const passwordHash = await auth.hashPassword(adminPassword);
        
        if (existingAdmin) {
            // Update existing admin
            await Database.run(
                'UPDATE admin_users SET password_hash = ?, email = ?, is_active = 1 WHERE username = ?',
                [passwordHash, adminEmail, adminUsername]
            );
            console.log('✅ Admin user updated successfully');
        } else {
            // Create new admin
            await Database.createUser({
                username: adminUsername,
                email: adminEmail,
                password_hash: passwordHash
            });
            console.log('✅ Admin user created successfully');
        }
        
        console.log('');
        console.log('Admin Credentials:');
        console.log('Username:', adminUsername);
        console.log('Password:', adminPassword);
        console.log('');
        console.log('You can now login at: http://localhost:3001/admin');
        
        await Database.close();
        process.exit(0);
        
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

initializeAdmin();
