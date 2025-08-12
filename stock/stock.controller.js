const express = require('express');
const router = express.Router();
const stockService = require('./stock.service');
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');
const validateRequest = require('../_middleware/validate-request');
const Joi = require('joi');

// Validation schema for adding stock
function addStockSchema(req, res, next) {
    const schema = Joi.object({
        itemId: Joi.number().required(),
        quantity: Joi.number().required(),
        locationId: Joi.number().required(),                   // FOREIGN KEY to StorageLocation
        price: Joi.number().required(),                        // NEW FIELD: price
        remarks: Joi.string().allow(''),
        disposeId: Joi.number().optional()                     // Optional link to disposal record
    });
    validateRequest(req, next, schema);
}

// Validation schema for updating stock
function updateStockSchema(req, res, next) {
    const schema = Joi.object({
        quantity: Joi.number().required(),
        locationId: Joi.number().required(),
        price: Joi.number().required(),                        // allow updating price
        remarks: Joi.string().allow('')
    });
    validateRequest(req, next, schema);
}

// Routes
router.get('/public', getLogs);
router.get('/', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), getLogs);                                   // GET all stock logs
router.get('/:id', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), getById);                                // GET single stock log
router.get('/available/:itemId', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), getAvailableStock);        // GET available stock for item
router.post('/', authorize([Role.SuperAdmin, Role.Admin]), addStockSchema, addStock);      // CREATE stock
router.put('/:id', authorize([Role.SuperAdmin, Role.Admin]), updateStockSchema, updateStock); // UPDATE stock
router.delete('/:id', authorize([Role.SuperAdmin, Role.Admin]), _delete);                   // DELETE stock

// Controller functions
// GET all stock logs
function getLogs(req, res, next) {
    stockService.getAll()
        .then(logs => res.send(logs))
        .catch(next);
}

// ADD stock
function addStock(req, res, next) {
    // Ensure locationId is present in request body
    if (!req.body.locationId) {
        return res.status(400).send({ message: 'Location is required' });
    }

    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
        return res.status(401).send({ message: 'User authentication required' });
    }

    stockService.create(req.body, req.user.id)
        .then(stock => res.send(stock))
        .catch(next);
}

// UPDATE stock
function updateStock(req, res, next) {
    stockService.update(req.params.id, req.body)
        .then(stock => res.send(stock))
        .catch(next);
}

// DELETE stock
function _delete(req, res, next) {
    stockService.delete(req.params.id)
        .then(() => res.send({ message: 'Stock entry deleted successfully' }))
        .catch(next);
}

// GET stock by ID
function getById(req, res, next) {
    stockService.getById(req.params.id)
        .then(stock => stock ? res.send(stock) : res.sendStatus(404))
        .catch(next);
}

// GET available stock for an item
function getAvailableStock(req, res, next) {
    stockService.getAvailableStock(req.params.itemId)
        .then(stock => res.send(stock))
        .catch(next);
}

module.exports = router;
