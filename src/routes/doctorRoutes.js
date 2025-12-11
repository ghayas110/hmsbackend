const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(checkRole(['doctor']));

router.get('/appointments', doctorController.getAppointments);
router.get('/patients/:id', doctorController.getPatientRecords);
router.post('/prescriptions', doctorController.createPrescription);

router.put('/appointments/:id', doctorController.updateAppointment);
router.delete('/appointments/:id', doctorController.deleteAppointment);
router.put('/prescriptions/:id', doctorController.updatePrescription);
router.delete('/prescriptions/:id', doctorController.deletePrescription);

// Clinical Management
router.get('/slots', doctorController.getDoctorSlots);

router.post('/diagnosis', doctorController.addDiagnosis);
router.get('/diagnosis', doctorController.getDiagnoses);
router.delete('/diagnosis/:id', doctorController.deleteDiagnosis);
router.put('/diagnosis/:id', doctorController.updateDiagnosis);

router.post('/medicine-group', doctorController.addMedicineGroup);
router.get('/medicine-group', doctorController.getMedicineGroups);
router.get('/medicine-group/:id', doctorController.getMedicineGroupById);
router.put('/medicine-group/:id', doctorController.updateMedicineGroup);

router.post('/test-category', doctorController.addTestCategory);
router.get('/test-category', doctorController.getTestCategories);
router.put('/test-category/:id', doctorController.updateTestCategory);
router.delete('/test-category/:id', doctorController.deleteTestCategory);
router.post('/test-definition', doctorController.addTestDefinition);
router.get('/inventory', doctorController.getInventory);

module.exports = router;
