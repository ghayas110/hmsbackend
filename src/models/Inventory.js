const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Inventory = sequelize.define('Inventory', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    medicine_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    expiry_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    category: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    supplier: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    min_stock: {
        type: DataTypes.INTEGER,
        defaultValue: 10,
    },
}, {
    timestamps: true,
});

module.exports = Inventory;
