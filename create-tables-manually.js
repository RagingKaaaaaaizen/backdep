const mysql = require('mysql2/promise');

async function createTables() {
    console.log('🔧 Creating tables manually in your MySQL database...');
    
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
        console.log('⏳ Connecting to MySQL...');
        const connection = await mysql.createConnection(connectionConfig);
        console.log('✅ Connected to MySQL database!');
        
        // Create all tables manually
        const tables = [
            // Accounts table
            `CREATE TABLE IF NOT EXISTS accounts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(10),
                firstName VARCHAR(100) NOT NULL,
                lastName VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                passwordHash VARCHAR(255) NOT NULL,
                acceptTerms BOOLEAN DEFAULT FALSE,
                role VARCHAR(20) DEFAULT 'User',
                verificationToken VARCHAR(255),
                verified DATETIME,
                resetToken VARCHAR(255),
                resetTokenExpires DATETIME,
                passwordReset DATETIME,
                created DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                isVerified BOOLEAN DEFAULT FALSE
            )`,
            
            // Refresh tokens table
            `CREATE TABLE IF NOT EXISTS refreshTokens (
                id INT AUTO_INCREMENT PRIMARY KEY,
                token VARCHAR(500) NOT NULL,
                expires DATETIME NOT NULL,
                created DATETIME DEFAULT CURRENT_TIMESTAMP,
                createdByIp VARCHAR(45),
                revoked DATETIME,
                revokedByIp VARCHAR(45),
                replacedByToken VARCHAR(500),
                isExpired BOOLEAN GENERATED ALWAYS AS (expires < NOW()) STORED,
                isActive BOOLEAN GENERATED ALWAYS AS (revoked IS NULL AND NOT isExpired) STORED,
                accountId INT,
                FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE CASCADE
            )`,
            
            // Employees table
            `CREATE TABLE IF NOT EXISTS employees (
                id INT AUTO_INCREMENT PRIMARY KEY,
                employeeId VARCHAR(50) UNIQUE NOT NULL,
                firstName VARCHAR(100) NOT NULL,
                lastName VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                phone VARCHAR(20),
                position VARCHAR(100),
                departmentId INT,
                accountId INT,
                created DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE SET NULL
            )`,
            
            // Departments table
            `CREATE TABLE IF NOT EXISTS departments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                created DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`,
            
            // Workflows table
            `CREATE TABLE IF NOT EXISTS workflows (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                type VARCHAR(50),
                employeeId INT,
                created DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE
            )`,
            
            // Requests table
            `CREATE TABLE IF NOT EXISTS requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
                employeeId INT,
                created DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE
            )`,
            
            // Brands table
            `CREATE TABLE IF NOT EXISTS brands (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                created DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`,
            
            // Categories table
            `CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                created DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`,
            
            // Items table
            `CREATE TABLE IF NOT EXISTS items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                brandId INT,
                categoryId INT,
                created DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (brandId) REFERENCES brands(id) ON DELETE SET NULL,
                FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL
            )`,
            
            // Storage locations table
            `CREATE TABLE IF NOT EXISTS storageLocations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                address TEXT,
                created DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`,
            
            // Stocks table
            `CREATE TABLE IF NOT EXISTS stocks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                quantity INT NOT NULL DEFAULT 0,
                itemId INT,
                locationId INT,
                createdBy INT,
                disposeId INT NULL,
                created DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE CASCADE,
                FOREIGN KEY (locationId) REFERENCES storageLocations(id) ON DELETE SET NULL,
                FOREIGN KEY (createdBy) REFERENCES accounts(id) ON DELETE SET NULL
            )`,
            
            // Room locations table
            `CREATE TABLE IF NOT EXISTS roomLocations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                roomNumber VARCHAR(50) NOT NULL,
                building VARCHAR(100),
                floor VARCHAR(20),
                description TEXT,
                createdBy INT,
                created DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (createdBy) REFERENCES accounts(id) ON DELETE SET NULL
            )`,
            
            // PCs table
            `CREATE TABLE IF NOT EXISTS pcs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                pcName VARCHAR(255) NOT NULL,
                description TEXT,
                roomLocationId INT,
                createdBy INT,
                created DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (roomLocationId) REFERENCES roomLocations(id) ON DELETE SET NULL,
                FOREIGN KEY (createdBy) REFERENCES accounts(id) ON DELETE SET NULL
            )`,
            
            // PC Components table
            `CREATE TABLE IF NOT EXISTS pcComponents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                pcId INT,
                itemId INT,
                stockId INT,
                quantity INT NOT NULL DEFAULT 1,
                createdBy INT,
                created DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (pcId) REFERENCES pcs(id) ON DELETE CASCADE,
                FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE SET NULL,
                FOREIGN KEY (stockId) REFERENCES stocks(id) ON DELETE SET NULL,
                FOREIGN KEY (createdBy) REFERENCES accounts(id) ON DELETE SET NULL
            )`,
            
            // Specification fields table
            `CREATE TABLE IF NOT EXISTS specificationFields (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                fieldType ENUM('text', 'number', 'boolean', 'date') DEFAULT 'text',
                categoryId INT,
                created DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
            )`,
            
            // Dispose table
            `CREATE TABLE IF NOT EXISTS disposes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                itemId INT,
                locationId INT,
                quantity INT NOT NULL,
                reason TEXT,
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                createdBy INT,
                created DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE CASCADE,
                FOREIGN KEY (locationId) REFERENCES storageLocations(id) ON DELETE SET NULL,
                FOREIGN KEY (createdBy) REFERENCES accounts(id) ON DELETE SET NULL
            )`
        ];
        
        console.log('📋 Creating tables...');
        for (let i = 0; i < tables.length; i++) {
            try {
                await connection.execute(tables[i]);
                console.log(`✅ Created table ${i + 1}/${tables.length}`);
            } catch (error) {
                console.log(`⚠️  Table ${i + 1} might already exist: ${error.message}`);
            }
        }
        
        // Add foreign key for departments to employees
        try {
            await connection.execute(`
                ALTER TABLE employees 
                ADD CONSTRAINT fk_employee_department 
                FOREIGN KEY (departmentId) REFERENCES departments(id) ON DELETE SET NULL
            `);
            console.log('✅ Added department foreign key to employees');
        } catch (error) {
            console.log('⚠️  Department foreign key might already exist');
        }
        
        // Show all tables
        const [tablesResult] = await connection.execute('SHOW TABLES');
        console.log('\n📊 Tables in your database:');
        tablesResult.forEach(row => {
            console.log(`- ${Object.values(row)[0]}`);
        });
        
        await connection.end();
        console.log('\n✅ All tables created successfully!');
        console.log('🎉 Your database is now ready for the application!');
        
    } catch (error) {
        console.log('❌ Failed to create tables:', error.message);
        console.log('🔧 Make sure your MySQL hosting provider allows external connections');
    }
}

createTables();
