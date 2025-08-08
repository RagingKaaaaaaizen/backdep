const storageLocationService = require('./storage-location.service');

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

module.exports = {
    getAll,
    getById,
    create,
    update,
    _delete
};
