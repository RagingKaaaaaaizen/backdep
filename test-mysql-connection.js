const mysql = require('mysql2/promise');

async function testMySQLConnection() {
    console.log('🔍 Testing MySQL connection to your online database...');
    console.log('Host: 153.92.15.31');
    console.log('User: u875409848_vilar');
    console.log('Database: u875409848_vilar');
    console.log('Port: 3306');
    console.log('');

    const connectionConfig = {
        host: '153.92.15.31',
        port: 3306,
        user: 'u875409848_vilar',
        password: '6xw;kmmXC$',
        database: 'u875409848_vilar',
        connectTimeout: 10000,
        acquireTimeout: 10000,
        timeout: 10000
    };

    try {
        console.log('⏳ Attempting to connect...');
        const connection = await mysql.createConnection(connectionConfig);
        console.log('✅ SUCCESS: Connected to MySQL database!');
        
        // Test a simple query
        const [rows] = await connection.execute('SELECT 1 as test');
        console.log('✅ SUCCESS: Database query test passed!');
        console.log('Query result:', rows);
        
        await connection.end();
        console.log('✅ Connection closed successfully');
        
    } catch (error) {
        console.log('❌ FAILED: Could not connect to MySQL database');
        console.log('Error:', error.message);
        console.log('');
        console.log('🔧 POSSIBLE SOLUTIONS:');
        console.log('1. Contact your MySQL hosting provider (like Hostinger, GoDaddy, etc.)');
        console.log('2. Ask them to enable external connections to your MySQL database');
        console.log('3. Ask them to whitelist Render\'s IP addresses');
        console.log('4. Check if your MySQL hosting plan allows external connections');
        console.log('');
        console.log('📞 CONTACT YOUR HOSTING PROVIDER:');
        console.log('Tell them: "I need to enable external MySQL connections from Render.com"');
        console.log('They may need to:');
        console.log('- Enable remote MySQL access');
        console.log('- Whitelist IP addresses');
        console.log('- Change MySQL configuration');
    }
}

testMySQLConnection();
