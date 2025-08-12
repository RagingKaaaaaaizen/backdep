const express = require('express');
const router = express.Router();
const brandService = require('./brand.service');
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');
const validateRequest = require('../_middleware/validate-request');
const Joi = require('joi');

// Validation schemas
function createSchema(req, res, next) {
    const schema = Joi.object({
        name: Joi.string().required(),
        description: Joi.string().allow('')
    });
    validateRequest(req, next, schema);
}

function updateSchema(req, res, next) {
    const schema = Joi.object({
        name: Joi.string().empty(''),
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
    brandService.getAll()
        .then(brands => res.json(brands))
        .catch(next);
}

function getById(req, res, next) {
    brandService.getById(req.params.id)
        .then(brand => brand ? res.json(brand) : res.sendStatus(404))
        .catch(next);
}

function create(req, res, next) {
    brandService.create(req.body)
        .then(brand => res.json(brand))
        .catch(next);
}

function update(req, res, next) {
    brandService.update(req.params.id, req.body)
        .then(brand => res.json(brand))
        .catch(next);
}

function _delete(req, res, next) {
    brandService.delete(req.params.id)
        .then(() => res.json({ message: 'Brand deleted successfully' }))
        .catch(next);
}

module.exports = router;
