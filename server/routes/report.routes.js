const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/', protect, reportController.createReport);
router.post('/:id/confirm', protect, reportController.confirmReport);
router.post('/:id/dispute', protect, reportController.disputeReport);

router.get('/', reportController.getReports);
router.get('/nearby', reportController.getNearbyReports);
router.get('/:id', reportController.getReportById);

module.exports = router;