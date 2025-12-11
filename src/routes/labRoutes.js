const express = require('express');
const router = express.Router();
const labController = require('../controllers/labController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(checkRole(['lab_tech', 'admin']));

router.get('/requests', labController.getTestRequests);
router.get('/results', labController.getTestResults);
router.get('/results/:id', labController.getTestResultById);
router.post('/results/:id', labController.addTestResult);

// Test Management
router.post('/test-category', labController.addTestCategory);
router.get('/test-category', labController.getTestCategories);
router.put('/test-category/:id', labController.updateTestCategory);
router.delete('/test-category/:id', labController.deleteTestCategory);
// Test Management Middleware Logger
router.use('/test-definition', (req, res, next) => {
    console.log(`[LabRoute] ${req.method} ${req.originalUrl}`);
    next();
});

router.post('/test-definition', labController.addTestDefinition);
router.get('/test-definition', labController.getTestDefinitions);
router.put('/test-definition/:id', labController.updateTestDefinition);
router.delete('/test-definition/:id', labController.deleteTestDefinition);


module.exports = router;
