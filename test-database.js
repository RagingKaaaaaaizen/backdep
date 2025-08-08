const mysql = require('mysql2/promise');

async function testDatabase() {
    try {
        const dbConfig = {
            host: '153.92.15.31',
            port: 3306,
            user: 'u875409848_vilar',
            password: '6xw;kmmXC$',
            database: 'u875409848_vilar'
        };

        console.log('🔍 Testing database connection...');
        console.log('Host:', dbConfig.host);
        console.log('Database:', dbConfig.database);

        const connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to MySQL database!');

        // Test if tables exist
        const requiredTables = [
            'accounts',
            'refreshTokens', 
            'departments',
            'employees',
            'brands',
            'categories',
            'items',
            'storageLocations',
            'stocks',
            'workflows',
            'requests',
            'roomLocations',
            'pcs',
            'pcComponents',
            'specificationFields',
            'disposes'
        ];

        console.log('📋 Checking if tables exist...');
        for (const table of requiredTables) {
            try {
                const [rows] = await connection.query(`SHOW TABLES LIKE '${table}'`);
                if (rows.length > 0) {
                    console.log(`✅ Table '${table}' exists`);
                } else {
                    console.log(`❌ Table '${table}' is missing`);
                }
            } catch (error) {
                console.log(`❌ Error checking table '${table}':`, error.message);
            }
        }

        // Test a simple query
        try {
            const [rows] = await connection.query('SELECT COUNT(*) as count FROM accounts');
            console.log('✅ Test query successful:', rows[0].count, 'accounts found');
        } catch (error) {
            console.log('❌ Test query failed:', error.message);
        }

        await connection.end();
        console.log('✅ Database test completed!');

    } catch (error) {
        console.error('❌ Database test failed:', error.message);
    }
}

testDatabase();
