const express = require('express');
const router = express.Router();
const pharmacyController = require('../controllers/pharmacyController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(checkRole(['pharmacist', 'admin']));

router.get('/stats', pharmacyController.getDashboardStats);
router.get('/inventory', pharmacyController.getInventory);
router.post('/inventory', pharmacyController.addInventory);
router.get('/inventory/stats', pharmacyController.getInventoryStats);
router.put('/inventory/:id', pharmacyController.updateInventory);
router.delete('/inventory/:id', pharmacyController.deleteInventory);

router.get('/prescriptions', pharmacyController.getPrescriptions);
router.post('/prescriptions/:id/dispense', pharmacyController.dispensePrescription);

router.get('/patients/:id', pharmacyController.getPatientById);
router.get('/doctors/:id', pharmacyController.getDoctorById);

module.exports = router;
