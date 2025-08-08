const itemService = require('./item.service');

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

module.exports = {
    getAll,
    getById,
    create,
    update,
    _delete
};
