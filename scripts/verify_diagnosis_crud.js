const { sequelize, User, Doctor, SavedDiagnosis } = require('../src/models');

async function verifyDiagnosisCRUD() {
    try {
        console.log('Syncing...');
        await sequelize.sync();

        // Create generic doctor for testing
        const email = `dr_diag_${Date.now()}@test.com`;
        const user = await User.create({
            username: `dr_diag_${Date.now()}`,
            email: email,
            password_hash: 'hash',
            role: 'doctor'
        });
        const doctor = await Doctor.create({
            user_id: user.id,
            specialization: 'General',
            consultation_fee: 1000
        });

        console.log('1. Creating Diagnosis...');
        const diagnosis = await SavedDiagnosis.create({
            doctor_id: doctor.id,
            name: 'Initial Diagnosis'
        });
        console.log('Created:', diagnosis.toJSON());

        console.log('2. Updating Diagnosis...');
        await diagnosis.update({ name: 'Updated Diagnosis' });
        await diagnosis.reload();
        console.log('Updated:', diagnosis.toJSON());

        if (diagnosis.name === 'Updated Diagnosis') {
            console.log('SUCCESS: Update confirmed.');
        } else {
            console.error('FAILURE: Update failed.');
        }

        console.log('3. Deleting Diagnosis...');
        await diagnosis.destroy();

        const check = await SavedDiagnosis.findByPk(diagnosis.id);
        if (!check) {
            console.log('SUCCESS: Delete confirmed.');
        } else {
            console.error('FAILURE: Delete failed.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

verifyDiagnosisCRUD();
