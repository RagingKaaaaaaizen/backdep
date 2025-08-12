const express = require('express');
const router = express.Router();
const itemService = require('./item.service');
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');
const validateRequest = require('../_middleware/validate-request');
const Joi = require('joi');

// Validation schemas
function createSchema(req, res, next) {
    const schema = Joi.object({
        name: Joi.string().required(),
        categoryId: Joi.number().required(),
        brandId: Joi.number().required(),
        description: Joi.string().allow('')
    });
    validateRequest(req, next, schema);
}

function updateSchema(req, res, next) {
    const schema = Joi.object({
        name: Joi.string().empty(''),
        categoryId: Joi.number().optional(),
        brandId: Joi.number().optional(),
        description: Joi.string().allow('')
    });
    validateRequest(req, next, schema);
}

// Routes
router.get('/public', getAll);
router.get('/', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), getAll);
router.get('/:id', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), getById);
router.post('/', authorize([Role.SuperAdmin, Role.Admin]), createSchema, create);
router.put('/:id', authorize([Role.SuperAdmin, Role.Admin]), updateSchema, update);
router.delete('/:id', authorize([Role.SuperAdmin, Role.Admin]), _delete);

// Controller functions
function getAll(req, res, next) {
    itemService.getAll()
        .then(items => res.json(items))
        .catch(next);
}

function getById(req, res, next) {
    itemService.getById(req.params.id)
        .then(item => item ? res.json(item) : res.sendStatus(404))
        .catch(next);
}

function create(req, res, next) {
    itemService.create(req.body)
        .then(item => res.json(item))
        .catch(next);
}

function update(req, res, next) {
    itemService.update(req.params.id, req.body)
        .then(item => res.json(item))
        .catch(next);
}

function _delete(req, res, next) {
    itemService.delete(req.params.id)
        .then(() => res.json({ message: 'Item deleted successfully' }))
        .catch(next);
}

module.exports = router;
