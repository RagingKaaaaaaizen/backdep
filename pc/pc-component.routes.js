const express = require('express');
const router = express.Router();
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');
const validateRequest = require('../_middleware/validate-request');
const Joi = require('joi');
const pcComponentController = require('./pc-component.controller');

// Validation schema for creating PC component
function createPCComponentSchema(req, res, next) {
    const schema = Joi.object({
        pcId: Joi.number().required(),
        itemId: Joi.number().required(),
        quantity: Joi.number().required(),
        price: Joi.number().required(),
        status: Joi.string().valid('Working', 'Missing', 'Not Working', 'Maintenance').default('Working'),
        stockId: Joi.number().optional(),
        remarks: Joi.string().allow('')
    });
    validateRequest(req, next, schema);
}

// Validation schema for updating PC component
function updatePCComponentSchema(req, res, next) {
    const schema = Joi.object({
        quantity: Joi.number().optional(),
        price: Joi.number().optional(),
        status: Joi.string().valid('Working', 'Missing', 'Not Working', 'Maintenance').optional(),
        stockId: Joi.number().optional(),
        remarks: Joi.string().allow('').optional()
    });
    validateRequest(req, next, schema);
}

// Public route for initial data loading
router.get('/public', pcComponentController.getAll);

// Protected routes
router.get('/', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), pcComponentController.getAll);
router.get('/pc/:pcId', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), pcComponentController.getByPCId);
router.get('/item/:itemId', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), pcComponentController.getByItemId);
router.get('/:id', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), pcComponentController.getById);
router.post('/', authorize([Role.SuperAdmin, Role.Admin]), createPCComponentSchema, pcComponentController.create);
router.put('/:id', authorize([Role.SuperAdmin, Role.Admin]), updatePCComponentSchema, pcComponentController.update);
router.delete('/:id', authorize([Role.SuperAdmin, Role.Admin]), pcComponentController.delete);
router.post('/:id/return-to-stock', authorize([Role.SuperAdmin, Role.Admin]), pcComponentController.returnToStock);

module.exports = router; 