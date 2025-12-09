const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Invoice = sequelize.define('Invoice', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    patient_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('paid', 'unpaid'),
        defaultValue: 'unpaid',
    },
    issued_by: {
        type: DataTypes.INTEGER, // User ID of the cashier
        allowNull: true,
    },
    appointment_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    payment_method: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    timestamps: true,
});

module.exports = Invoice;
