const config = require('../config.json');
const mysql = require('mysql2/promise');
const { Sequelize, DataTypes } = require('sequelize');

module.exports = db = {};

initialize();

async function initialize() {
    try {
        // Use environment variables for production, config.json for development
        const dbConfig = process.env.NODE_ENV === 'production' ? {
            host: process.env.DATABASE_HOST || config.database.host,
            port: process.env.DATABASE_PORT || config.database.port,
            user: process.env.DATABASE_USER || config.database.user,
            password: process.env.DATABASE_PASSWORD || config.database.password,
            database: process.env.DATABASE_NAME || config.database.database
        } : config.database;

        console.log('🔍 Attempting to connect to database...');
        console.log('Host:', dbConfig.host);
        console.log('User:', dbConfig.user);
        console.log('Database:', dbConfig.database);
        console.log('Environment:', process.env.NODE_ENV);

        // create db if it doesn't already exist
        const { host, port, user, password, database } = dbConfig;
        
        try {
            console.log('⏳ Testing MySQL connection...');
            const connection = await mysql.createConnection({ 
                host, 
                port, 
                user, 
                password,
                connectTimeout: 15000, // 15 seconds timeout
                timeout: 15000
            });
            
            console.log('✅ Successfully connected to MySQL server');
            await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
            console.log(`✅ Database '${database}' is ready`);
            await connection.end();

            // connect to db with Sequelize
            const sequelize = new Sequelize(database, user, password, { 
                dialect: 'mysql',
                host: host,
                port: port,
                logging: process.env.NODE_ENV === 'production' ? false : console.log,
                pool: {
                    max: 5,
                    min: 0,
                    acquire: 30000,
                    idle: 10000
                },
                dialectOptions: {
                    connectTimeout: 15000,
                    // Remove timeout to fix MySQL warnings
                    // Fix for Railway MySQL compatibility
                    supportBigNumbers: true,
                    bigNumberStrings: true,
                    // Disable strict mode for better compatibility
                    // strict: false, // Removed to fix MySQL warnings
                    // Handle VIRTUAL data type issue
                    typeCast: function (field, next) {
                        if (field.type === 'NEWDECIMAL') {
                            const value = field.string();
                            return (value === null) ? null : Number(value);
                        }
                        return next();
                    }
                },
                // Disable timezone handling for better compatibility
                timezone: '+00:00'
            });

            // Test the connection
            await sequelize.authenticate();
            console.log('✅ Database connection has been established successfully.');

            // Check if required tables exist and auto-create missing ones
            console.log('🔍 Checking for required tables...');
            const [tables] = await sequelize.query('SHOW TABLES');
            const existingTables = tables.map(row => Object.values(row)[0]);
            console.log('📋 Existing tables:', existingTables.join(', '));

            // Define required tables
            const requiredTables = [
                'accounts', 'Brands', 'Categories', 'Items', 'StorageLocations',
                'stocks', 'roomLocations', 'PCs', 'PCComponents', 'specificationFields', 'disposes'
            ];

            const missingTables = requiredTables.filter(table => !existingTables.includes(table));
            if (missingTables.length > 0) {
                console.log('⚠️  Missing tables detected:', missingTables.join(', '));
                console.log('🛠  Attempting to create missing tables automatically...');
                try {
                    // Create core tables first
                    await sequelize.query(`CREATE TABLE IF NOT EXISTS \`accounts\` (
                        id INT NOT NULL AUTO_INCREMENT,
                        title VARCHAR(255) NULL,
                        firstName VARCHAR(255) NOT NULL,
                        lastName VARCHAR(255) NOT NULL,
                        email VARCHAR(255) NOT NULL,
                        passwordHash VARCHAR(255) NOT NULL,
                        acceptTerms TINYINT(1) DEFAULT 0,
                        role VARCHAR(50) NOT NULL DEFAULT 'Viewer',
                        verificationToken VARCHAR(255) NULL,
                        verified DATETIME NULL,
                        resetToken VARCHAR(255) NULL,
                        resetTokenExpires DATETIME NULL,
                        passwordReset DATETIME NULL,
                        created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
                        PRIMARY KEY (id),
                        UNIQUE KEY unique_email (email)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);

                    await sequelize.query(`CREATE TABLE IF NOT EXISTS \`RefreshTokens\` (
                        id INT NOT NULL AUTO_INCREMENT,
                        token VARCHAR(500) NULL,
                        expires DATETIME NULL,
                        created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        createdByIp VARCHAR(100) NULL,
                        revoked DATETIME NULL,
                        revokedByIp VARCHAR(100) NULL,
                        replacedByToken VARCHAR(500) NULL,
                        accountId INT NULL,
                        PRIMARY KEY (id),
                        KEY accountId (accountId)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);

                    await sequelize.query(`CREATE TABLE IF NOT EXISTS \`departments\` (
                        id INT NOT NULL AUTO_INCREMENT,
                        name VARCHAR(255) NOT NULL,
                        description VARCHAR(255) NULL,
                        PRIMARY KEY (id),
                        UNIQUE KEY unique_department_name (name)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);

                    await sequelize.query(`CREATE TABLE IF NOT EXISTS \`employees\` (
                        id INT NOT NULL AUTO_INCREMENT,
                        employeeId VARCHAR(100) NOT NULL,
                        email VARCHAR(255) NOT NULL,
                        position VARCHAR(255) NOT NULL,
                        departmentId INT NULL,
                        hireDate DATE NOT NULL,
                        status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
                        PRIMARY KEY (id),
                        UNIQUE KEY unique_employee_employeeId (employeeId),
                        UNIQUE KEY unique_employee_email (email),
                        KEY departmentId (departmentId)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);

                    await sequelize.query(`CREATE TABLE IF NOT EXISTS \`Brands\` (
                        id INT NOT NULL AUTO_INCREMENT,
                        name VARCHAR(255) NOT NULL,
                        description VARCHAR(255) NULL,
                        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        PRIMARY KEY (id),
                        UNIQUE KEY unique_brand_name (name)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);

                    await sequelize.query(`CREATE TABLE IF NOT EXISTS \`Categories\` (
                        id INT NOT NULL AUTO_INCREMENT,
                        name VARCHAR(255) NOT NULL,
                        description VARCHAR(255) NULL,
                        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        PRIMARY KEY (id),
                        UNIQUE KEY unique_category_name (name)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);

                    await sequelize.query(`CREATE TABLE IF NOT EXISTS \`Items\` (
                        id INT NOT NULL AUTO_INCREMENT,
                        categoryId INT NOT NULL,
                        brandId INT NOT NULL,
                        brandName VARCHAR(255) NULL,
                        name VARCHAR(255) NOT NULL,
                        description VARCHAR(255) NULL,
                        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        PRIMARY KEY (id),
                        KEY categoryId (categoryId),
                        KEY brandId (brandId),
                        CONSTRAINT items_category_fk FOREIGN KEY (categoryId) REFERENCES \`Categories\` (id) ON DELETE CASCADE,
                        CONSTRAINT items_brand_fk FOREIGN KEY (brandId) REFERENCES \`Brands\` (id) ON DELETE CASCADE
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);

                    await sequelize.query(`CREATE TABLE IF NOT EXISTS \`StorageLocations\` (
                        id INT NOT NULL AUTO_INCREMENT,
                        name VARCHAR(255) NOT NULL,
                        description TEXT NULL,
                        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        PRIMARY KEY (id)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);

                    await sequelize.query(`CREATE TABLE IF NOT EXISTS \`roomLocations\` (
                        id INT NOT NULL AUTO_INCREMENT,
                        name VARCHAR(255) NOT NULL,
                        description TEXT NULL,
                        createdBy INT NULL,
                        createdAt TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                        updatedAt TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        PRIMARY KEY (id)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);

                    await sequelize.query(`CREATE TABLE IF NOT EXISTS \`PCs\` (
                        id INT NOT NULL AUTO_INCREMENT,
                        name VARCHAR(255) NOT NULL,
                        description TEXT NULL,
                        roomLocationId INT NOT NULL,
                        createdBy INT NULL,
                        createdAt TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                        updatedAt TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        PRIMARY KEY (id),
                        KEY roomLocationId (roomLocationId),
                        CONSTRAINT pcs_room_fk FOREIGN KEY (roomLocationId) REFERENCES \`roomLocations\` (id) ON DELETE CASCADE
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);

                    await sequelize.query(`CREATE TABLE IF NOT EXISTS \`PCComponents\` (
                        id INT NOT NULL AUTO_INCREMENT,
                        pcId INT NOT NULL,
                        itemId INT NOT NULL,
                        stockId INT NOT NULL,
                        quantity INT NOT NULL DEFAULT 1,
                        createdBy INT NULL,
                        createdAt TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                        updatedAt TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        PRIMARY KEY (id),
                        KEY pcId (pcId),
                        KEY itemId (itemId),
                        KEY stockId (stockId)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);

                    await sequelize.query(`CREATE TABLE IF NOT EXISTS \`specificationFields\` (
                        id INT NOT NULL AUTO_INCREMENT,
                        categoryId INT NOT NULL,
                        name VARCHAR(255) NOT NULL,
                        type ENUM('text','number','boolean','date') NOT NULL DEFAULT 'text',
                        required TINYINT(1) NOT NULL DEFAULT 0,
                        createdAt TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                        updatedAt TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        PRIMARY KEY (id),
                        KEY categoryId (categoryId)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);

                    await sequelize.query(`CREATE TABLE IF NOT EXISTS \`disposes\` (
                        id INT NOT NULL AUTO_INCREMENT,
                        itemId INT NOT NULL,
                        locationId INT NOT NULL,
                        quantity INT NOT NULL,
                        reason TEXT NULL,
                        disposalDate DATE NOT NULL,
                        createdBy INT NULL,
                        createdAt TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                        updatedAt TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        PRIMARY KEY (id)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);

                    await sequelize.query(`CREATE TABLE IF NOT EXISTS \`stocks\` (
                        id INT NOT NULL AUTO_INCREMENT,
                        itemId INT NOT NULL,
                        locationId INT NOT NULL,
                        quantity INT NOT NULL DEFAULT 0,
                        createdBy INT NULL,
                        createdAt TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                        updatedAt TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        disposeId INT NULL,
                        PRIMARY KEY (id),
                        KEY itemId (itemId),
                        KEY locationId (locationId),
                        KEY createdBy (createdBy),
                        KEY disposeId (disposeId)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);

                    await sequelize.query(`CREATE TABLE IF NOT EXISTS \`workflows\` (
                        id INT NOT NULL AUTO_INCREMENT,
                        employeeId INT NOT NULL,
                        type VARCHAR(100) NOT NULL,
                        status ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
                        details TEXT NULL,
                        startDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        endDate DATETIME NULL,
                        actionBy VARCHAR(255) NULL,
                        actionDate DATETIME NULL,
                        PRIMARY KEY (id),
                        KEY employeeId (employeeId)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);

                    await sequelize.query(`CREATE TABLE IF NOT EXISTS \`requests\` (
                        id INT NOT NULL AUTO_INCREMENT,
                        employeeId INT NOT NULL,
                        status VARCHAR(50) NOT NULL DEFAULT 'pending',
                        description TEXT NULL,
                        PRIMARY KEY (id),
                        KEY employeeId (employeeId)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);

                    await sequelize.query(`CREATE TABLE IF NOT EXISTS \`requestItems\` (
                        id INT NOT NULL AUTO_INCREMENT,
                        requestId INT NOT NULL,
                        itemName VARCHAR(255) NOT NULL,
                        quantity INT NOT NULL,
                        PRIMARY KEY (id),
                        KEY requestId (requestId)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);

                    console.log('✅ Missing tables created (basic structure without FKs for compatibility).');
                } catch (e) {
                    console.log('⚠️  Auto-create tables step encountered issues:', e.message);
                }
            } else {
                console.log('✅ All required tables exist');
            }

            // init models and add them to the exported db object
            db.Account = require('../accounts/account.model')(sequelize);
            db.RefreshToken = require('../accounts/refresh-token.model')(sequelize);
            db.Employee = require('../employees/employee.model')(sequelize, DataTypes);
            db.Department = require('../departments/department.model')(sequelize, DataTypes);
            db.Workflow = require('../workflows/workflow.model')(sequelize, DataTypes);
            db.Request = require('../requests/request.model')(sequelize, DataTypes);

            // New Models - only initialize if tables exist
            db.Brand = require('../brand/brand.model')(sequelize, DataTypes);
            db.Category = require('../category/category.model')(sequelize, DataTypes);
            db.Item = require('../items/item.model')(sequelize, DataTypes);
            db.RoomLocation = require('../pc/room-location.model')(sequelize, DataTypes);
            db.PC = require('../pc/pc.model')(sequelize, DataTypes);
            db.Stock = require('../stock/stock.model')(sequelize, DataTypes);
            
            db.StorageLocation = require('../storage-location/storage-location.model')(sequelize, DataTypes);
            
            if (existingTables.includes('PCComponents')) {
                db.PCComponent = require('../pc/pc-component.model')(sequelize, DataTypes);
            }
            
            if (existingTables.includes('specificationFields')) {
                db.SpecificationField = require('../specifications/specification.model')(sequelize, DataTypes);
            }
            
            if (existingTables.includes('disposes')) {
                db.Dispose = require('../dispose/dispose.model')(sequelize, DataTypes);
            }

            // ---------------- RELATIONSHIPS ----------------
            // Only create relationships for existing models
            if (db.StorageLocation && db.Stock) {
                db.StorageLocation.hasMany(db.Stock, { foreignKey: 'locationId', as: 'stocks' });
                db.Stock.belongsTo(db.StorageLocation, { foreignKey: 'locationId', as: 'location' });
            }

            if (db.Brand && db.Item) {
                db.Brand.hasMany(db.Item, { foreignKey: 'brandId', as: 'items' });
                db.Item.belongsTo(db.Brand, { foreignKey: 'brandId', as: 'brand' });
            }

            if (db.Category && db.Item) {
                db.Category.hasMany(db.Item, { foreignKey: 'categoryId', as: 'items' });
                db.Item.belongsTo(db.Category, { foreignKey: 'categoryId', as: 'category' });
            }

            if (db.Item && db.Stock) {
                db.Item.hasMany(db.Stock, { foreignKey: 'itemId', as: 'stocks' });
                db.Stock.belongsTo(db.Item, { foreignKey: 'itemId', as: 'item' });
            }

            if (db.Account && db.Stock) {
                db.Account.hasMany(db.Stock, { foreignKey: 'createdBy', as: 'userStocks' });
                db.Stock.belongsTo(db.Account, { foreignKey: 'createdBy', as: 'user' });
            }

            if (db.Account && db.RoomLocation) {
                db.Account.hasMany(db.RoomLocation, { foreignKey: 'createdBy', as: 'userRoomLocations' });
                db.RoomLocation.belongsTo(db.Account, { foreignKey: 'createdBy', as: 'user' });
            }

            if (db.RoomLocation && db.PC) {
                db.RoomLocation.hasMany(db.PC, { foreignKey: 'roomLocationId', as: 'pcs' });
                db.PC.belongsTo(db.RoomLocation, { foreignKey: 'roomLocationId', as: 'roomLocation' });
            }

            if (db.Account && db.PC) {
                db.Account.hasMany(db.PC, { foreignKey: 'createdBy', as: 'userPCs' });
                db.PC.belongsTo(db.Account, { foreignKey: 'createdBy', as: 'user' });
            }

            if (db.PC && db.PCComponent) {
                db.PC.hasMany(db.PCComponent, { foreignKey: 'pcId', as: 'components' });
                db.PCComponent.belongsTo(db.PC, { foreignKey: 'pcId', as: 'pc' });
            }

            if (db.Item && db.PCComponent) {
                db.Item.hasMany(db.PCComponent, { foreignKey: 'itemId', as: 'pcComponents' });
                db.PCComponent.belongsTo(db.Item, { foreignKey: 'itemId', as: 'item' });
            }

            if (db.Stock && db.PCComponent) {
                db.Stock.hasMany(db.PCComponent, { foreignKey: 'stockId', as: 'pcComponents' });
                db.PCComponent.belongsTo(db.Stock, { foreignKey: 'stockId', as: 'stock' });
            }

            if (db.Account && db.PCComponent) {
                db.Account.hasMany(db.PCComponent, { foreignKey: 'createdBy', as: 'userPCComponents' });
                db.PCComponent.belongsTo(db.Account, { foreignKey: 'createdBy', as: 'user' });
            }

            if (db.Category && db.SpecificationField) {
                db.Category.hasMany(db.SpecificationField, { foreignKey: 'categoryId', as: 'specificationFields' });
                db.SpecificationField.belongsTo(db.Category, { foreignKey: 'categoryId', as: 'category' });
            }

            if (db.Item && db.Dispose) {
                db.Item.hasMany(db.Dispose, { foreignKey: 'itemId', as: 'disposals' });
                db.Dispose.belongsTo(db.Item, { foreignKey: 'itemId', as: 'item' });
            }
            
            if (db.StorageLocation && db.Dispose) {
                db.StorageLocation.hasMany(db.Dispose, { foreignKey: 'locationId', as: 'disposals' });
                db.Dispose.belongsTo(db.StorageLocation, { foreignKey: 'locationId', as: 'location' });
            }
            
            if (db.Account && db.Dispose) {
                db.Account.hasMany(db.Dispose, { foreignKey: 'createdBy', as: 'userDisposals' });
                db.Dispose.belongsTo(db.Account, { foreignKey: 'createdBy', as: 'user' });
            }

            if (db.Dispose && db.Stock) {
                db.Dispose.hasMany(db.Stock, { foreignKey: 'disposeId', as: 'stockEntries' });
                db.Stock.belongsTo(db.Dispose, { foreignKey: 'disposeId', as: 'disposal' });
            }

            // ---------------- Other Existing Relationships ----------------
            if (db.Account && db.RefreshToken) {
                db.Account.hasMany(db.RefreshToken, { onDelete: 'CASCADE' });
                db.RefreshToken.belongsTo(db.Account);
            }

            if (db.Account && db.Employee) {
                db.Account.hasOne(db.Employee, { foreignKey: 'accountId', as: 'employee' });
                db.Employee.belongsTo(db.Account, { foreignKey: 'accountId' });
            }

            if (db.Department && db.Employee) {
                db.Department.hasMany(db.Employee, { foreignKey: 'departmentId', as: 'employees' });
                db.Employee.belongsTo(db.Department, { foreignKey: 'departmentId' });
            }

            if (db.Employee && db.Workflow) {
                db.Employee.hasMany(db.Workflow, { foreignKey: 'employeeId' });
                db.Workflow.belongsTo(db.Employee, { foreignKey: 'employeeId' });
            }

            if (db.Employee && db.Request) {
                db.Employee.hasMany(db.Request, { foreignKey: 'employeeId' });
                db.Request.belongsTo(db.Employee, { foreignKey: 'employeeId' });
            }

            // Don't sync since tables already exist - this prevents foreign key constraint errors
            // await sequelize.sync({ force: false }); // Commented out to prevent sync errors

            // expose sequelize instance
            db.sequelize = sequelize;
            db.Sequelize = Sequelize;
            
            console.log('✅ Database initialization completed successfully');
            
            // Update existing tables to add missing timestamp columns
            console.log('🔧 Checking for missing timestamp columns...');
            try {
                // Check and add createdAt/updatedAt to existing tables
                const tablesToUpdate = ['Brands', 'Categories', 'Items', 'StorageLocations'];
                
                for (const tableName of tablesToUpdate) {
                    const [columns] = await sequelize.query(`SHOW COLUMNS FROM \`${tableName}\``);
                    const columnNames = columns.map(col => col.Field);
                    
                    if (!columnNames.includes('createdAt')) {
                        console.log(`➕ Adding createdAt column to ${tableName}`);
                        await sequelize.query(`ALTER TABLE \`${tableName}\` ADD COLUMN createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`);
                    }
                    
                    if (!columnNames.includes('updatedAt')) {
                        console.log(`➕ Adding updatedAt column to ${tableName}`);
                        await sequelize.query(`ALTER TABLE \`${tableName}\` ADD COLUMN updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
                    }
                }
                console.log('✅ Timestamp columns updated successfully');
                
                // Insert sample data if tables are empty
                console.log('📝 Checking for sample data...');
                try {
                    const [brandCount] = await sequelize.query('SELECT COUNT(*) as count FROM Brands');
                    if (brandCount[0].count === 0) {
                        console.log('➕ Inserting sample brands...');
                        await sequelize.query(`
                            INSERT INTO Brands (name, description) VALUES 
                            ('Apple', 'Premium technology products'),
                            ('Samsung', 'Electronics and mobile devices'),
                            ('Dell', 'Computer hardware and accessories'),
                            ('HP', 'Computers and printers'),
                            ('Lenovo', 'Laptops and desktop computers')
                        `);
                    }
                    
                    const [categoryCount] = await sequelize.query('SELECT COUNT(*) as count FROM Categories');
                    if (categoryCount[0].count === 0) {
                        console.log('➕ Inserting sample categories...');
                        await sequelize.query(`
                            INSERT INTO Categories (name, description) VALUES 
                            ('Laptops', 'Portable computers'),
                            ('Desktop Computers', 'Stationary computers'),
                            ('Monitors', 'Display screens'),
                            ('Keyboards', 'Input devices'),
                            ('Mice', 'Pointing devices'),
                            ('Printers', 'Output devices'),
                            ('Network Equipment', 'Routers, switches, cables'),
                            ('Storage Devices', 'Hard drives, SSDs, USB drives')
                        `);
                    }
                    console.log('✅ Sample data inserted successfully');
                    
                    // Add sample room locations
                    const [roomCount] = await sequelize.query('SELECT COUNT(*) as count FROM roomLocations');
                    if (roomCount[0].count === 0) {
                        console.log('➕ Inserting sample room locations...');
                        await sequelize.query(`
                            INSERT INTO roomLocations (name, description, building, floor, roomNumber, capacity, status) VALUES 
                            ('Computer Lab 1', 'Main computer laboratory', 'Building A', '1st Floor', 'A101', 30, 'Active'),
                            ('Computer Lab 2', 'Secondary computer laboratory', 'Building A', '1st Floor', 'A102', 25, 'Active'),
                            ('Server Room', 'Data center and server storage', 'Building B', 'Basement', 'B001', 10, 'Active'),
                            ('Network Operations Center', 'Network monitoring and control', 'Building A', '2nd Floor', 'A201', 15, 'Active'),
                            ('Training Room', 'Employee training and meetings', 'Building C', '1st Floor', 'C101', 20, 'Active')
                        `);
                    }
                    console.log('✅ Room location sample data inserted successfully');
                    
                    // Add sample PCs
                    const [pcCount] = await sequelize.query('SELECT COUNT(*) as count FROM PCs');
                    if (pcCount[0].count === 0) {
                        console.log('➕ Inserting sample PCs...');
                        // First get a room location ID
                        const [roomLocations] = await sequelize.query('SELECT id FROM roomLocations LIMIT 1');
                        if (roomLocations.length > 0) {
                            const roomLocationId = roomLocations[0].id;
                            await sequelize.query(`
                                INSERT INTO PCs (name, description, roomLocationId, status) VALUES 
                                ('PC-001', 'Main workstation in Computer Lab 1', ${roomLocationId}, 'Active'),
                                ('PC-002', 'Secondary workstation in Computer Lab 1', ${roomLocationId}, 'Active'),
                                ('PC-003', 'Workstation in Computer Lab 2', ${roomLocationId}, 'Active')
                            `);
                        }
                    }
                    console.log('✅ PC sample data inserted successfully');
                    
                    // Add sample stock data
                    const [stockCount] = await sequelize.query('SELECT COUNT(*) as count FROM stocks');
                    if (stockCount[0].count === 0) {
                        console.log('➕ Inserting sample stock data...');
                        // First get some items and locations
                        const [items] = await sequelize.query('SELECT id FROM Items LIMIT 3');
                        const [locations] = await sequelize.query('SELECT id FROM StorageLocations LIMIT 2');
                        
                        if (items.length > 0 && locations.length > 0) {
                            for (let i = 0; i < Math.min(items.length, 3); i++) {
                                const itemId = items[i].id;
                                const locationId = locations[i % locations.length].id;
                                const quantity = Math.floor(Math.random() * 50) + 10;
                                const price = Math.floor(Math.random() * 1000) + 100;
                                const totalPrice = quantity * price;
                                
                                await sequelize.query(`
                                    INSERT INTO stocks (itemId, locationId, quantity, price, totalPrice, remarks, createdBy) VALUES 
                                    (${itemId}, ${locationId}, ${quantity}, ${price}, ${totalPrice}, 'Sample stock entry', 1)
                                `);
                            }
                        }
                    }
                    console.log('✅ Stock sample data inserted successfully');
                } catch (error) {
                    console.log('⚠️  Error inserting sample data:', error.message);
                }
            } catch (error) {
                console.log('⚠️  Error updating timestamp columns:', error.message);
            }
            
        } catch (dbError) {
            console.error('❌ Database connection failed:', dbError.message);
            console.log('⚠️  MySQL hosting provider is blocking connections from Render');
            console.log('📝 To fix this, contact your MySQL hosting provider and ask them to:');
            console.log('   1. Enable external MySQL connections');
            console.log('   2. Whitelist IP addresses (especially Render\'s IP ranges)');
            console.log('   3. Open port 3306 for external connections');
            console.log('   4. Check if your hosting plan allows external connections');
            console.log('');
            console.log('🔗 Your MySQL details:');
            console.log('   Host: 153.92.15.31');
            console.log('   User: u875409848_vilar');
            console.log('   Database: u875409848_vilar');
            console.log('');
            console.log('📞 Contact your hosting provider with this message:');
            console.log('   "I need to enable external MySQL connections from Render.com for my database at 153.92.15.31"');
            
            // Create empty db object so app doesn't crash
            db.sequelize = null;
            db.Sequelize = Sequelize;
        }
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        console.log('⚠️  App will start without database connection');
        
        // Create empty db object so app doesn't crash
        db.sequelize = null;
        db.Sequelize = Sequelize;
    }
}
