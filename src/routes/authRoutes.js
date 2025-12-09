const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/doctors', authController.getAllDoctors);
router.get('/doctors/:id', authController.getDoctorById);
router.get('/patients', authController.getAllPatients);
router.get('/patients/:id', authController.getPatientById);

// Patient Search (accessible by authorized staff/public depending on requirements)
// Importing patientController for this specific method
const patientController = require('../controllers/patientController');
router.get('/patient-search/cnic', patientController.searchByCNIC);

module.exports = router;
