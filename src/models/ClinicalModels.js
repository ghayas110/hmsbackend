const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SavedDiagnosis = sequelize.define('SavedDiagnosis', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    doctor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, { timestamps: true });

const MedicineGroup = sequelize.define('MedicineGroup', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    doctor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    medicines: {
        type: DataTypes.JSON, // Array of { name, dose, duration, frequency, instruction, intake_type }
        allowNull: false,
        defaultValue: [],
    },
}, { timestamps: true });

const TestCategory = sequelize.define('TestCategory', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    doctor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    code: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active'
    },
    lab_type: {
        type: DataTypes.ENUM('pathology', 'radiology', 'other'),
        defaultValue: 'pathology'
    }
}, { timestamps: true });

const TestDefinition = sequelize.define('TestDefinition', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, { timestamps: true });

module.exports = {
    SavedDiagnosis,
    MedicineGroup,
    TestCategory,
    TestDefinition,
};
