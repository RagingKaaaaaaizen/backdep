const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const attributes = {
        token: { type: DataTypes.STRING },
        expires: { type: DataTypes.DATE },
        created: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        createdByIp: { type: DataTypes.STRING },
        revoked: { type: DataTypes.DATE },
        revokedByIp: { type: DataTypes.STRING },
        replacedByToken: { type: DataTypes.STRING }
    };

    const options = {
        timestamps: false,
        getterMethods: {
            isExpired() {
                return Date.now() >= this.expires;
            },
            isActive() {
                return !this.revoked && !this.isExpired;
            }
        }
    };

    return sequelize.define('RefreshToken', attributes, options);
};
