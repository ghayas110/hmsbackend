const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Appointment = sequelize.define('Appointment', {
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
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    time: {
        type: DataTypes.TIME,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'completed', 'cancelled', 'approved'),
        defaultValue: 'pending',
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    timestamps: true,
});

module.exports = Appointment;
