const express = require('express');
const router = express.Router();
const disposeService = require('./dispose.service');
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');
const validateRequest = require('../_middleware/validate-request');
const Joi = require('joi');

// Validation schemas
function createSchema(req, res, next) {
    const schema = Joi.object({
        itemId: Joi.number().integer().required(),
        quantity: Joi.number().integer().min(1).required(),
        disposalValue: Joi.number().precision(2).min(0).optional().default(0),
        locationId: Joi.number().integer().required(),
        reason: Joi.string().allow('').optional()
    });
    validateRequest(req, next, schema);
}

function updateSchema(req, res, next) {
    const schema = Joi.object({
        quantity: Joi.number().integer().min(1).optional(),
        disposalValue: Joi.number().precision(2).min(0).optional(),
        locationId: Joi.number().optional(),
        reason: Joi.string().optional()
    });
    validateRequest(req, next, schema);
}

// Routes
router.get('/', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), getAll);
router.get('/:id', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), getById);
router.post('/', authorize([Role.SuperAdmin, Role.Admin]), createSchema, create);
router.put('/:id', authorize([Role.SuperAdmin, Role.Admin]), updateSchema, update);
router.delete('/:id', authorize([Role.SuperAdmin, Role.Admin]), deleteDisposal);
router.get('/item/:itemId', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), getByItem);
router.post('/validate', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), validateDisposal);
router.get('/with-stock/:id', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), getDisposalWithStock);
router.get('/stock-with-disposal/:itemId', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), getStockWithDisposal);
router.get('/test', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), test);

// Controller functions
// GET all disposal records
function getAll(req, res, next) {
    disposeService.getAll()
        .then(disposals => res.send(disposals))
        .catch(next);
}

// GET single disposal record
function getById(req, res, next) {
    disposeService.getById(req.params.id)
        .then(disposal => disposal ? res.send(disposal) : res.sendStatus(404))
        .catch(next);
}

// POST create new disposal record
function create(req, res, next) {
    console.log('=== CREATE DISPOSAL REQUEST ===');
    console.log('Request body:', req.body);
    console.log('User:', req.user);
    
    try {
        // Check if user is authenticated
        if (!req.user || !req.user.id) {
            console.log('ERROR: User not authenticated');
            return res.status(401).send({ message: 'User authentication required' });
        }

        console.log('Creating disposal with validated data:', req.body);
        console.log('User ID:', req.user.id);
        
        disposeService.create(req.body, req.user.id)
            .then(disposal => {
                console.log('Disposal created successfully:', disposal.id);
                res.send(disposal);
            })
            .catch(error => {
                console.error('Error creating disposal:', error);
                const errorMessage = error.message || 'Unknown error occurred';
                res.status(500).send({ message: errorMessage });
            });
    } catch (err) {
        console.error('Unexpected error in create:', err);
        res.status(500).send({ message: 'Internal server error' });
    }
}

// PUT update disposal record
function update(req, res, next) {
    disposeService.update(req.params.id, req.body)
        .then(disposal => res.send(disposal))
        .catch(next);
}

// DELETE disposal record
function deleteDisposal(req, res, next) {
    disposeService.delete(req.params.id)
        .then(() => res.send({ message: 'Disposal record deleted successfully' }))
        .catch(next);
}

// GET disposals by item
function getByItem(req, res, next) {
    disposeService.getDisposalsByItem(req.params.itemId)
        .then(disposals => res.send(disposals))
        .catch(next);
}

// POST validate disposal
function validateDisposal(req, res, next) {
    console.log('=== VALIDATE DISPOSAL REQUEST ===');
    console.log('Request body:', req.body);
    console.log('User:', req.user);
    
    const { itemId, quantity } = req.body;
    
    if (!itemId || !quantity) {
        console.log('ERROR: Missing itemId or quantity');
        return res.status(400).send({ message: 'Item ID and quantity are required' });
    }

    console.log('Calling disposeService.validateDisposal with:', itemId, quantity);
    disposeService.validateDisposal(itemId, quantity)
        .then(validation => {
            console.log('Validation result:', validation);
            res.send(validation);
        })
        .catch(error => {
            console.error('Error in validateDisposal:', error);
            next(error);
        });
}

// GET disposal with stock information
function getDisposalWithStock(req, res, next) {
    disposeService.getDisposalWithStock(req.params.id)
        .then(data => res.send(data))
        .catch(next);
}

// GET stock entries with disposal information
function getStockWithDisposal(req, res, next) {
    disposeService.getStockWithDisposal(req.params.itemId)
        .then(data => res.send(data))
        .catch(next);
}

// Test endpoint to check if backend is working
function test(req, res, next) {
    console.log('=== TEST ENDPOINT CALLED ===');
    res.send({ 
        message: 'Dispose backend is working', 
        timestamp: new Date(),
        user: req.user ? req.user.email : 'No user'
    });
}

module.exports = router; 