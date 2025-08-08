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

// Allow CORS
app.use(cors({
  origin: ['https://frontdep.onrender.com', 'http://localhost:4000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Access-Control-Allow-Origin']
}));

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
app.use('/api/brands', require('./brand/brand.controller'));
app.use('/api/categories', require('./category'));
app.use('/api/items', require('./items'));
app.use('/api/stocks', require('./stock'));
app.use('/api/storage-locations', require('./storage-location'));
app.use('/api/pcs', require('./pc'));
app.use('/api/pc-components', require('./pc/pc-component.routes'));
app.use('/api/room-locations', require('./pc/room-location.routes'));
app.use('/api/specifications', require('./specifications/specification.controller'));
app.use('/api/dispose', require('./dispose'));

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
