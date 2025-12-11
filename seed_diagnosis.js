const { User, Doctor, SavedDiagnosis, sequelize } = require('./src/models');
const bcrypt = require('bcryptjs');

const demoDoctor = {
    username: 'Demo Doctor',
    email: 'doctor@hms.com',
    password: '123456', // Will be hashed
    role: 'doctor',
    specialization: 'General Physician',
    consultation_fee: 50.00,
    shift_start: '09:00:00',
    shift_end: '17:00:00'
};

const commonDiagnoses = [
    'Viral Fever',
    'Hypertension',
    'Type 2 Diabetes Mellitus',
    'Acute Bronchitis',
    'Migraine',
    'Gastroenteritis',
    'Urinary Tract Infection',
    'Allergic Rhinitis',
    'Anemia',
    'Hypothyroidism',
    'Asthma',
    'Dermatitis',
    'Osteoarthritis',
    'Pneumonia',
    'Conjunctivitis'
];

async function seedDiagnosis() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // 1. Find or Create User
        let user = await User.findOne({ where: { email: demoDoctor.email } });
        if (!user) {
            console.log('User doctor@hms.com not found. Creating...');
            const hashedPassword = await bcrypt.hash(demoDoctor.password, 10);
            user = await User.create({
                username: demoDoctor.username,
                email: demoDoctor.email,
                password_hash: hashedPassword,
                role: demoDoctor.role
            });
            console.log(`User created with ID: ${user.id}`);
        } else {
            console.log(`User doctor@hms.com exists (ID: ${user.id}).`);
        }

        // 2. Find or Create Doctor Profile
        let doctor = await Doctor.findOne({ where: { user_id: user.id } });
        if (!doctor) {
            console.log('Doctor profile not found. Creating...');
            doctor = await Doctor.create({
                user_id: user.id,
                specialization: demoDoctor.specialization,
                consultation_fee: demoDoctor.consultation_fee,
                shift_start: demoDoctor.shift_start,
                shift_end: demoDoctor.shift_end
            });
            console.log(`Doctor profile created with ID: ${doctor.id}`);
        } else {
            console.log(`Doctor profile exists (ID: ${doctor.id}).`);
        }

        // 3. Populate Diagnoses
        console.log('Seeding diagnoses...');
        for (const name of commonDiagnoses) {
            const [diagnosis, created] = await SavedDiagnosis.findOrCreate({
                where: { doctor_id: doctor.id, name: name },
                defaults: {
                    doctor_id: doctor.id,
                    name: name
                }
            });

            if (created) {
                console.log(`  - Added: ${name}`);
            } else {
                console.log(`  - Exists: ${name}`);
            }
        }

        console.log('Seeding complete.');

    } catch (error) {
        console.error('Error seeding diagnoses:', error);
    } finally {
        await sequelize.close();
    }
}

seedDiagnosis();
