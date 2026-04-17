const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Database = require('./models/Database');
const auth = require('./middleware/auth');
const logger = require('./utils/logger');

async function setup() {
    console.log('🚀 StarFrame Admin System Setup');
    console.log('================================');

    try {
        // Check if .env file exists
        const envPath = path.join(__dirname, '../.env');
        if (!fs.existsSync(envPath)) {
            console.log('📝 Creating .env file...');
            const envExample = fs.readFileSync(path.join(__dirname, '../.env.example'), 'utf8');

            // Generate secure keys
            const jwtSecret = crypto.randomBytes(64).toString('hex');
            const sessionSecret = crypto.randomBytes(64).toString('hex');
            const masterKey = crypto.randomBytes(32).toString('hex');

            let envContent = envExample
                .replace('your_jwt_secret_key_here_minimum_256_bits', jwtSecret)
                .replace('your_session_secret_key_here', sessionSecret)
                .replace('your_admin_master_key_here', masterKey);

            // Prompt for admin credentials
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const adminUsername = await new Promise(resolve => {
                rl.question('Enter admin username (default: samarth): ', resolve);
            });

            const adminEmail = await new Promise(resolve => {
                rl.question('Enter admin email (default: samarth@starframe.studio): ', resolve);
            });

            const adminPassword = await new Promise(resolve => {
                rl.question('Enter admin password (minimum 8 characters): ', resolve);
            });

            rl.close();

            envContent = envContent
                .replace('samarth', adminUsername || 'samarth')
                .replace('samarth@starframe.studio', adminEmail || 'samarth@starframe.studio')
                .replace('your_secure_password_here', adminPassword);

            fs.writeFileSync(envPath, envContent);
            console.log('✅ .env file created');

            // Reload environment
            require('dotenv').config();
        }

        console.log('🗄️  Initializing database...');
        await Database.init();
        console.log('✅ Database initialized');

        // Create admin user if doesn't exist
        const adminUsername = 'sam'; // Fixed admin username
        const adminPassword = 'S#tar1527'; // Fixed admin password
        const adminEmail = 'sam@starframe.studio';
        
        const existingUser = await Database.getUserByUsername(adminUsername);

        if (process.env.RESET_ADMIN_PASSWORD === 'true') {
            console.log('⚠️ Resetting admin password...');

            const newAdminUsername = 'starframeanimationstudios';
            const newAdminPassword = 'S#tar1527';
            const newPasswordHash = await auth.hashPassword(newAdminPassword);

            // Update username and password
            await Database.run(
                'UPDATE admin_users SET username = ?, password_hash = ? WHERE username = ?',
                [newAdminUsername, newPasswordHash, adminUsername]
            );

            console.log('✅ Admin password and username reset successfully.');

            console.log('   Username: ' + newAdminUsername);
            console.log('   Password: ' + newAdminPassword);

        } else if (!existingUser) {
            console.log('👤 Creating admin user...');

            const adminEmail = process.env.ADMIN_EMAIL || 'samarth@starframe.studio';
            const adminPassword = process.env.ADMIN_PASSWORD || 'starframe123';

            if (adminPassword === 'your_secure_password_here' || adminPassword.length < 8) {
                console.error('❌ Please set a secure admin password in .env file');
                process.exit(1);
            }

            const passwordHash = await auth.hashPassword(adminPassword);

            // Generate 2FA secret (optional)
            const twoFactorSecret = auth.generate2FASecret(adminUsername).base32;

            await Database.createUser({
                username: adminUsername,
                email: adminEmail,
                password_hash: passwordHash,
                two_factor_secret: twoFactorSecret
            });

            console.log('✅ Admin user created');
            console.log(`   Username: ${adminUsername}`);
            console.log(`   Email: ${adminEmail}`);
            console.log('   2FA Secret generated (can be enabled later)');
        } else {
            console.log('✅ Admin user already exists');
        }

        // Create necessary directories
        const dirs = ['data', 'logs', 'admin/css', 'admin/js'];
        for (const dir of dirs) {
            const dirPath = path.join(__dirname, '..', dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                console.log(`📁 Created directory: ${dir}`);
            }
        }

        // Log initial security event
        await Database.logSecurityEvent({
            event_type: 'system_setup',
            severity: 'low',
            ip_address: '127.0.0.1',
            user_agent: 'Setup Script',
            user_id: null,
            details: JSON.stringify({
                message: 'StarFrame Admin System initialized',
                timestamp: new Date().toISOString()
            })
        });

        console.log('🎉 Setup completed successfully!');
        console.log('');
        console.log('Next steps:');
        console.log('1. Start the server: npm start');
        console.log(`2. Visit http://localhost:${process.env.PORT || 3001}/admin`);
        console.log(`3. Login with username: ${adminUsername}`);
        console.log('');
        console.log('Security recommendations:');
        console.log('- Enable 2FA for your admin account');
        console.log('- Review security settings in the dashboard');
        console.log('- Set up SSL/TLS for production');
        console.log('- Configure email notifications');

    } catch (error) {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    } finally {
        await Database.close();
        process.exit(0);
    }
}

setup();