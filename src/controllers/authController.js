const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Patient, Doctor } = require('../models');

exports.register = async (req, res) => {
    try {
        const { username, email, password, role, ...otherDetails } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            username,
            email,
            password_hash,
            role,
        });

        // Create role-specific profile
        if (role === 'patient') {
            await Patient.create({
                user_id: user.id,
                name: otherDetails.name || username,
                cnic: otherDetails.cnic,
                ...otherDetails,
            });
        } else if (role === 'doctor') {
            await Doctor.create({
                user_id: user.id,
                specialization: otherDetails.specialization || 'General',
                consultation_fee: otherDetails.consultation_fee || 0,
                shift_start: otherDetails.shift_start,
                shift_end: otherDetails.shift_end,
                ...otherDetails,
            });
        }

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check user
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate Token
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAllDoctors = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Validate pagination parameters
        if (page < 1 || limit < 1) {
            return res.status(400).json({ message: 'Invalid pagination parameters' });
        }

        const { count, rows } = await Doctor.findAndCountAll({
            include: [{ model: User, attributes: ['id', 'username', 'email'] }],
            limit,
            offset,
            order: [['id', 'ASC']]
        });

        const totalPages = Math.ceil(count / limit);

        res.json({
            data: rows,
            pagination: {
                total: count,
                page,
                limit,
                totalPages
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getAllPatients = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Validate pagination parameters
        if (page < 1 || limit < 1) {
            return res.status(400).json({ message: 'Invalid pagination parameters' });
        }

        const { count, rows } = await Patient.findAndCountAll({
            include: [{ model: User, attributes: ['id', 'username', 'email'] }],
            limit,
            offset,
            order: [['id', 'ASC']]
        });

        const totalPages = Math.ceil(count / limit);

        res.json({
            data: rows,
            pagination: {
                total: count,
                page,
                limit,
                totalPages
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getDoctorById = async (req, res) => {
    try {
        const { id } = req.params;

        const doctor = await Doctor.findByPk(id, {
            include: [{ model: User, attributes: ['id', 'username', 'email'] }]
        });

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        res.json(doctor);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getPatientById = async (req, res) => {
    try {
        const { id } = req.params;

        const patient = await Patient.findByPk(id, {
            include: [{ model: User, attributes: ['id', 'username', 'email'] }]
        });

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        res.json(patient);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
