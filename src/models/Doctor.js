const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Doctor = sequelize.define('Doctor', {
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
    specialization: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    schedule_details: {
        type: DataTypes.JSON, // Store schedule as JSON for flexibility
        allowNull: true,
    },
    consultation_fee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
    },
    shift_start: {
        type: DataTypes.TIME,
        allowNull: true, // Allow null initially if not set
    },
    shift_end: {
        type: DataTypes.TIME,
        allowNull: true,
    },
}, {
    timestamps: true,
});

module.exports = Doctor;
