const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(checkRole(['cashier', 'admin'])); // Allow admin too

router.post('/create-invoice', billingController.createInvoice);
router.get('/invoices', billingController.getInvoices);
router.get('/invoices/:id', billingController.getInvoiceById);
router.post('/process-payment/:id', billingController.processPayment);
router.get('/appointments', billingController.getAppointments);
router.get('/appointments/:id', billingController.getAppointmentById);

module.exports = router;
