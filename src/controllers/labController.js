const { LabTest, Patient, Doctor, User, TestCategory, TestDefinition, Prescription, Appointment } = require('../models');
const { Op } = require('sequelize');

exports.getTestRequests = async (req, res) => {
    try {
        // 1. Sync: Find Prescriptions with test_orders that haven't been converted yet
        // Ideally we would flag prescriptions as "lab_synced" but checking existence is safer for now
        const prescriptions = await Prescription.findAll({
            where: {
                test_orders: { [Op.ne]: null }, // Has orders
                // We might want to filter by date or status if needed
            },
            include: [
                {
                    model: Appointment,
                    include: [Patient, Doctor]
                }
            ]
        });

        for (const p of prescriptions) {
            if (p.test_orders && Array.isArray(p.test_orders)) {
                for (const testName of p.test_orders) {
                    // Check if already exists
                    const exists = await LabTest.findOne({
                        where: {
                            prescription_id: p.id,
                            test_type: testName
                        }
                    });

                    if (!exists && p.Appointment) {
                        await LabTest.create({
                            patient_id: p.Appointment.patient_id,
                            doctor_id: p.Appointment.doctor_id,
                            prescription_id: p.id,
                            test_type: testName,
                            status: 'pending',
                            result: null
                        });
                    }
                }
            }
        }

        // 2. Fetch all Pending Lab Requests (now including the newly synced ones)
        const requests = await LabTest.findAll({
            where: { status: 'pending' },
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
            order: [['createdAt', 'DESC']]
        });
        res.json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.addTestResult = async (req, res) => {
    try {
        const { id } = req.params; // LabTest ID
        const { result, readings } = req.body; // result is summary text, readings is { "WBC": 12.5 }

        const labTest = await LabTest.findByPk(id);
        if (!labTest) {
            return res.status(404).json({ message: 'Lab test request not found' });
        }

        // Find Definition to get Normal Values
        const definition = await TestDefinition.findOne({
            where: { name: labTest.test_type }
        });

        let evaluatedReadings = [];
        if (definition && definition.parameters && readings) {
            // Evaluate
            definition.parameters.forEach(param => {
                const value = readings[param.name];
                if (value !== undefined) {
                    let status = 'Normal';
                    if (param.type === 'number') {
                        const valNum = parseFloat(value);
                        if (valNum < param.normal_range_min) status = 'Low';
                        if (valNum > param.normal_range_max) status = 'High';
                    }

                    evaluatedReadings.push({
                        name: param.name,
                        value: value,
                        unit: param.unit,
                        status: status,
                        normal_range: `${param.normal_range_min} - ${param.normal_range_max}`
                    });
                }
            });
        }

        // Store structured result
        const finalResult = {
            summary: result,
            readings: evaluatedReadings
        };

        await labTest.update({
            result: finalResult,
            status: 'completed',
        });

        res.json({ message: 'Test result added successfully', labTest });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getTestResults = async (req, res) => {
    try {
        const results = await LabTest.findAll({
            where: { status: 'completed' },
            include: [
                {
                    model: Patient,
                    include: [{ model: User, attributes: ['username'] }]
                },
                {
                    model: Doctor,
                    include: [{ model: User, attributes: ['username'] }]
                }
            ],
            order: [['updatedAt', 'DESC']]
        });
        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getTestResultById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await LabTest.findOne({
            where: { id },
            include: [
                {
                    model: Patient,
                    include: [{ model: User, attributes: ['username', 'email'] }]
                },
                {
                    model: Doctor,
                    include: [{ model: User, attributes: ['username', 'email'] }]
                }
            ]
        });

        if (!result) return res.status(404).json({ message: 'Test result not found' });

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.addTestCategory = async (req, res) => {
    try {
        const { name, code, description, status, lab_type } = req.body;
        // doctor_id is optional now
        const category = await TestCategory.create({
            name,
            code,
            description,
            status,
            lab_type,
            // doctor_id can be left null if created by lab tech
        });
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getTestCategories = async (req, res) => {
    try {
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
        const { id } = req.params;
        const { name, code, description, status, lab_type } = req.body;

        const category = await TestCategory.findByPk(id);

        if (!category) return res.status(404).json({ message: 'Test Category not found' });

        await category.update({ name, code, description, status, lab_type });
        res.json({ message: 'Test Category updated successfully', category });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.deleteTestCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await TestCategory.findByPk(id);

        if (!category) return res.status(404).json({ message: 'Test Category not found' });

        await category.destroy();
        res.json({ message: 'Test Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.addTestDefinition = async (req, res) => {
    try {
        const { category_id, name, parameters } = req.body;
        const test = await TestDefinition.create({
            category_id,
            name,
            parameters // Array of { name, unit, normal_range_min, normal_range_max, type }
        });
        res.status(201).json(test);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getTestDefinitions = async (req, res) => {
    try {
        const { category_id } = req.query;
        let whereClause = {};
        if (category_id) {
            whereClause.category_id = category_id;
        }

        const tests = await TestDefinition.findAll({ where: whereClause, include: [TestCategory] });
        res.json(tests);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateTestDefinition = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, parameters, category_id } = req.body;

        console.log(`[LabController] Updating TestDefinition ${id}:`, req.body);

        const test = await TestDefinition.findByPk(id);
        if (!test) return res.status(404).json({ message: 'Test Definition not found' });

        const updates = {};
        if (name !== undefined) updates.name = name;

        if (parameters !== undefined) {
            let parsedParams = parameters;
            if (typeof parameters === 'string') {
                try {
                    parsedParams = JSON.parse(parameters);
                } catch (e) {
                    return res.status(400).json({ message: 'Invalid JSON for parameters' });
                }
            }
            updates.parameters = parsedParams;
        }

        if (category_id !== undefined) {
            if (category_id === null) {
                return res.status(400).json({ message: 'Category ID cannot be null' });
            }
            const category = await TestCategory.findByPk(category_id);
            if (!category) {
                return res.status(400).json({ message: 'Invalid Category ID' });
            }
            updates.category_id = category_id;
        }

        await test.update(updates);
        res.json({ message: 'Test Definition updated successfully', test });
    } catch (error) {
        console.error('Update Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.deleteTestDefinition = async (req, res) => {
    try {
        const { id } = req.params;

        const test = await TestDefinition.findByPk(id);
        if (!test) return res.status(404).json({ message: 'Test Definition not found' });

        await test.destroy();
        res.json({ message: 'Test Definition deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


