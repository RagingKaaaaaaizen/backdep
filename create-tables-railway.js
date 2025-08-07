const mysql = require('mysql2/promise');

async function createTables() {
    try {
        // Get database config from environment variables (Railway)
        const dbConfig = {
            host: process.env.DATABASE_HOST || 'localhost',
            port: process.env.DATABASE_PORT || 3306,
            user: process.env.DATABASE_USER || 'root',
            password: process.env.DATABASE_PASSWORD || '',
            database: process.env.DATABASE_NAME || 'railway'
        };

        console.log('🔍 Connecting to Railway MySQL...');
        console.log('Host:', dbConfig.host);
        console.log('Database:', dbConfig.database);

        const connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to Railway MySQL');

        // Create database if it doesn't exist
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
        await connection.query(`USE \`${dbConfig.database}\``);

        // Create tables manually to avoid VIRTUAL data type issues
        const tables = [
            // Accounts table
            `CREATE TABLE IF NOT EXISTS \`accounts\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`title\` varchar(255) DEFAULT NULL,
                \`firstName\` varchar(255) NOT NULL,
                \`lastName\` varchar(255) NOT NULL,
                \`email\` varchar(255) NOT NULL,
                \`passwordHash\` varchar(255) NOT NULL,
                \`acceptTerms\` tinyint(1) DEFAULT NULL,
                \`role\` varchar(255) NOT NULL DEFAULT 'Viewer',
                \`verificationToken\` varchar(255) DEFAULT NULL,
                \`verified\` datetime DEFAULT NULL,
                \`resetToken\` varchar(255) DEFAULT NULL,
                \`resetTokenExpires\` datetime DEFAULT NULL,
                \`passwordReset\` datetime DEFAULT NULL,
                \`created\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                \`status\` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`email\` (\`email\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

            // Refresh tokens table
            `CREATE TABLE IF NOT EXISTS \`refreshTokens\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`token\` varchar(255) NOT NULL,
                \`expires\` datetime NOT NULL,
                \`created\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`createdByIp\` varchar(255) DEFAULT NULL,
                \`revoked\` datetime DEFAULT NULL,
                \`revokedByIp\` varchar(255) DEFAULT NULL,
                \`replacedByToken\` varchar(255) DEFAULT NULL,
                \`accountId\` int NOT NULL,
                PRIMARY KEY (\`id\`),
                KEY \`accountId\` (\`accountId\`),
                CONSTRAINT \`refreshTokens_ibfk_1\` FOREIGN KEY (\`accountId\`) REFERENCES \`accounts\` (\`id\`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

            // Departments table
            `CREATE TABLE IF NOT EXISTS \`departments\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`name\` varchar(255) NOT NULL,
                \`description\` text,
                \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updatedAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

            // Employees table
            `CREATE TABLE IF NOT EXISTS \`employees\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`employeeId\` varchar(255) NOT NULL,
                \`email\` varchar(255) NOT NULL,
                \`position\` varchar(255) NOT NULL,
                \`departmentId\` int DEFAULT NULL,
                \`hireDate\` datetime NOT NULL,
                \`status\` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
                \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updatedAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`employeeId\` (\`employeeId\`),
                UNIQUE KEY \`email\` (\`email\`),
                KEY \`departmentId\` (\`departmentId\`),
                CONSTRAINT \`employees_ibfk_1\` FOREIGN KEY (\`email\`) REFERENCES \`accounts\` (\`email\`),
                CONSTRAINT \`employees_ibfk_2\` FOREIGN KEY (\`departmentId\`) REFERENCES \`departments\` (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

            // Brands table
            `CREATE TABLE IF NOT EXISTS \`brands\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`name\` varchar(255) NOT NULL,
                \`description\` text,
                \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updatedAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

            // Categories table
            `CREATE TABLE IF NOT EXISTS \`categories\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`name\` varchar(255) NOT NULL,
                \`description\` text,
                \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updatedAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

            // Items table
            `CREATE TABLE IF NOT EXISTS \`items\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`name\` varchar(255) NOT NULL,
                \`description\` text,
                \`brandId\` int DEFAULT NULL,
                \`categoryId\` int DEFAULT NULL,
                \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updatedAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                KEY \`brandId\` (\`brandId\`),
                KEY \`categoryId\` (\`categoryId\`),
                CONSTRAINT \`items_ibfk_1\` FOREIGN KEY (\`brandId\`) REFERENCES \`brands\` (\`id\`),
                CONSTRAINT \`items_ibfk_2\` FOREIGN KEY (\`categoryId\`) REFERENCES \`categories\` (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

            // Storage locations table
            `CREATE TABLE IF NOT EXISTS \`storageLocations\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`name\` varchar(255) NOT NULL,
                \`description\` text,
                \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updatedAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

            // Stocks table
            `CREATE TABLE IF NOT EXISTS \`stocks\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`itemId\` int NOT NULL,
                \`locationId\` int NOT NULL,
                \`quantity\` int NOT NULL DEFAULT 0,
                \`createdBy\` int DEFAULT NULL,
                \`disposeId\` int DEFAULT NULL,
                \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updatedAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                KEY \`itemId\` (\`itemId\`),
                KEY \`locationId\` (\`locationId\`),
                KEY \`createdBy\` (\`createdBy\`),
                KEY \`disposeId\` (\`disposeId\`),
                CONSTRAINT \`stocks_ibfk_1\` FOREIGN KEY (\`itemId\`) REFERENCES \`items\` (\`id\`),
                CONSTRAINT \`stocks_ibfk_2\` FOREIGN KEY (\`locationId\`) REFERENCES \`storageLocations\` (\`id\`),
                CONSTRAINT \`stocks_ibfk_3\` FOREIGN KEY (\`createdBy\`) REFERENCES \`accounts\` (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

            // Workflows table
            `CREATE TABLE IF NOT EXISTS \`workflows\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`employeeId\` int NOT NULL,
                \`type\` varchar(255) NOT NULL,
                \`status\` varchar(255) NOT NULL DEFAULT 'Pending',
                \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updatedAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                KEY \`employeeId\` (\`employeeId\`),
                CONSTRAINT \`workflows_ibfk_1\` FOREIGN KEY (\`employeeId\`) REFERENCES \`employees\` (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

            // Requests table
            `CREATE TABLE IF NOT EXISTS \`requests\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`employeeId\` int NOT NULL,
                \`type\` varchar(255) NOT NULL,
                \`status\` varchar(255) NOT NULL DEFAULT 'Pending',
                \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updatedAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                KEY \`employeeId\` (\`employeeId\`),
                CONSTRAINT \`requests_ibfk_1\` FOREIGN KEY (\`employeeId\`) REFERENCES \`employees\` (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`
        ];

        console.log('🔨 Creating tables...');
        for (const table of tables) {
            try {
                await connection.query(table);
                console.log('✅ Table created successfully');
            } catch (error) {
                console.log('⚠️  Table might already exist:', error.message);
            }
        }

        console.log('✅ All tables created successfully!');
        await connection.end();

    } catch (error) {
        console.error('❌ Error creating tables:', error.message);
        process.exit(1);
    }
}

createTables();
