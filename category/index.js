const express = require('express');
const router = express.Router();
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');
const validateRequest = require('../_middleware/validate-request');
const Joi = require('joi');
const categoryController = require('./category.controller');

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

// Public route for initial data loading
router.get('/public', categoryController.getAll);

// Protected routes
router.get('/', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), categoryController.getAll);
router.get('/:id', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), categoryController.getById);
router.post('/', authorize([Role.SuperAdmin, Role.Admin]), createSchema, categoryController.create);
router.put('/:id', authorize([Role.SuperAdmin, Role.Admin]), updateSchema, categoryController.update);
router.delete('/:id', authorize([Role.SuperAdmin, Role.Admin]), categoryController._delete);

module.exports = router;
