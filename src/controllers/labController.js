const { LabTest, Patient, Doctor, User } = require('../models');

exports.getTestRequests = async (req, res) => {
    try {
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
        const { result } = req.body;

        const labTest = await LabTest.findByPk(id);
        if (!labTest) {
            return res.status(404).json({ message: 'Lab test request not found' });
        }

        await labTest.update({
            result,
            status: 'completed',
        });

        res.json({ message: 'Test result added successfully', labTest });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
