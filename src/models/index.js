const sequelize = require('../config/database');
const User = require('./User');
const Patient = require('./Patient');
const Doctor = require('./Doctor');
const Appointment = require('./Appointment');
const Prescription = require('./Prescription');
const Invoice = require('./Invoice');
const Inventory = require('./Inventory');
const LabTest = require('./LabTest');

const { SavedDiagnosis, MedicineGroup, TestCategory, TestDefinition } = require('./ClinicalModels');

// Associations
// User -> Patient/Doctor
User.hasOne(Patient, { foreignKey: 'user_id' });
Patient.belongsTo(User, { foreignKey: 'user_id' });

User.hasOne(Doctor, { foreignKey: 'user_id' });
Doctor.belongsTo(User, { foreignKey: 'user_id' });

// Appointment -> Patient/Doctor
Patient.hasMany(Appointment, { foreignKey: 'patient_id' });
Appointment.belongsTo(Patient, { foreignKey: 'patient_id' });

Doctor.hasMany(Appointment, { foreignKey: 'doctor_id' });
Appointment.belongsTo(Doctor, { foreignKey: 'doctor_id' });

// Appointment -> Prescription
Appointment.hasOne(Prescription, { foreignKey: 'appointment_id' });
Prescription.belongsTo(Appointment, { foreignKey: 'appointment_id' });

// Invoice -> Patient
Patient.hasMany(Invoice, { foreignKey: 'patient_id' });
Invoice.belongsTo(Patient, { foreignKey: 'patient_id' });

// Invoice -> Appointment
Appointment.hasOne(Invoice, { foreignKey: 'appointment_id' });
Invoice.belongsTo(Appointment, { foreignKey: 'appointment_id' });

// LabTest -> Patient/Doctor
Patient.hasMany(LabTest, { foreignKey: 'patient_id' });
LabTest.belongsTo(Patient, { foreignKey: 'patient_id' });

Doctor.hasMany(LabTest, { foreignKey: 'doctor_id' });
LabTest.belongsTo(Doctor, { foreignKey: 'doctor_id' });

// Clinical Data Associations (owned by Doctor)
Doctor.hasMany(SavedDiagnosis, { foreignKey: 'doctor_id' });
SavedDiagnosis.belongsTo(Doctor, { foreignKey: 'doctor_id' });

Doctor.hasMany(MedicineGroup, { foreignKey: 'doctor_id' });
MedicineGroup.belongsTo(Doctor, { foreignKey: 'doctor_id' });

Doctor.hasMany(TestCategory, { foreignKey: 'doctor_id' });
TestCategory.belongsTo(Doctor, { foreignKey: 'doctor_id' });

TestCategory.hasMany(TestDefinition, { foreignKey: 'category_id' });
TestDefinition.belongsTo(TestCategory, { foreignKey: 'category_id' });

module.exports = {
    sequelize,
    User,
    Patient,
    Doctor,
    Appointment,
    Prescription,
    Invoice,
    Inventory,
    LabTest,
    SavedDiagnosis,
    MedicineGroup,
    TestCategory,
    TestDefinition,
};
