const mysql = require('mysql2/promise');

async function createMissingTables() {
    try {
        const dbConfig = {
            host: '153.92.15.31',
            port: 3306,
            user: 'u875409848_vilar',
            password: '6xw;kmmXC$',
            database: 'u875409848_vilar'
        };

        console.log('🔍 Connecting to online database...');
        const connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to online database!');

        // Create missing tables
        const missingTables = [
            // Stocks table
            `CREATE TABLE IF NOT EXISTS \`stocks\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`itemId\` int NOT NULL,
                \`locationId\` int NOT NULL,
                \`quantity\` int NOT NULL DEFAULT 0,
                \`createdBy\` int DEFAULT NULL,
                \`createdAt\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                \`updatedAt\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                \`disposeId\` int DEFAULT NULL,
                PRIMARY KEY (\`id\`),
                KEY \`itemId\` (\`itemId\`),
                KEY \`locationId\` (\`locationId\`),
                KEY \`createdBy\` (\`createdBy\`),
                KEY \`disposeId\` (\`disposeId\`),
                CONSTRAINT \`stocks_ibfk_1\` FOREIGN KEY (\`itemId\`) REFERENCES \`Items\` (\`id\`) ON DELETE CASCADE,
                CONSTRAINT \`stocks_ibfk_2\` FOREIGN KEY (\`locationId\`) REFERENCES \`StorageLocations\` (\`id\`) ON DELETE CASCADE,
                CONSTRAINT \`stocks_ibfk_3\` FOREIGN KEY (\`createdBy\`) REFERENCES \`accounts\` (\`id\`) ON DELETE SET NULL,
                CONSTRAINT \`stocks_ibfk_4\` FOREIGN KEY (\`disposeId\`) REFERENCES \`disposes\` (\`id\`) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

            // Room Locations table
            `CREATE TABLE IF NOT EXISTS \`roomLocations\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`name\` varchar(255) NOT NULL,
                \`description\` text,
                \`createdBy\` int DEFAULT NULL,
                \`createdAt\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                \`updatedAt\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                KEY \`createdBy\` (\`createdBy\`),
                CONSTRAINT \`roomLocations_ibfk_1\` FOREIGN KEY (\`createdBy\`) REFERENCES \`accounts\` (\`id\`) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

            // PCs table
            `CREATE TABLE IF NOT EXISTS \`PCs\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`name\` varchar(255) NOT NULL,
                \`description\` text,
                \`roomLocationId\` int NOT NULL,
                \`createdBy\` int DEFAULT NULL,
                \`createdAt\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                \`updatedAt\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                KEY \`roomLocationId\` (\`roomLocationId\`),
                KEY \`createdBy\` (\`createdBy\`),
                CONSTRAINT \`PCs_ibfk_1\` FOREIGN KEY (\`roomLocationId\`) REFERENCES \`roomLocations\` (\`id\`) ON DELETE CASCADE,
                CONSTRAINT \`PCs_ibfk_2\` FOREIGN KEY (\`createdBy\`) REFERENCES \`accounts\` (\`id\`) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

            // PC Components table
            `CREATE TABLE IF NOT EXISTS \`PCComponents\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`pcId\` int NOT NULL,
                \`itemId\` int NOT NULL,
                \`stockId\` int NOT NULL,
                \`quantity\` int NOT NULL DEFAULT 1,
                \`createdBy\` int DEFAULT NULL,
                \`createdAt\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                \`updatedAt\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                KEY \`pcId\` (\`pcId\`),
                KEY \`itemId\` (\`itemId\`),
                KEY \`stockId\` (\`stockId\`),
                KEY \`createdBy\` (\`createdBy\`),
                CONSTRAINT \`PCComponents_ibfk_1\` FOREIGN KEY (\`pcId\`) REFERENCES \`PCs\` (\`id\`) ON DELETE CASCADE,
                CONSTRAINT \`PCComponents_ibfk_2\` FOREIGN KEY (\`itemId\`) REFERENCES \`Items\` (\`id\`) ON DELETE CASCADE,
                CONSTRAINT \`PCComponents_ibfk_3\` FOREIGN KEY (\`stockId\`) REFERENCES \`stocks\` (\`id\`) ON DELETE CASCADE,
                CONSTRAINT \`PCComponents_ibfk_4\` FOREIGN KEY (\`createdBy\`) REFERENCES \`accounts\` (\`id\`) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

            // Specification Fields table
            `CREATE TABLE IF NOT EXISTS \`specificationFields\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`categoryId\` int NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`type\` enum('text','number','boolean','date') NOT NULL DEFAULT 'text',
                \`required\` tinyint(1) NOT NULL DEFAULT 0,
                \`createdAt\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                \`updatedAt\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                KEY \`categoryId\` (\`categoryId\`),
                CONSTRAINT \`specificationFields_ibfk_1\` FOREIGN KEY (\`categoryId\`) REFERENCES \`Categories\` (\`id\`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

            // Disposes table
            `CREATE TABLE IF NOT EXISTS \`disposes\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`itemId\` int NOT NULL,
                \`locationId\` int NOT NULL,
                \`quantity\` int NOT NULL,
                \`reason\` text,
                \`disposalDate\` date NOT NULL,
                \`createdBy\` int DEFAULT NULL,
                \`createdAt\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                \`updatedAt\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                KEY \`itemId\` (\`itemId\`),
                KEY \`locationId\` (\`locationId\`),
                KEY \`createdBy\` (\`createdBy\`),
                CONSTRAINT \`disposes_ibfk_1\` FOREIGN KEY (\`itemId\`) REFERENCES \`Items\` (\`id\`) ON DELETE CASCADE,
                CONSTRAINT \`disposes_ibfk_2\` FOREIGN KEY (\`locationId\`) REFERENCES \`StorageLocations\` (\`id\`) ON DELETE CASCADE,
                CONSTRAINT \`disposes_ibfk_3\` FOREIGN KEY (\`createdBy\`) REFERENCES \`accounts\` (\`id\`) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
        ];

        console.log('📋 Creating missing tables...');
        
        for (let i = 0; i < missingTables.length; i++) {
            try {
                await connection.query(missingTables[i]);
                console.log(`✅ Created table ${i + 1}/${missingTables.length}`);
            } catch (error) {
                console.log(`⚠️  Table ${i + 1} might already exist:`, error.message);
            }
        }

        // Verify tables were created
        console.log('🔍 Verifying tables...');
        const [rows] = await connection.query('SHOW TABLES');
        console.log('📊 Total tables in database:', rows.length);
        
        const tableNames = rows.map(row => Object.values(row)[0]);
        console.log('📋 Tables found:', tableNames.join(', '));

        await connection.end();
        console.log('✅ Missing tables creation completed!');

    } catch (error) {
        console.error('❌ Error creating missing tables:', error.message);
    }
}

createMissingTables();
