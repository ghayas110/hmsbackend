const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(checkRole(['patient']));

router.get('/profile', patientController.getProfile);
router.put('/profile', patientController.updateProfile);
router.get('/stats', patientController.getDashboardStats);
router.get('/appointments', patientController.getAppointments);
router.post('/appointments', patientController.createAppointment);
router.put('/appointments/:id/cancel', patientController.cancelAppointment);
router.get('/prescriptions', patientController.getPrescriptions);
router.get('/history', patientController.getHistory);

module.exports = router;
