const express = require('express');
const router = express.Router();
const db = require('../_helpers/db');
const ItemCategory = db.ItemCategory;
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');
const validateRequest = require('../_middleware/validate-request');
const Joi = require('joi');

// Validation schemas
function createItemCategorySchema(req, res, next) {
    const schema = Joi.object({
        name: Joi.string().required(),
        description: Joi.string().allow('')
    });
    validateRequest(req, next, schema);
}

function updateItemCategorySchema(req, res, next) {
    const schema = Joi.object({
        name: Joi.string().empty(''),
        description: Joi.string().allow('')
    });
    validateRequest(req, next, schema);
}

// Routes
router.get('/item-categories', authorize(), getAllItemCategories);
router.get('/item-categories/:id', authorize(), getItemCategoryById);
router.post('/item-categories', authorize(Role.Admin), createItemCategorySchema, createItemCategory);
router.put('/item-categories/:id', authorize(Role.Admin), updateItemCategorySchema, updateItemCategory);
router.delete('/item-categories/:id', authorize(Role.Admin), deleteItemCategory);

// Controller functions
async function getAllItemCategories(req, res, next) {
    try {
        const itemCategories = await getAll();
        res.json(itemCategories);
    } catch (err) {
        next(err);
    }
}

async function getItemCategoryById(req, res, next) {
    try {
        const itemCategory = await getById(req.params.id);
        if (!itemCategory) throw new Error('Item category not found');
        res.json(itemCategory);
    } catch (err) {
        next(err);
    }
}

async function createItemCategory(req, res, next) {
    try {
        const itemCategory = await create(req.body);
        res.status(201).json(itemCategory);
    } catch (err) {
        next(err);
    }
}

async function updateItemCategory(req, res, next) {
    try {
        const itemCategory = await update(req.params.id, req.body);
        res.json(itemCategory);
    } catch (err) {
        next(err);
    }
}

async function deleteItemCategory(req, res, next) {
    try {
        await _delete(req.params.id);
        res.json({ message: 'Item category deleted successfully' });
    } catch (err) {
        next(err);
    }
}

// Service functions
async function getAll() {
    return await ItemCategory.findAll();
}

async function getById(id) {
    return await ItemCategory.findByPk(id);
}

async function create(params) {
    const itemCategory = new ItemCategory(params);
    await itemCategory.save();
    return itemCategory;
}

async function update(id, params) {
    const itemCategory = await getById(id);

    // validate
    if (!itemCategory) throw 'Item category not found';
    if (itemCategory.name !== params.name && await ItemCategory.findOne({ where: { name: params.name } })) {
        throw 'Name "' + params.name + '" is already taken';
    }

    Object.assign(itemCategory, params);
    await itemCategory.save();

    return itemCategory;
}

async function _delete(id) {
    const itemCategory = await getById(id);
    if (!itemCategory) throw 'Item category not found';

    await itemCategory.destroy();
}

module.exports = router;
