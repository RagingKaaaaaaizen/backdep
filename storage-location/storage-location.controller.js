const express = require('express');
const router = express.Router();
const storageLocationService = require('./storage-location.service');
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');
const validateRequest = require('../_middleware/validate-request');
const Joi = require('joi');

// Validation schema
function schema(req, res, next) {
    const validation = Joi.object({
        name: Joi.string().required(),
        description: Joi.string().allow('')
    });
    validateRequest(req, next, validation);
}

// Routes
router.get('/', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), getAll);
router.get('/:id', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), getById);
router.post('/', authorize([Role.SuperAdmin, Role.Admin]), schema, create);
router.put('/:id', authorize([Role.SuperAdmin, Role.Admin]), schema, update);
router.delete('/:id', authorize([Role.SuperAdmin, Role.Admin]), _delete);

// Controller functions
function getAll(req, res, next) {
    storageLocationService.getAll()
        .then(locations => res.json(locations))
        .catch(next);
}

function getById(req, res, next) {
    storageLocationService.getById(req.params.id)
        .then(location => location ? res.json(location) : res.sendStatus(404))
        .catch(next);
}

function create(req, res, next) {
    storageLocationService.create(req.body)
        .then(location => res.json(location))
        .catch(next);
}

function update(req, res, next) {
    storageLocationService.update(req.params.id, req.body)
        .then(location => res.json(location))
        .catch(next);
}

function _delete(req, res, next) {
    storageLocationService.delete(req.params.id)
        .then(() => res.json({ message: 'Storage location deleted successfully' }))
        .catch(next);
}

module.exports = router;
