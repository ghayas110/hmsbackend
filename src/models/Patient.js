const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Patient = sequelize.define('Patient', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    cnic: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    dob: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    gender: {
        type: DataTypes.ENUM('male', 'female', 'other'),
        allowNull: true,
    },
    contact_info: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    blood_type: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    allergies: {
        type: DataTypes.JSON, // Array of strings
        allowNull: true,
    },
    medical_history: {
        type: DataTypes.JSON, // Array of chronic conditions
        allowNull: true,
    },
    emergency_contact: {
        type: DataTypes.JSON, // { name, phone }
        allowNull: true,
    },
    insurance_provider: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    policy_number: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    group_number: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    timestamps: true,
});

module.exports = Patient;
