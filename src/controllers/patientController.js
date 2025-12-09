const { Appointment, Prescription, Doctor, User, LabTest } = require('../models');
const { Op } = require('sequelize');

exports.getAppointments = async (req, res) => {
    try {
        const patientId = req.user.id; // Assuming user.id is linked to patient.user_id
        // We need to find the Patient record first to get the patient_id
        // Ideally, we should store patient_id in the token or look it up efficiently.
        // For now, let's assume we look it up.
        const { Patient } = require('../models');
        const patient = await Patient.findOne({ where: { user_id: patientId } });

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        const appointments = await Appointment.findAll({
            where: { patient_id: patient.id },
            include: [
                {
                    model: Doctor,
                    include: [{ model: User, attributes: ['username', 'email'] }],
                },
            ],
        });
        res.json(appointments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createAppointment = async (req, res) => {
    try {
        const userId = req.user.id;
        const { doctor_id, date, time, notes } = req.body;

        const { Patient } = require('../models');
        const patient = await Patient.findOne({ where: { user_id: userId } });

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        // Atomic Booking Check: Verify slot availability
        const existingAppointment = await Appointment.findOne({
            where: {
                doctor_id,
                date,
                time,
                status: { [Op.not]: 'cancelled' } // Ignore cancelled appointments
            }
        });

        if (existingAppointment) {
            return res.status(400).json({ message: 'Time slot is not available' });
        }

        const appointment = await Appointment.create({
            patient_id: patient.id,
            doctor_id,
            date,
            time,
            notes,
        });

        // Fetch Doctor to get consultation fee
        const { Doctor, Invoice } = require('../models');
        const doctor = await Doctor.findByPk(doctor_id);

        if (doctor) {
            await Invoice.create({
                patient_id: patient.id,
                amount: doctor.consultation_fee,
                status: 'unpaid',
                payment_method: null,
                issued_by: null, // System generated or can refer to an admin bot if strictly needed
                appointment_id: appointment.id
            });
        }

        res.status(201).json({ message: 'Appointment requested successfully', appointment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getPrescriptions = async (req, res) => {
    try {
        const userId = req.user.id;
        const { Patient } = require('../models');
        const patient = await Patient.findOne({ where: { user_id: userId } });

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        const prescriptions = await Prescription.findAll({
            include: [{
                model: Appointment,
                where: { patient_id: patient.id },
                include: [{ model: Doctor, include: [User] }]
            }]
        });

        res.json(prescriptions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { Patient } = require('../models');
        const patient = await Patient.findOne({ where: { user_id: userId } });

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        // Fetch appointments, prescriptions, and lab tests
        const appointments = await Appointment.findAll({
            where: { patient_id: patient.id },
            include: [Doctor]
        });

        const labTests = await LabTest.findAll({
            where: { patient_id: patient.id }
        });

        res.json({ appointments, labTests });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// In your patient controller file
exports.cancelAppointment = async (req, res) => {
    try {
        const appointmentId = req.params.id;
        const userId = req.user.id;

        const { Patient, Appointment } = require('../models');
        const patient = await Patient.findOne({ where: { user_id: userId } });

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        // Find the appointment and verify it belongs to this patient
        const appointment = await Appointment.findOne({
            where: {
                id: appointmentId,
                patient_id: patient.id
            }
        });

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Check if appointment is already cancelled or completed
        if (appointment.status === 'cancelled') {
            return res.status(400).json({ message: 'Appointment is already cancelled' });
        }

        if (appointment.status === 'completed') {
            return res.status(400).json({ message: 'Cannot cancel a completed appointment' });
        }

        // Update appointment status to cancelled
        appointment.status = 'cancelled';
        await appointment.save();

        res.json({
            message: 'Appointment cancelled successfully',
            appointment
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.searchByCNIC = async (req, res) => {
    try {
        const { cnic } = req.query;
        if (!cnic) return res.status(400).json({ message: 'CNIC is required' });

        const { Patient } = require('../models');
        const patient = await Patient.findOne({
            where: { cnic },
            include: [{ model: User, attributes: ['email', 'username'] }]
        });

        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        res.json(patient);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const { Patient, Invoice } = require('../models');

        const patient = await Patient.findOne({ where: { user_id: userId } });
        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Upcoming Appointments
        const upcomingAppointments = await Appointment.findAll({
            where: {
                patient_id: patient.id,
                date: { [Op.gte]: today },
                status: { [Op.in]: ['pending', 'confirmed', 'approved'] }
            },
            order: [['date', 'ASC'], ['time', 'ASC']],
            include: [{ model: Doctor, include: [{ model: User, attributes: ['username'] }] }]
        });

        const upcomingCount = upcomingAppointments.length;
        const nextAppointment = upcomingAppointments[0] || null;

        // 2. Active Prescriptions (Pending)
        const activePrescriptionsCount = await Prescription.count({
            include: [{
                model: Appointment,
                where: { patient_id: patient.id }
            }],
            where: { status: 'pending' }
        });

        // 3. Recent Vitals
        const lastPrescriptionWithVitals = await Prescription.findOne({
            include: [{
                model: Appointment,
                where: { patient_id: patient.id }
            }],
            where: {
                vitals: { [Op.not]: null }
            },
            order: [['createdAt', 'DESC']]
        });

        const recentVitals = lastPrescriptionWithVitals ? lastPrescriptionWithVitals.vitals : null;

        // 4. Pending Bills
        const pendingBillsSum = await Invoice.sum('amount', {
            where: {
                patient_id: patient.id,
                status: 'unpaid'
            }
        }) || 0;

        // 5. Recent Activity
        const recentActivity = await Appointment.findAll({
            where: { patient_id: patient.id },
            order: [['updatedAt', 'DESC']],
            limit: 5,
            include: [{ model: Doctor, include: [User] }]
        });

        res.json({
            upcomingCount,
            nextAppointment,
            activePrescriptionsCount,
            recentVitals,
            pendingBillsSum,
            recentActivity
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { Patient, User } = require('../models');

        const patient = await Patient.findOne({
            where: { user_id: userId },
            include: [{ model: User, attributes: ['email', 'username'] }]
        });

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        res.json(patient);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, dob, gender, blood_type, contact_info, address, allergies, medical_history, emergency_contact, insurance_provider, policy_number, group_number } = req.body;

        const { Patient } = require('../models');
        const patient = await Patient.findOne({ where: { user_id: userId } });

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        await patient.update({
            name,
            dob,
            gender,
            blood_type,
            contact_info,
            address,
            allergies,
            medical_history,
            emergency_contact,
            insurance_provider,
            policy_number,
            group_number
        });

        res.json({ message: 'Profile updated successfully', patient });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};