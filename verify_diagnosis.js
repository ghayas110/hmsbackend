const { SavedDiagnosis, User, Doctor, sequelize } = require('./src/models');

async function verifyDiagnosis() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const doctorUser = await User.findOne({ where: { email: 'doctor@hms.com' } });
        if (!doctorUser) {
            console.log('User doctor@hms.com not found.');
            return;
        }

        const doctor = await Doctor.findOne({ where: { user_id: doctorUser.id } });
        if (!doctor) {
            console.log('Doctor profile not found for user.');
            return;
        }

        const diagnoses = await SavedDiagnosis.findAll({ where: { doctor_id: doctor.id } });
        console.log(`Diagnoses found for doctor@hms.com (ID: ${doctor.id}): ${diagnoses.length}`);

        diagnoses.forEach(d => console.log(`- ${d.name}`));

    } catch (error) {
        console.error('Error verifying diagnoses:', error);
    } finally {
        await sequelize.close();
    }
}

verifyDiagnosis();
