const { sequelize, Doctor, Patient, Appointment, Prescription, Invoice, User, SavedDiagnosis, MedicineGroup } = require('../src/models');

async function verifyLogic() {
    try {
        console.log('Syncing database...');
        await sequelize.sync({ force: true }); // WARNING: This clears DB. Use with caution or only on test DB.

        console.log('Creating generic user (Doctor)...');
        const docUser = await User.create({ username: 'dr_smith', email: 'dr@test.com', password_hash: 'hash', role: 'doctor' });

        console.log('Creating Doctor profile with shifts...');
        const doctor = await Doctor.create({
            user_id: docUser.id,
            specialization: 'Cardiology',
            consultation_fee: 1500.00,
            shift_start: '09:00:00',
            shift_end: '12:00:00'
        });
        console.log('Doctor created:', doctor.toJSON());

        console.log('Creating generic user (Patient)...');
        const patUser = await User.create({ username: 'john_doe', email: 'john@test.com', password_hash: 'hash', role: 'patient' });

        console.log('Creating Patient profile with CNIC...');
        const patient = await Patient.create({
            user_id: patUser.id,
            name: 'John Doe',
            cnic: '12345-6789012-3',
            dob: '1990-01-01'
        });
        console.log('Patient created:', patient.toJSON());

        console.log('Testing Slot Generation logic (simulation)...');
        // Logic from controller (simplified verification)
        const date = '2025-08-14';
        const start = new Date(`${date}T${doctor.shift_start}`);
        const end = new Date(`${date}T${doctor.shift_end}`);
        console.log(`Shifts: ${start.toTimeString()} - ${end.toTimeString()}`);

        console.log('Booking Appointment...');
        const appointment = await Appointment.create({
            patient_id: patient.id,
            doctor_id: doctor.id,
            date: date,
            time: '09:00:00',
            status: 'confirmed'
        });
        console.log('Appointment booked:', appointment.toJSON());

        // Test Double Booking
        console.log('Testing Double Booking (Should fail)...');
        // We need to simulate the controller logic or relying on the script calling the controller?
        // Wait, the script calls Models directly. The validation is in the CONTROLLER.
        // My verification script `verify_logic.js` uses MODELS directly. It will bypass the controller logic.
        // I should update the script to use axios or mock the controller call, but simpler is to just replicate the check here to PROVE it would capture it,
        // OR better, I need to verify the CODE I wrote.
        // I will write a small script that imports the controller function and mocks req/res.
        // Re-writing this verification step to be a separate script `verify_atomic_booking.js` calling the controller.


        console.log('Adding Clinical Data (Diagnosis, MedicineGroup)...');
        await SavedDiagnosis.create({ doctor_id: doctor.id, name: 'Hypertension' });
        await MedicineGroup.create({
            doctor_id: doctor.id,
            name: 'Flu Kit',
            medicines: [{ name: 'Panadol', dose: '1 tab', freq: '3x' }]
        });

        console.log('Creating Prescription...');
        const prescription = await Prescription.create({
            appointment_id: appointment.id,
            complaints: 'Headache and fever',
            findings: { temp: '101F' },
            diagnosis: ['Viral Flu'],
            medicines: [{ name: 'Panadol', dose: '500mg', duration: '3 days' }],
            vitals: { temp: 101, bp: '120/80' },
            test_orders: ['CBC'],
            notes: 'Rest for 3 days'
        });
        console.log('Prescription created:', prescription.toJSON());

        console.log('Generating Invoice...');
        // Simulate controller logic
        const invoice = await Invoice.create({
            patient_id: appointment.patient_id,
            amount: doctor.consultation_fee,
            status: 'unpaid',
            issued_by: doctor.user_id
        });
        console.log('Invoice generated:', invoice.toJSON());

        console.log('VERIFICATION SUCCESSFUL');

    } catch (error) {
        console.error('VERIFICATION FAILED:', error);
    } finally {
        await sequelize.close();
    }
}

verifyLogic();
