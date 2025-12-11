const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LabTest = sequelize.define('LabTest', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    patient_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    doctor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    prescription_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    test_type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    result: {
        type: DataTypes.JSON, // Stores { summary, readings: [{ param, value, status, normal_range }] }
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('pending', 'completed'),
        defaultValue: 'pending',
    },
}, {
    timestamps: true,
});

module.exports = LabTest;
