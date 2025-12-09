const express = require('express');
const router = express.Router();
const labController = require('../controllers/labController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(checkRole(['lab_tech', 'admin']));

router.get('/requests', labController.getTestRequests);
router.post('/results/:id', labController.addTestResult);

module.exports = router;
