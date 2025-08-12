const express = require('express');
const router = express.Router();
const db = require('../_helpers/db');
const Item = db.Item;
const ItemCategory = db.ItemCategory;
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');
const validateRequest = require('../_middleware/validate-request');
const Joi = require('joi');

// Validation schemas
function createItemSchema(req, res, next) {
    const schema = Joi.object({
        name: Joi.string().required(),
        description: Joi.string().allow(''),
        quantity: Joi.number().integer().min(0).required(),
        categoryId: Joi.number().integer().required()
    });
    validateRequest(req, next, schema);
}

function updateItemSchema(req, res, next) {
    const schema = Joi.object({
        name: Joi.string().empty(''),
        description: Joi.string().allow(''),
        quantity: Joi.number().integer().min(0).empty(''),
        categoryId: Joi.number().integer().empty('')
    });
    validateRequest(req, next, schema);
}

// Routes
router.get('/items', authorize(), getAllItems);
router.get('/items/:id', authorize(), getItemById);
router.post('/items', authorize(Role.Admin), createItemSchema, createItem);
router.put('/items/:id', authorize(Role.Admin), updateItemSchema, updateItem);
router.delete('/items/:id', authorize(Role.Admin), deleteItem);

// Controller functions
async function getAllItems(req, res, next) {
    try {
        const items = await getAll();
        res.json(items);
    } catch (err) {
        next(err);
    }
}

async function getItemById(req, res, next) {
    try {
        const item = await getById(req.params.id);
        if (!item) throw new Error('Item not found');
        res.json(item);
    } catch (err) {
        next(err);
    }
}

async function createItem(req, res, next) {
    try {
        const item = await create(req.body);
        res.status(201).json(item);
    } catch (err) {
        next(err);
    }
}

async function updateItem(req, res, next) {
    try {
        const item = await update(req.params.id, req.body);
        res.json(item);
    } catch (err) {
        next(err);
    }
}

async function deleteItem(req, res, next) {
    try {
        await _delete(req.params.id);
        res.json({ message: 'Item deleted successfully' });
    } catch (err) {
        next(err);
    }
}

// Service functions
async function getAll() {
    const items = await db.Item.findAll();

    // Fetch categories separately and map names
    const categories = await db.ItemCategory.findAll();
    const categoryMap = {};
    categories.forEach(cat => {
        categoryMap[cat.id] = cat.name;
    });

    // Attach category name to items
    return items.map(item => ({
        ...item.toJSON(),
        categoryName: categoryMap[item.categoryId] || 'Uncategorized'
    }));
}

async function getById(id) {
    return await Item.findByPk(id, {
        include: [{
            model: ItemCategory,
            as: 'category',
            attributes: ['name']
        }]
    });
}

async function create(params) {
    // Validate categoryId
    const category = await ItemCategory.findByPk(params.categoryId);
    if (!category) throw 'Invalid categoryId';

    const item = new Item(params);
    await item.save();
    return item;
}

async function update(id, params) {
    const item = await getById(id);

    // validate
    if (!item) throw 'Item not found';

    // Validate categoryId if it's being updated
    if (params.categoryId && params.categoryId !== item.categoryId) {
        const category = await ItemCategory.findByPk(params.categoryId);
        if (!category) throw 'Invalid categoryId';
    }

    Object.assign(item, params);
    await item.save();

    return item;
}

async function _delete(id) {
    const item = await getById(id);
    if (!item) throw 'Item not found';

    await item.destroy();
}

module.exports = router;
