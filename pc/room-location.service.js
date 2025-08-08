const db = require('../_helpers/db');

module.exports = {
    getAll,
    getById,
    create,
    update,
    delete: _delete
};

// Get all room locations
async function getAll() {
    try {
        // Check if RoomLocation model is available
        if (!db.RoomLocation) {
            console.error('RoomLocation model is not initialized');
            throw new Error('RoomLocation model is not available');
        }

        // Check if PC model is available for associations
        const includeOptions = [];
        if (db.PC && typeof db.PC === 'function') {
            console.log('PC model is available, including in query');
            includeOptions.push({ model: db.PC, as: 'pcs', attributes: ['id', 'name'] });
        } else {
            console.log('PC model is not available, skipping association');
        }

        console.log('Fetching room locations...');
        const rooms = await db.RoomLocation.findAll({
            include: includeOptions
        });
        console.log(`Found ${rooms.length} room locations`);
        return rooms;
    } catch (error) {
        console.error('Error in getAll room locations:', error);
        throw error;
    }
}

// Get room location by ID
async function getById(id) {
    return await getRoomLocation(id);
}

// Create new room location
async function create(params, userId) {
    if (!params.name) throw 'Name is required';
    if (!userId) throw 'User ID is required';

    const roomData = {
        ...params,
        createdBy: userId
    };

    const room = await db.RoomLocation.create(roomData);
    
    return room;
}

// Update room location
async function update(id, params) {
    const room = await getRoomLocation(id);

    // Update fields
    Object.assign(room, params);
    await room.save();
    
    return room;
}

// Delete room location
async function _delete(id) {
    const room = await getRoomLocation(id);
    await room.destroy();
}

// Helper function to get room location
async function getRoomLocation(id) {
    try {
        // Check if PC model is available for associations
        const includeOptions = [];
        if (db.PC && typeof db.PC === 'function') {
            console.log('PC model is available, including in query');
            includeOptions.push({ model: db.PC, as: 'pcs', attributes: ['id', 'name'] });
        } else {
            console.log('PC model is not available, skipping association');
        }

        const room = await db.RoomLocation.findByPk(id, {
            include: includeOptions
        });
        
        if (!room) throw 'Room Location not found';
        return room;
    } catch (error) {
        console.error('Error in getRoomLocation:', error);
        throw error;
    }
} 