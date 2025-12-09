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
    test_type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    result: {
        type: DataTypes.TEXT,
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
