const db = require('../_helpers/db');

module.exports = {
    getAll,
    getById,
    create,
    update,
    delete: _delete,
    getDisposalsByItem,
    validateDisposal,
    getDisposalWithStock,
    getStockWithDisposal
};

// Get all disposal records
async function getAll() {
    // Check if Dispose model exists
    if (!db.Dispose) {
        console.log('⚠️  Dispose model not available - table may not exist');
        return [];
    }

    try {
        return await db.Dispose.findAll({
            include: [
                { 
                    model: db.Item, 
                    as: 'item', 
                    attributes: ['id', 'name'],
                    include: [
                        { model: db.Category, as: 'category', attributes: ['id', 'name'] },
                        { model: db.Brand, as: 'brand', attributes: ['id', 'name'] }
                    ]
                },
                { model: db.StorageLocation, as: 'location', attributes: ['id', 'name'] },
                { model: db.Account, as: 'user', attributes: ['id', 'firstName', 'lastName'] }
            ],
            order: [['createdAt', 'DESC']]
        });
    } catch (error) {
        console.log('⚠️  Error loading disposals:', error.message);
        return [];
    }
}

// Get single disposal record
async function getById(id) {
    return await getDisposal(id);
}

// Create new disposal record
async function create(params, userId) {
    if (!db.Dispose) {
        throw 'Dispose functionality not available - table does not exist';
    }

    console.log('=== CREATE DISPOSAL SERVICE ===');
    console.log('Parameters:', params);
    console.log('User ID:', userId);
    
    try {
        // Basic validation
        if (!params.itemId) throw 'Item is required';
        if (!params.quantity) throw 'Quantity is required';
        if (!params.locationId) throw 'Location is required';
        if (!userId) throw 'User ID is required';

        // Calculate total value
        const disposalValue = params.disposalValue || 0;
        const totalValue = params.quantity * disposalValue;
        console.log('Calculated total value:', totalValue);

        const disposalData = {
            itemId: params.itemId,
            quantity: params.quantity,
            disposalValue: disposalValue,
            totalValue: totalValue,
            locationId: params.locationId,
            reason: params.reason || '',
            disposalDate: new Date(),
            createdBy: userId
        };

        console.log('Creating disposal with data:', disposalData);

        const disposal = await db.Dispose.create(disposalData);
        console.log('Disposal record created successfully:', disposal.id);
        
        // Find existing stock entries with positive quantities (additions)
        const stockEntries = await db.Stock.findAll({
            where: { 
                itemId: params.itemId,
                disposeId: null // Only addition entries
            },
            order: [['createdAt', 'ASC']] // Oldest first
        });

        let remainingQuantity = params.quantity;
        
        // Update existing stock entries, reducing from oldest first
        for (const stock of stockEntries) {
            if (remainingQuantity <= 0) break;
            
            if (stock.quantity > 0) {
                const quantityToDeduct = Math.min(stock.quantity, remainingQuantity);
                stock.quantity -= quantityToDeduct;
                remainingQuantity -= quantityToDeduct;
                
                // Update the stock entry
                await stock.save();
                console.log(`Reduced stock entry ${stock.id} by ${quantityToDeduct} for disposal, new quantity: ${stock.quantity}`);
            }
        }
        
        if (remainingQuantity > 0) {
            throw `Insufficient stock for disposal. Could only dispose ${params.quantity - remainingQuantity} out of ${params.quantity} requested`;
        }
        
        // Return simple disposal record without complex relationships
        return disposal;
    } catch (error) {
        console.error('Error in create disposal:', error);
        throw error;
    }
}

// Update disposal record
async function update(id, params) {
    if (!db.Dispose) {
        throw 'Dispose functionality not available - table does not exist';
    }

    const disposal = await getDisposal(id);

    // Update fields
    disposal.quantity = params.quantity ?? disposal.quantity;
    disposal.disposalValue = params.disposalValue ?? disposal.disposalValue;
    disposal.totalValue = disposal.quantity * disposal.disposalValue;
    disposal.locationId = params.locationId ?? disposal.locationId;
    disposal.reason = params.reason ?? disposal.reason;

    await disposal.save();
    return disposal;
}

// Delete disposal record
async function _delete(id) {
    if (!db.Dispose) {
        throw 'Dispose functionality not available - table does not exist';
    }

    const disposal = await getDisposal(id);
    await disposal.destroy();
}

// Get disposals for a specific item
async function getDisposalsByItem(itemId) {
    if (!db.Dispose) {
        console.log('⚠️  Dispose model not available - table may not exist');
        return [];
    }

    try {
        return await db.Dispose.findAll({
            where: { itemId },
            include: [
                { model: db.Item, as: 'item', attributes: ['id', 'name'] },
                { model: db.StorageLocation, as: 'location', attributes: ['id', 'name'] }
            ],
            order: [['createdAt', 'DESC']]
        });
    } catch (error) {
        console.log('⚠️  Error loading disposals by item:', error.message);
        return [];
    }
}

