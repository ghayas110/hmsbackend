const { Appointment, Prescription, Patient, User, LabTest, Doctor, SavedDiagnosis, MedicineGroup, TestCategory, TestDefinition, Invoice, Inventory } = require('../models');
const { Op } = require('sequelize');

exports.getAppointments = async (req, res) => {
    try {
        const doctorId = req.user.id;

        const doctor = await Doctor.findOne({ where: { user_id: doctorId } });


        if (!doctor) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }

        // Get today's date in YYYY-MM-DD format based on local server time
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayString = `${year}-${month}-${day}`;

        const appointments = await Appointment.findAll({
            where: { doctor_id: doctor.id },
            include: [
                {
                    model: Patient,
                    include: [{ model: User, attributes: ['username', 'email'] }],
                },
            ],
            order: [['date', 'ASC'], ['time', 'ASC']]
        });

        const todayAppointments = appointments.filter(a => {
            // Sequelize DATEONLY usually returns a string YYYY-MM-DD
            // If it returns a Date object, converts to string safely
            let appDateString = a.date;
            if (a.date instanceof Date) {
                appDateString = a.date.toISOString().split('T')[0];
            }
            return appDateString === todayString;
        });
        const upcomingAppointments = appointments.filter(a => {
            let appDateString = a.date;
            if (a.date instanceof Date) {
                appDateString = a.date.toISOString().split('T')[0];
            }
            return appDateString > todayString;
        });

        res.json({
            today: todayAppointments,
            upcoming: upcomingAppointments,
            all: appointments
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getPatientRecords = async (req, res) => {
    try {
        const { id } = req.params; // Patient ID
        const patient = await Patient.findByPk(id, {
            include: [
                { model: User, attributes: ['username', 'email'] },
                {
                    model: Appointment,
                    include: [Prescription]
                },
                { model: LabTest }
            ]
        });

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        res.json(patient);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createPrescription = async (req, res) => {
    try {
        const {
            appointment_id,
            medicines,
            complaints,
            findings,
            diagnosis,
            vitals,
            test_orders,
            attachments,
            notes
        } = req.body;

        // Verify appointment exists
        const appointment = await Appointment.findByPk(appointment_id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        const prescription = await Prescription.create({
            appointment_id,
            medicines,
            complaints,
            findings,
            diagnosis,
            vitals,
            test_orders,
            attachments,
            notes
        });

        // Update appointment status to completed
        await appointment.update({ status: 'completed' });

        // Generate Invoice
        // Fetch Doctor fee
        const doctor = await Doctor.findByPk(appointment.doctor_id);
        const amount = doctor ? doctor.consultation_fee : 0;

        const invoice = await Invoice.create({
            patient_id: appointment.patient_id,
            amount: amount,
            status: 'unpaid',
            issued_by: req.user.id, // Doctor issuing it
            appointment_id: appointment.id
        });

        res.status(201).json({
            message: 'Prescription created successfully and Invoice generated',
            prescription,
            invoice
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, time, status, notes } = req.body;

        const appointment = await Appointment.findByPk(id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        await appointment.update({
            date,
            time,
            status,
            notes
        });

        res.json({ message: 'Appointment updated successfully', appointment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteAppointment = async (req, res) => {
    try {
        const { id } = req.params;

        const appointment = await Appointment.findByPk(id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        await appointment.destroy();

        res.json({ message: 'Appointment deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updatePrescription = async (req, res) => {
    try {
        const { id } = req.params;
        const { medicines, notes } = req.body;

        const prescription = await Prescription.findByPk(id);
        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        await prescription.update({
            medicines,
            notes
        });

        res.json({ message: 'Prescription updated successfully', prescription });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deletePrescription = async (req, res) => {
    try {
        const { id } = req.params;

        const prescription = await Prescription.findByPk(id);
        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        await prescription.destroy();

        res.json({ message: 'Prescription deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Clinical Management Methods

exports.addDiagnosis = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const doctor = await Doctor.findOne({ where: { user_id: doctorId } });
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        const { name } = req.body;
        const diagnosis = await SavedDiagnosis.create({ doctor_id: doctor.id, name });
        res.status(201).json(diagnosis);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getDiagnoses = async (req, res) => {
    try {
        const doctorId = req.user.id; // User ID
        const doctor = await Doctor.findOne({ where: { user_id: doctorId } });
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        const diagnoses = await SavedDiagnosis.findAll({ where: { doctor_id: doctor.id } });
        res.json(diagnoses);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.deleteDiagnosis = async (req, res) => {
    try {
        const { id } = req.params;
        const doctorId = req.user.id;

        // Find diagnosis and ensure it belongs to the doctor
        const diagnosis = await SavedDiagnosis.findOne({
            where: { id },
            include: [{ model: Doctor, where: { user_id: doctorId } }]
        });

        if (!diagnosis) {
            return res.status(404).json({ message: 'Diagnosis not found or authorized' });
        }

        await diagnosis.destroy();
        res.json({ message: 'Diagnosis deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateDiagnosis = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const doctorId = req.user.id;

        const diagnosis = await SavedDiagnosis.findOne({
            where: { id },
            include: [{ model: Doctor, where: { user_id: doctorId } }]
        });

        if (!diagnosis) {
            return res.status(404).json({ message: 'Diagnosis not found or authorized' });
        }

        await diagnosis.update({ name });
        res.json({ message: 'Diagnosis updated successfully', diagnosis });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.addMedicineGroup = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const doctor = await Doctor.findOne({ where: { user_id: doctorId } });
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        const { name, medicines } = req.body;
        const group = await MedicineGroup.create({ doctor_id: doctor.id, name, medicines });
        res.status(201).json(group);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getMedicineGroups = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const doctor = await Doctor.findOne({ where: { user_id: doctorId } });
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        const groups = await MedicineGroup.findAll({ where: { doctor_id: doctor.id } });
        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getMedicineGroupById = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const { id } = req.params;
        const doctor = await Doctor.findOne({ where: { user_id: doctorId } });
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        const group = await MedicineGroup.findOne({
            where: {
                id,
                doctor_id: doctor.id
            }
        });

        if (!group) {
            return res.status(404).json({ message: 'Medicine Group not found' });
        }

        res.json(group);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateMedicineGroup = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const { id } = req.params;
        const { name, medicines } = req.body;
        const doctor = await Doctor.findOne({ where: { user_id: doctorId } });
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        const group = await MedicineGroup.findOne({
            where: {
                id,
                doctor_id: doctor.id
            }
        });

        if (!group) {
            return res.status(404).json({ message: 'Medicine Group not found' });
        }

        await group.update({ name, medicines });
        res.json({ message: 'Medicine Group updated successfully', group });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.deleteMedicineGroup = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const { id } = req.params;
        const doctor = await Doctor.findOne({ where: { user_id: doctorId } });
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        const group = await MedicineGroup.findOne({
            where: {
                id,
                doctor_id: doctor.id
            }
        });

        if (!group) {
            return res.status(404).json({ message: 'Medicine Group not found' });
        }

        await group.destroy();
        res.json({ message: 'Medicine Group deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.addTestCategory = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const doctor = await Doctor.findOne({ where: { user_id: doctorId } });
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        const { name, code, description, status, lab_type } = req.body;
        const category = await TestCategory.create({
            doctor_id: doctor.id,
            name,
            code,
            description,
            status,
            lab_type
        });
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getTestCategories = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const doctor = await Doctor.findOne({ where: { user_id: doctorId } });
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        const categories = await TestCategory.findAll({
            include: [TestDefinition]
        });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateTestCategory = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const { id } = req.params;
        const { name, code, description, status, lab_type } = req.body;
        const doctor = await Doctor.findOne({ where: { user_id: doctorId } });
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        const category = await TestCategory.findOne({
            where: { id, doctor_id: doctor.id }
        });

        if (!category) return res.status(404).json({ message: 'Test Category not found' });

        await category.update({ name, code, description, status, lab_type });
        res.json({ message: 'Test Category updated successfully', category });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.deleteTestCategory = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const { id } = req.params;
        const doctor = await Doctor.findOne({ where: { user_id: doctorId } });
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        const category = await TestCategory.findOne({
            where: { id, doctor_id: doctor.id }
        });

        if (!category) return res.status(404).json({ message: 'Test Category not found' });

        await category.destroy();
        res.json({ message: 'Test Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.addTestDefinition = async (req, res) => {
    try {
        const { category_id, name } = req.body;
        const test = await TestDefinition.create({ category_id, name });
        res.status(201).json(test);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Slot Generation/Validation Logic (Helper)
exports.getDoctorSlots = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const doctor = await Doctor.findOne({ where: { user_id: doctorId } });
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        // Only proceed if shifts are defined
        if (!doctor.shift_start || !doctor.shift_end) {
            return res.json({ message: 'No shift timings defined', slots: [] });
        }

        const { date } = req.query; // YYYY-MM-DD
        if (!date) return res.status(400).json({ message: 'Date is required' });

        const start = new Date(`${date}T${doctor.shift_start}`);
        const end = new Date(`${date}T${doctor.shift_end}`);
        const slotDuration = 20; // minutes

        // Fetch existing appointments for this date
        const appointments = await Appointment.findAll({
            where: {
                doctor_id: doctor.id,
                date: date
            }
        });

        const bookedTimes = appointments.map(a => a.time + ':00' /* ensure seconds match if needed, or better substring */);

        let slots = [];
        let current = new Date(start);

        while (current < end) {
            let timeString = current.toTimeString().split(' ')[0]; // HH:MM:SS
            // Format to HH:MM:00 for consistency

            // Check if booked (simple string match for now, ideally use time comparisons)
            // Sequelize TIME usually comes as HH:MM:SS
            const isBooked = appointments.some(a => a.time === timeString || a.time.startsWith(timeString.substring(0, 5)));

            if (!isBooked) {
                slots.push(timeString);
            }

            current.setMinutes(current.getMinutes() + slotDuration);
        }

        res.json(slots);

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getInventory = async (req, res) => {
    try {
        const { search } = req.query;
        let whereClause = {};

        if (search) {
            whereClause = {
                medicine_name: { [Op.like]: `%${search}%` }
            };
        }

        const inventory = await Inventory.findAll({ where: whereClause });
        res.json(inventory);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getInventory = async (req, res) => {
    try {
        const { search } = req.query;
        let whereClause = {};

        if (search) {
            whereClause = {
                medicine_name: { [Op.like]: `%${search}%` }
            };
        }

        const inventory = await Inventory.findAll({ where: whereClause });
        res.json(inventory);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};