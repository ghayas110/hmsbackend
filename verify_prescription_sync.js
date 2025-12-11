const { sequelize, User, Patient, Doctor, Appointment, Prescription, LabTest } = require('./src/models');
const { getTestRequests } = require('./src/controllers/labController');

async function verifySync() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Sync to apply model changes (add prescription_id)
        console.log('Syncing models...');
        try {
            // Manual ALTER if needed for safety, but sync alter should handle it
            await sequelize.query('ALTER TABLE LabTests ADD COLUMN prescription_id INTEGER NULL;');
        } catch (e) {
            console.log('Column might already exist:', e.message);
        }
        await sequelize.sync({ alter: true });
        console.log('Models synced.');

        // 1. Create Data
        console.log('Creating Test Data...');
        const user = await User.create({ username: 'test_p_sync', email: 'test_p_sync@example.com', password_hash: 'hash', role: 'patient' });
        const patient = await Patient.create({ user_id: user.id, full_name: 'Test Patient Sync', dob: '1990-01-01', gender: 'male', contact_number: '123' });

        const docUser = await User.create({ username: 'test_d_sync', email: 'test_d_sync@example.com', password_hash: 'hash', role: 'doctor' });
        const doctor = await Doctor.create({ user_id: docUser.id, specialization: 'General', consultation_fee: 100, contact_number: '123' });

        const appointment = await Appointment.create({
            patient_id: patient.id,
            doctor_id: doctor.id,
            date: '2025-01-01',
            time: '10:00',
            status: 'confirmed'
        });

        // 2. Create Prescription with Orders
        const pres = await Prescription.create({
            appointment_id: appointment.id,
            complaints: 'Fever',
            test_orders: ['CBC', 'X-Ray Chest'] // JSON array
        });
        console.log('Prescription Created:', pres.id, 'Orders:', pres.test_orders);

        // 3. Run Controller Logic (Sync)
        console.log('Running getTestRequests (Sync)...');
        let responseData = null;
        const req = {};
        const res = {
            json: (data) => { responseData = data; },
            status: (code) => ({ json: (data) => console.log('Error:', data) })
        };

        await getTestRequests(req, res);

        // 4. Verify LabTests
        console.log('Verifying Lab Tests...');
        if (responseData) {
            const createdTests = responseData.filter(t => t.prescription_id === pres.id);
            console.log(`Found ${createdTests.length} tests for this prescription.`);

            const types = createdTests.map(t => t.test_type);
            console.log('Test Types:', types);

            if (types.includes('CBC') && types.includes('X-Ray Chest')) {
                console.log('SUCCESS: Tests synced correctly.');
            } else {
                console.error('FAILURE: Missing tests.');
            }
        } else {
            console.error('FAILURE: No response from controller.');
        }

        // Cleanup
        console.log('Cleaning up...');
        await pres.destroy();
        await appointment.destroy();
        await patient.destroy();
        await doctor.destroy();
        await user.destroy();
        await docUser.destroy();
        // LabTests cascade delete? usually not, let's delete manually
        await LabTest.destroy({ where: { prescription_id: pres.id } });

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await sequelize.close();
    }
}

verifySync();
