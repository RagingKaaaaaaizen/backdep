const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        itemId: { type: DataTypes.INTEGER, allowNull: false },
        quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        locationId: { type: DataTypes.INTEGER, allowNull: false },
        price: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
        totalPrice: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
        remarks: { type: DataTypes.TEXT, allowNull: true },
        disposeId: { type: DataTypes.INTEGER, allowNull: true },
        createdBy: { type: DataTypes.INTEGER, allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    };

    const options = { 
        timestamps: true,
        tableName: 'stocks'
    };
    return sequelize.define('Stock', attributes, options);
}
