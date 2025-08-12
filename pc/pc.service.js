const express = require('express');
const router = express.Router();
const db = require('../_helpers/db');
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');
const validateRequest = require('../_middleware/validate-request');
const Joi = require('joi');

// Validation schemas
function createSchema(req, res, next) {
    const schema = Joi.object({
        name: Joi.string().required(),
        serialNumber: Joi.string().allow(''),
        roomLocationId: Joi.number().required(),
        status: Joi.string().valid('Active', 'Inactive', 'Maintenance', 'Retired').default('Active'),
        assignedTo: Joi.string().allow(''),
        notes: Joi.string().allow('')
    });
    validateRequest(req, next, schema);
}

function updateSchema(req, res, next) {
    const schema = Joi.object({
        name: Joi.string().empty(''),
        serialNumber: Joi.string().allow(''),
        roomLocationId: Joi.number().empty(''),
        status: Joi.string().valid('Active', 'Inactive', 'Maintenance', 'Retired').empty(''),
        assignedTo: Joi.string().allow(''),
        notes: Joi.string().allow('')
    });
    validateRequest(req, next, schema);
}

// Routes
router.get('/public', getAll);
router.get('/', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), getAll);
router.get('/:id', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), getById);
router.post('/', authorize([Role.SuperAdmin, Role.Admin]), createSchema, create);
router.put('/:id', authorize([Role.SuperAdmin, Role.Admin]), updateSchema, update);
router.delete('/:id', authorize([Role.SuperAdmin, Role.Admin]), deletePC);
router.get('/specifications/:categoryId', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), getSpecificationFields);

// Controller functions
function getAll(req, res, next) {
    getAllPCs()
        .then(pcs => res.json(pcs))
        .catch(next);
}

function getById(req, res, next) {
    getPCById(req.params.id)
        .then(pc => pc ? res.json(pc) : res.sendStatus(404))
        .catch(next);
}

function create(req, res, next) {
    createPC(req.body, req.user.id)
        .then(pc => res.json(pc))
        .catch(next);
}

function update(req, res, next) {
    updatePC(req.params.id, req.body)
        .then(pc => res.json(pc))
        .catch(next);
}

function deletePC(req, res, next) {
    deletePCById(req.params.id)
        .then(() => res.json({ message: 'PC deleted successfully' }))
        .catch(next);
}

function getSpecificationFields(req, res, next) {
    getSpecificationFieldsByCategory(req.params.categoryId)
        .then(fields => res.json(fields))
        .catch(next);
}

// Service functions
// Get all PCs with room location
async function getAllPCs() {
    // Check if PC model exists
    if (!db.PC) {
        console.log('⚠️  PC model not available - table may not exist');
        return [];
    }

    try {
        return await db.PC.scope('withAssociations').findAll({
            order: [['createdAt', 'DESC']]
        });
    } catch (error) {
        console.log('⚠️  Error loading PCs:', error.message);
        return [];
    }
}

// Get single PC by ID
async function getPCById(id) {
    return await getPC(id);
}

// Create new PC
async function createPC(params, userId) {
    if (!db.PC) {
        throw 'PC functionality not available - table does not exist';
    }

    // Validate room location exists
    const roomLocation = await db.RoomLocation.findByPk(params.roomLocationId);
    if (!roomLocation) throw 'Room location not found';

    // Check for duplicate serial number if provided
    if (params.serialNumber) {
        const existing = await db.PC.findOne({ where: { serialNumber: params.serialNumber } });
        if (existing) throw 'PC with this serial number already exists';
    }

    const pc = await db.PC.create({
        ...params,
        createdBy: userId
    });

    return await getPC(pc.id);
}

// Update PC
async function updatePC(id, params) {
    if (!db.PC) {
        throw 'PC functionality not available - table does not exist';
    }

    const pc = await getPC(id);

    // Validate room location if being updated
    if (params.roomLocationId) {
        const roomLocation = await db.RoomLocation.findByPk(params.roomLocationId);
        if (!roomLocation) throw 'Room location not found';
    }

    // Check for duplicate serial number if being updated
    if (params.serialNumber && params.serialNumber !== pc.serialNumber) {
        const existing = await db.PC.findOne({ where: { serialNumber: params.serialNumber } });
        if (existing) throw 'PC with this serial number already exists';
    }

    Object.assign(pc, params);
    await pc.save();

    return await getPC(pc.id);
}

// Delete PC
async function deletePCById(id) {
    if (!db.PC) {
        throw 'PC functionality not available - table does not exist';
    }

    const pc = await getPC(id);
    await pc.destroy();
}

// Get specification fields based on category (kept for compatibility)
async function getSpecificationFieldsByCategory(categoryId) {
    if (!db.Category) {
        throw 'Category functionality not available';
    }

    if (!db.SpecificationField) {
        console.log('⚠️  SpecificationField model not available - returning default fields');
        return [
            { name: 'specifications', label: 'Specifications', type: 'textarea' }
        ];
    }

    try {
        const category = await db.Category.findByPk(categoryId);
        if (!category) throw 'Category not found';

        // Get specification fields from the database
        const specFields = await db.SpecificationField.findAll({
            where: { categoryId },
            order: [['fieldOrder', 'ASC']]
        });

        // If no fields defined, return default
        if (specFields.length === 0) {
            return [
                { name: 'specifications', label: 'Specifications', type: 'textarea' }
            ];
        }

        return specFields.map(field => ({
            name: field.fieldName,
            label: field.fieldLabel,
            type: field.fieldType,
            required: field.isRequired,
            options: field.options ? field.options.split(',').map(opt => opt.trim()) : null
        }));
    } catch (error) {
        console.log('⚠️  Error loading specification fields:', error.message);
        return [
            { name: 'specifications', label: 'Specifications', type: 'textarea' }
        ];
    }
}

// Helper function
async function getPC(id) {
    if (!db.PC) {
        throw 'PC functionality not available - table does not exist';
    }

    try {
        const pc = await db.PC.scope('withAssociations').findByPk(id);
        if (!pc) throw 'PC not found';
        return pc;
    } catch (error) {
        console.log('⚠️  Error loading PC:', error.message);
        throw 'PC not found';
    }
}

module.exports = router; 