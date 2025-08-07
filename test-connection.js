const config = require('./config.json');
const mysql = require('mysql2/promise');

async function testConnection() {
    try {
        console.log('🔍 Testing MySQL connection...');
        console.log('Host:', config.database.host);
        console.log('User:', config.database.user);
        console.log('Database:', config.database.database);
        
        const connection = await mysql.createConnection({
            host: config.database.host,
            port: config.database.port,
            user: config.database.user,
            password: config.database.password,
            database: config.database.database,
            connectTimeout: 15000,
            timeout: 15000
        });
        
        console.log('✅ Successfully connected to MySQL server');
        
        // Test a simple query
        const [rows] = await connection.execute('SELECT 1 as test');
        console.log('✅ Query test successful:', rows);
        
        await connection.end();
        console.log('✅ Connection test completed successfully');
        
    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        process.exit(1);
    }
}

testConnection();