// Validate disposal against available stock
async function validateDisposal(itemId, quantity) {
    if (!db.Stock) {
        console.log('⚠️  Stock model not available - table may not exist');
        return {
            valid: false,
            message: 'Stock functionality not available'
        };
    }

    console.log('=== VALIDATE DISPOSAL SERVICE ===');
    console.log('ItemId:', itemId, 'Quantity:', quantity);
    
    try {
        // Get all stock entries for this item
        const stockEntries = await db.Stock.findAll({
            where: { itemId }
        });
        
        console.log('Found stock entries:', stockEntries.length);
        console.log('Stock entries:', stockEntries.map(s => ({ id: s.id, itemId: s.itemId, quantity: s.quantity, disposeId: s.disposeId })));

        // Calculate available stock (sum of all positive quantities)
        let totalStock = 0;
        stockEntries.forEach(entry => {
            if (entry.quantity > 0) {
                totalStock += entry.quantity;
                console.log('Adding stock:', entry.quantity, 'New total:', totalStock);
            }
        });

        // Get PC components usage for this item
        let usedInPCComponents = 0;
        if (db.PCComponent) {
            const pcComponents = await db.PCComponent.findAll({
                where: { itemId }
            });
            
            usedInPCComponents = pcComponents.reduce((total, component) => {
                return total + component.quantity;
            }, 0);
        }
        
        console.log('PC components using this item:', usedInPCComponents);

        // Calculate available stock (total stock - used in PC components)
        const availableStock = Math.max(0, totalStock - usedInPCComponents);
        console.log('Total stock:', totalStock, 'Used in PCs:', usedInPCComponents, 'Available:', availableStock);

        // If quantity is 0, just return available stock info
        if (quantity === 0) {
            console.log('Quantity is 0, returning available stock info');
            return {
                valid: true,
                availableStock: availableStock,
                totalStock: totalStock,
                usedInPCComponents: usedInPCComponents
            };
        }

        if (quantity > availableStock) {
            console.log('Validation failed: quantity > availableStock');
            return {
                valid: false,
                message: `Cannot dispose ${quantity} items. Only ${availableStock} items available (${totalStock} total stock - ${usedInPCComponents} used in PC components).`
            };
        }

        console.log('Validation successful');
        return {
            valid: true,
            availableStock: availableStock,
            totalStock: totalStock,
            usedInPCComponents: usedInPCComponents
        };
    } catch (error) {
        console.log('⚠️  Error validating disposal:', error.message);
        return {
            valid: false,
            message: 'Error validating disposal'
        };
    }
}

// Helper function
async function getDisposal(id) {
    if (!db.Dispose) {
        throw 'Dispose functionality not available - table does not exist';
    }

    try {
        const disposal = await db.Dispose.findByPk(id, {
            include: [
                { 
                    model: db.Item, 
                    as: 'item', 
                    attributes: ['id', 'name'],
                    include: [
                        { model: db.Category, as: 'category', attributes: ['id', 'name'] },
                        { model: db.Brand, as: 'brand', attributes: ['id', 'name'] }
                    ]
                },
                { model: db.StorageLocation, as: 'location', attributes: ['id', 'name'] },
                { model: db.Account, as: 'user', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });
        if (!disposal) throw 'Disposal record not found';
        return disposal;
    } catch (error) {
        console.log('⚠️  Error loading disposal:', error.message);
        throw 'Disposal record not found';
    }
}

// Get disposal with related stock entries
async function getDisposalWithStock(disposalId) {
    if (!db.Dispose || !db.Stock) {
        throw 'Dispose or Stock functionality not available - tables do not exist';
    }

    const disposal = await getDisposal(disposalId);
    
    // Find related stock entries for this disposal
    const stockEntries = await db.Stock.findAll({
        where: {
            disposeId: disposalId
        },
        include: [
            { model: db.Item, as: 'item', attributes: ['id', 'name'] },
            { model: db.StorageLocation, as: 'location', attributes: ['id', 'name'] }
        ]
    });

    return {
        disposal,
        stockEntries
    };
}

// Get stock entries with disposal information
async function getStockWithDisposal(itemId) {
    if (!db.Stock) {
        console.log('⚠️  Stock model not available - table may not exist');
        return [];
    }

    try {
        const stockEntries = await db.Stock.findAll({
            where: { itemId },
            include: [
                { model: db.Item, as: 'item', attributes: ['id', 'name'] },
                { model: db.StorageLocation, as: 'location', attributes: ['id', 'name'] },
                { model: db.Dispose, as: 'disposal', attributes: ['id', 'quantity', 'disposalValue', 'reason', 'disposalDate'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        return stockEntries;
    } catch (error) {
        console.log('⚠️  Error loading stock with disposal:', error.message);
        return [];
    }
} 