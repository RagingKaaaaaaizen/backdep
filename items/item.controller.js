const express = require('express');
const router = express.Router();
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');
const itemService = require('./item.service');

// Routes - Allow guest access for viewing
router.get('/', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer, Role.Guest]), getAll);
router.get('/:id', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer, Role.Guest]), getById);
router.post('/', authorize([Role.SuperAdmin, Role.Admin]), create);
router.put('/:id', authorize([Role.SuperAdmin, Role.Admin]), update);
router.delete('/:id', authorize([Role.SuperAdmin, Role.Admin]), _delete);

module.exports = router;

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
