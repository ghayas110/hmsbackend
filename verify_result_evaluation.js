const { sequelize, TestCategory, TestDefinition, LabTest, Patient, Doctor, User } = require('./src/models');
const { addTestResult } = require('./src/controllers/labController');

async function verifyEvaluation() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Create backup or just clear result column if it's test environment
        console.log('Clearing old non-JSON results to allow migration...');
        await sequelize.query('UPDATE LabTests SET result = NULL;');

        console.log('Syncing models...');
        try {
            // Force change if needed
            // await sequelize.query('ALTER TABLE LabTests MODIFY result JSON NULL;');
        } catch (e) { e; }
        await sequelize.sync({ alter: true });

        // 1. Setup Data
        const category = await TestCategory.create({ name: 'Eval Cat' });
        const definition = await TestDefinition.create({
            category_id: category.id,
            name: 'Eval Test',
            parameters: [
                { name: 'Param1', unit: 'mg', normal_range_min: 10, normal_range_max: 20, type: 'number' }
            ]
        });

        // Mock dependencies
        const user = await User.create({ username: 'e_p', email: 'e_p@a.com', password_hash: 'x', role: 'patient' });
        const patient = await Patient.create({ user_id: user.id, full_name: 'Eval P', dob: '2000-01-01', gender: 'm', contact_number: '1' });
        const dUser = await User.create({ username: 'e_d', email: 'e_d@a.com', password_hash: 'x', role: 'doctor' });
        const doctor = await Doctor.create({ user_id: dUser.id, specialization: 'X', consultation_fee: 1, contact_number: '1' });

        const labTest = await LabTest.create({
            patient_id: patient.id,
            doctor_id: doctor.id,
            test_type: 'Eval Test',
            status: 'pending'
        });

        // 2. Call addTestResult with HIGH value
        console.log('Adding result with HIGH value (25 > 20)...');
        const req = {
            params: { id: labTest.id },
            body: {
                result: 'Overall good',
                readings: { 'Param1': 25 }
            }
        };

        let responseJson = null;
        const res = {
            json: (d) => { responseJson = d; },
            status: (c) => ({ json: (d) => console.log('Err:', d) })
        };

        await addTestResult(req, res);

        // 3. Verify
        if (responseJson && responseJson.labTest) {
            const result = responseJson.labTest.result;
            console.log('Result Stored:', JSON.stringify(result, null, 2));

            if (result.readings && result.readings[0].status === 'High') {
                console.log('SUCCESS: Value 25 evaluated as HIGH.');
            } else {
                console.error('FAILURE: Evaluation logic incorrect.');
            }
        } else {
            console.error('FAILURE: Controller returned no data.');
        }

        // Cleanup
        await labTest.destroy();
        await definition.destroy();
        await category.destroy();
        await patient.destroy();
        await doctor.destroy();
        await user.destroy();
        await dUser.destroy();

    } catch (error) {
        console.error('Verify failed:', error);
    } finally {
        await sequelize.close();
    }
}

verifyEvaluation();
