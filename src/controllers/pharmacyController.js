const { Inventory, Prescription, Appointment, Patient, User, Doctor, Invoice, sequelize } = require('../models');
const { Op } = require('sequelize');

// ... existing code ...

exports.getDoctorById = async (req, res) => {
    try {
        const { id } = req.params;

        const doctor = await Doctor.findByPk(id, {
            include: [{ model: User, attributes: ['username', 'email'] }]
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

exports.addInventory = async (req, res) => {
    try {
        const { medicine_name, stock, price, expiry_date, category, supplier, min_stock } = req.body;

        const item = await Inventory.create({
            medicine_name,
            stock,
            price,
            expiry_date,
            category,
            supplier,
            min_stock: min_stock || 10
        });

        res.status(201).json({ message: 'Inventory added successfully', item });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateInventory = async (req, res) => {
    try {
        const { id } = req.params;
        const { medicine_name, stock, price, expiry_date, category, supplier, min_stock } = req.body;

        const item = await Inventory.findByPk(id);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        await item.update({
            medicine_name,
            stock,
            price,
            expiry_date,
            category,
            supplier,
            min_stock
        });

        res.json({ message: 'Inventory updated successfully', item });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteInventory = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await Inventory.findByPk(id);

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        await item.destroy();
        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getInventoryStats = async (req, res) => {
    try {
        const totalItems = await Inventory.count();
        const totalStock = await Inventory.sum('stock') || 0;

        // Low Stock (stock < min_stock)
        const lowStock = await Inventory.count({
            where: {
                stock: { [Op.lt]: sequelize.col('min_stock') }
            }
        });

        // Expiring Soon (within 30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const expiringSoon = await Inventory.count({
            where: {
                expiry_date: {
                    [Op.lte]: thirtyDaysFromNow,
                    [Op.gte]: new Date()
                }
            }
        });

        res.json({
            totalItems,
            totalStock,
            lowStock,
            expiringSoon
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getPrescriptions = async (req, res) => {
    try {
        const { search, status } = req.query;
        let whereClause = {};

        if (status) {
            whereClause.status = status;
        } else {
            // Optional: Default to pending, or all? Let's show all if undefined, or specific status.
            // For UI: "Pending" is usually default.
        }

        // Search logic (Patient Name, MRN, ID)
        let patientWhere = {};
        if (search) {
            // If search is numeric, maybe ID search? Or generic search across fields.
            // Assuming MRN is not yet in Patient, use Name search on User/Patient or ID.
            // Simplified: Check name match primarily.
        }

        const prescriptions = await Prescription.findAll({
            where: whereClause,
            include: [{
                model: Appointment,
                include: [{
                    model: Patient,
                    where: search ? { name: { [Op.like]: `%${search}%` } } : undefined,
                    include: [{ model: User, attributes: ['username', 'email'] }]


                },
                {

                    model: Doctor,
                    where: search ? { name: { [Op.like]: `%${search}%` } } : undefined,
                    include: [{ model: User, attributes: ['username', 'email'] }]
                }]
            }],
            order: [['createdAt', 'DESC']]
        });
        res.json(prescriptions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.dispensePrescription = async (req, res) => {
    try {
        const { id } = req.params;
        const { payment_method } = req.body || {};
        const prescription = await Prescription.findByPk(id, {
            include: [{ model: Appointment }]
        });

        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        if (prescription.status === 'dispensed') {
            return res.status(400).json({ message: 'Prescription already dispensed' });
        }

        const medicines = prescription.medicines || [];
        let totalCost = 0;
        const inventoryUpdates = [];

        // 1. Validation Phase
        for (const med of medicines) {
            const inventoryItem = await Inventory.findOne({
                where: { medicine_name: med.name }
            });

            if (!inventoryItem) {
                return res.status(400).json({ message: `Medicine ${med.name} not found in inventory.` });
            }

            const quantity = med.quantity || 1;
            if (inventoryItem.stock < quantity) {
                return res.status(400).json({ message: `Insufficient stock for ${med.name}. Available: ${inventoryItem.stock}, Required: ${quantity}` });
            }

            totalCost += parseFloat(inventoryItem.price) * quantity;
            inventoryUpdates.push({ item: inventoryItem, quantity });
        }

        // 2. Execution Phase
        // Reduce stock
        for (const update of inventoryUpdates) {
            await update.item.decrement('stock', { by: update.quantity });
        }

        // Create Invoice
        let invoice = null;
        if (totalCost > 0) {
            invoice = await Invoice.create({
                patient_id: prescription.Appointment ? prescription.Appointment.patient_id : null,
                appointment_id: prescription.appointment_id,
                amount: totalCost,
                status: 'unpaid',
                issued_by: req.user.id,
                payment_method: payment_method || 'cash'
            });
        }

        await prescription.update({ status: 'dispensed' });

        res.json({
            message: 'Prescription dispensed successfully and invoice generated',
            prescription,
            totalCost,
            invoice
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getPatientById = async (req, res) => {
    try {
        const { id } = req.params;

        const patient = await Patient.findByPk(id, {
            include: [
                { model: User, attributes: ['username', 'email'] },
                {
                    model: Appointment,
                    include: [Prescription], // Showing history of prescriptions
                    order: [['date', 'DESC']]
                }
            ]
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

exports.getDashboardStats = async (req, res) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // 1. Prescriptions to Fill
        const prescriptionsToFill = await Prescription.count({
            where: { status: 'pending' }
        });

        // 2. Urgent (Placeholder)
        const urgentPrescriptions = 0;

        // 3. Low Stock Items
        const lowStockItems = await Inventory.count({
            where: {
                stock: { [Op.lt]: sequelize.col('min_stock') }
            }
        });

        // 4. Total Inventory (Items in stock)
        const totalInventory = await Inventory.sum('stock') || 0;

        // 5. Dispensed Today
        const dispensedToday = await Prescription.count({
            where: {
                status: 'dispensed',
                updatedAt: {
                    [Op.between]: [todayStart, todayEnd]
                }
            }
        });

        // 6. Recent Prescriptions
        const recentPrescriptions = await Prescription.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            include: [{
                model: Appointment,
                include: [{
                    model: Patient,
                    include: [{ model: User, attributes: ['username', 'email'] }]
                },
                {
                    model: Doctor,
                    include: [{ model: User, attributes: ['username', 'email'] }]
                }]
            }]
        });

        res.json({
            prescriptionsToFill,
            urgentPrescriptions,
            lowStockItems,
            totalInventory,
            dispensedToday,
            recentPrescriptions
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
