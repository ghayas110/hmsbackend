const { Invoice, Patient, User, Appointment, Doctor } = require('../models');

exports.createInvoice = async (req, res) => {
    try {
        const cashierId = req.user.id;
        const { patient_id, amount } = req.body;

        const invoice = await Invoice.create({
            patient_id,
            amount,
            issued_by: cashierId,
            status: 'unpaid',
        });

        res.status(201).json({ message: 'Invoice created successfully', invoice });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getInvoices = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        // Build where clause for search
        const { Op } = require('sequelize');
        const whereClause = {};

        if (search) {
            // Search by invoice ID or patient name
            whereClause[Op.or] = [
                { id: isNaN(search) ? null : parseInt(search) },
            ];
        }

        const { count, rows: invoices } = await Invoice.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Patient,
                    include: [{ model: User, attributes: ['username', 'email'] }],
                    where: search ? {
                        [Op.or]: [
                            { '$Patient.User.username$': { [Op.like]: `%${search}%` } },
                        ]
                    } : undefined,
                },
                {
                    model: Appointment,
                    include: [{ model: Doctor, include: [{ model: User, attributes: ['username', 'email'] }] }]
                },
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']],
            subQuery: false,
        });

        res.json({
            data: invoices,
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.processPayment = async (req, res) => {
    try {
        const { id } = req.params; // Invoice ID
        const { payment_method, amount } = req.body;

        const invoice = await Invoice.findByPk(id);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        // Optional: Validate amount
        if (amount && parseFloat(amount) !== parseFloat(invoice.amount)) {
            // You might want to handle partial payments or error here.
            // For now, assuming exact payment or updating invoice amount if dynamic.
            // Let's assume passed amount is purely for verification or update if needed.
        }

        await invoice.update({
            status: 'paid',
            payment_method: payment_method
        });

        // Update Appointment Status to 'approved'
        if (invoice.appointment_id) {
            const appointment = await Appointment.findByPk(invoice.appointment_id);
            if (appointment) {
                await appointment.update({ status: 'approved' });
            }
        }

        res.json({ message: 'Payment processed successfully', invoice });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.findAll({
            include: [
                {
                    model: Patient,
                    include: [{ model: User, attributes: ['username', 'email'] }],
                },
                {
                    model: Doctor,
                    include: [{ model: User, attributes: ['username', 'email'] }],
                },
            ],
            order: [['date', 'DESC'], ['time', 'DESC']]
        });
        res.json(appointments);
        // console.log(appointments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAppointmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const appointment = await Appointment.findByPk(id, {
            include: [
                {
                    model: Patient,
                    include: [{ model: User, attributes: ['username', 'email'] }],
                },
                {
                    model: Doctor,
                    include: [{ model: User, attributes: ['username', 'email'] }],
                },
            ],
        });

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        res.json(appointment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getInvoiceById = async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await Invoice.findByPk(id, {
            include: [
                {
                    model: Patient,
                    include: [{ model: User, attributes: ['username', 'email'] }],
                },
                {
                    model: Appointment,
                    include: [{ model: Doctor, include: [{ model: User, attributes: ['username', 'email'] }] }]
                },
            ],
        });

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        res.json(invoice);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
