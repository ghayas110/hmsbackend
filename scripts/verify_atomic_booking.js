const { sequelize, User, Doctor, Patient, Appointment } = require('../src/models');
const patientController = require('../src/controllers/patientController');

// Mock Req/Res
const mockReq = (body, user) => ({ body, user });
const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

async function verifyAtomicBooking() {
    try {
        console.log('Syncing...');
        await sequelize.sync({ force: true });

        // Setup Data
        const docUser = await User.create({ username: 'dr_atomic', email: 'atomic@test.com', password_hash: 'hash', role: 'doctor' });
        const doctor = await Doctor.create({ user_id: docUser.id, specialization: 'General', consultation_fee: 1000 });

        const patUser = await User.create({ username: 'pat_atomic', email: 'pat@test.com', password_hash: 'hash', role: 'patient' });
        const patient = await Patient.create({ user_id: patUser.id, name: 'Pat Atomic', cnic: '99999-9999999-9' });

        const bookingData = {
            doctor_id: doctor.id,
            date: '2025-09-01',
            time: '10:00:00',
            notes: 'First booking'
        };

        console.log('Attempting First Booking...');
        const req1 = mockReq(bookingData, { id: patUser.id });
        const res1 = mockRes();
        await patientController.createAppointment(req1, res1);
        console.log('Response 1:', res1.statusCode, res1.data);

        console.log('Attempting Second Booking (Same Slot)...');
        const req2 = mockReq(bookingData, { id: patUser.id }); // Same patient or different, shouldn't matter for double booking logic
        const res2 = mockRes();
        await patientController.createAppointment(req2, res2);
        console.log('Response 2:', res2.statusCode, res2.data);

        if (res1.statusCode === 201 && res2.statusCode === 400 && res2.data.message === 'Time slot is not available') {
            console.log('SUCCESS: Atomic booking verified.');
        } else {
            console.error('FAILURE: Double booking check failed.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

verifyAtomicBooking();
