require('rootpath')();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const errorHandler = require('./_middleware/error-handler');

// Initialize database with error handling
let db;
try {
    db = require('./_helpers/db');
    console.log('✅ Database module loaded successfully');
} catch (error) {
    console.error('❌ Failed to load database module:', error.message);
    console.log('⚠️  Server will start without database functionality');
    db = { sequelize: null };
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// Allow CORS (Render frontend + localhost during development)
const allowedOrigins = [
  'https://frontdep.onrender.com',
  'https://introprogfrontt.onrender.com', // Add your actual frontend URL
  'http://localhost:4200', // Angular default dev server
  'http://localhost:4000'
];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow non-browser clients and same-origin
    const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
    const isAllowed = allowedOrigins.includes(origin) || isLocalhost;
    console.log('CORS check - Origin:', origin, 'Allowed:', isAllowed);
    callback(isAllowed ? null : new Error('Not allowed by CORS'), isAllowed);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // handle preflight

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'running', 
        message: db.sequelize ? 'Server is running with database' : 'Server is running but database is not connected',
        timestamp: new Date().toISOString()
    });
});

// API routes - always load them, but they may not work without database
console.log('📡 Loading API routes...');
app.use('/api/accounts', require('./accounts/account.controller'));
app.use('/api/employees', require('./employees/employee.controller'));
app.use('/api/departments', require('./departments/department.controller'));
app.use('/api/workflows', require('./workflows/workflow.controller'));
app.use('/api/requests', require('./requests/request.controller'));
app.use('/api/brands', require('./brand'));
app.use('/api/categories', require('./category'));
app.use('/api/items', require('./items'));
app.use('/api/stocks', require('./stock'));
app.use('/api/storage-locations', require('./storage-location'));
app.use('/api/pcs', require('./pc'));
app.use('/api/pc-components', require('./pc/pc-component.routes'));
app.use('/api/room-locations', require('./pc/room-location.routes'));
app.use('/api/specifications', require('./specifications'));
app.use('/api/dispose', require('./dispose'));

// Test database models endpoint
app.get('/api/test-models', async (req, res) => {
    try {
        const db = require('./_helpers/db');
        const models = {
            RoomLocation: !!db.RoomLocation,
            Brand: !!db.Brand,
            Category: !!db.Category,
            Item: !!db.Item,
            PC: !!db.PC
        };
        
        console.log('Available models:', models);
        res.json({ 
            message: 'Database models status',
            models,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error testing models:', error);
        res.status(500).json({ 
            error: 'Database models test failed',
            message: error.message 
        });
    }
});

// Debug endpoint to check refresh tokens
app.get('/api/debug/tokens', async (req, res) => {
    try {
        const db = require('./_helpers/db');
        const tokens = await db.RefreshToken.findAll({
            attributes: ['id', 'token', 'expires', 'revoked', 'createdByIp'],
            limit: 10
        });
        
        res.json({ 
            message: 'Refresh tokens in database',
            count: tokens.length,
            tokens: tokens.map(t => ({
                id: t.id,
                token: t.token ? t.token.substring(0, 10) + '...' : null,
                expires: t.expires,
                revoked: t.revoked,
                isActive: t.isActive
            }))
        });
    } catch (error) {
        console.error('Error checking tokens:', error);
        res.status(500).json({ 
            error: 'Failed to check tokens',
            message: error.message 
        });
    }
});

// Test room-locations endpoint
app.get('/api/test/room-locations', async (req, res) => {
    try {
        const roomLocationService = require('./pc/room-location.service');
        const rooms = await roomLocationService.getAll();
        
        res.json({ 
            message: 'Room locations test successful',
            count: rooms.length,
            rooms: rooms.map(r => ({
                id: r.id,
                name: r.name,
                description: r.description,
                pcs: r.pcs ? r.pcs.length : 0
            }))
        });
    } catch (error) {
        console.error('Error testing room locations:', error);
        res.status(500).json({ 
            error: 'Room locations test failed',
            message: error.message 
        });
    }
});

// Database status and data endpoint - demonstrates environment usage and direct database calling
app.get('/api/database-status', async (req, res) => {
    try {
        // Use the same environment pattern as _helpers/db.js
        const environment = {
            apiUrl: process.env.API_URL || 'https://inventory-backend-api-production-030e.up.railway.app/api',
            database: process.env.NODE_ENV === 'production' ? {
                host: process.env.DATABASE_HOST || config.database.host,
                port: process.env.DATABASE_PORT || config.database.port,
                user: process.env.DATABASE_USER || config.database.user,
                password: process.env.DATABASE_PASSWORD || config.database.password,
                database: process.env.DATABASE_NAME || config.database.database
            } : config.database,
            server: {
                port: process.env.PORT || 3000,
                nodeEnv: process.env.NODE_ENV || 'development'
            }
        };

        // Check database connection status
        if (!db.sequelize) {
            return res.status(503).json({
                status: 'error',
                message: 'Database connection is not available',
                environment: {
                    apiUrl: environment.apiUrl,
                    database: {
                        host: environment.database.host,
                        port: environment.database.port,
                        database: environment.database.database,
                        user: environment.database.user,
                        connected: false
                    },
                    server: environment.server
                }
            });
        }

        // Get database information using direct database calling
        const [tables] = await db.sequelize.query('SHOW TABLES');
        const existingTables = tables.map(row => Object.values(row)[0]);

        // Get counts from various tables using direct database calling
        const tableCounts = {};
        for (const table of existingTables) {
            try {
                const [result] = await db.sequelize.query(`SELECT COUNT(*) as count FROM \`${table}\``);
                tableCounts[table] = result[0].count;
            } catch (error) {
                tableCounts[table] = 'Error: ' + error.message;
            }
        }

        // Get sample data from Brands table using direct database calling
        let sampleBrands = [];
        try {
            const [brands] = await db.sequelize.query('SELECT * FROM Brands LIMIT 5');
            sampleBrands = brands;
        } catch (error) {
            sampleBrands = [{ error: 'Could not fetch brands: ' + error.message }];
        }

        // Get database connection info
        const connectionConfig = db.sequelize.config;

        res.json({
            status: 'success',
            message: 'Database connection and data retrieval successful',
            timestamp: new Date().toISOString(),
            environment: {
                apiUrl: environment.apiUrl,
                database: {
                    host: environment.database.host,
                    port: environment.database.port,
                    database: environment.database.database,
                    user: environment.database.user,
                    connected: true,
                    dialect: connectionConfig.dialect,
                    pool: connectionConfig.pool
                },
                server: environment.server
            },
            database: {
                tables: existingTables,
                tableCounts: tableCounts,
                sampleData: {
                    brands: sampleBrands
                },
                models: {
                    Account: !!db.Account,
                    Brand: !!db.Brand,
                    Category: !!db.Category,
                    Item: !!db.Item,
                    Stock: !!db.Stock,
                    StorageLocation: !!db.StorageLocation,
                    PC: !!db.PC,
                    PCComponent: !!db.PCComponent
                }
            }
        });

    } catch (error) {
        console.error('Database status endpoint error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get database status',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Swagger docs
app.use('/api-docs', require('./_helpers/swagger'));

// Global error handler
app.use(errorHandler);

// Start server
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 4000;
app.listen(port, () => {
    console.log('🚀 Server listening on port ' + port);
    if (!db.sequelize) {
        console.log('⚠️  Database is not connected - some features may not work');
        console.log('📝 To fix this:');
        console.log('   1. Contact your MySQL hosting provider');
        console.log('   2. Enable external connections to your MySQL server');
        console.log('   3. Check if your MySQL server allows connections from Render');
    }
});
