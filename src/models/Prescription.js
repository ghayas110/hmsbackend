const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Prescription = sequelize.define('Prescription', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    appointment_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    medicines: {
        type: DataTypes.JSON, // Array of objects matching the detailed structure
        allowNull: true,
    },
    complaints: {
        type: DataTypes.TEXT,
        allowNull: false, // Mandatory
    },
    findings: {
        type: DataTypes.JSON, // { title, description }
        allowNull: true,
    },
    diagnosis: {
        type: DataTypes.JSON, // Array of diagnosis strings
        allowNull: true,
    },
    vitals: {
        type: DataTypes.JSON, // { pulse, temp, bp, sugar, height, weight }
        allowNull: true,
    },
    test_orders: {
        type: DataTypes.JSON, // Array of test names or objects
        allowNull: true,
    },
    attachments: {
        type: DataTypes.JSON, // Array of file paths/URLs
        allowNull: true,
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('pending', 'dispensed'),
        defaultValue: 'pending',
    },
}, {
    timestamps: true,
});

module.exports = Prescription;
