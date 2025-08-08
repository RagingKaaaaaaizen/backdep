const express = require('express');
const router = express.Router();
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');
const storageLocationService = require('./storage-location.service');

// Routes - Allow guest access for viewing
router.get('/', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer, Role.Guest]), getAll);
router.get('/:id', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer, Role.Guest]), getById);
router.post('/', authorize([Role.SuperAdmin, Role.Admin]), create);
router.put('/:id', authorize([Role.SuperAdmin, Role.Admin]), update);
router.delete('/:id', authorize([Role.SuperAdmin, Role.Admin]), _delete);

module.exports = router;

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
