/**
 * Report routes
 * Mounts all report-related endpoints under /api/reports (set in server.js).
 */
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');

// IMPORTANT: /nearby must be declared before /:id so Express does not
// interpret the literal string "nearby" as a dynamic :id segment.

// POST   /api/reports            → create a new report
router.post('/', reportController.createReport);

// GET    /api/reports            → list reports (paginated)
router.get('/', reportController.getReports);

// GET    /api/reports/nearby     → geospatial nearby search
router.get('/nearby', reportController.getNearbyReports);

// GET    /api/reports/:id        → single report by ID
router.get('/:id', reportController.getReportById);

module.exports = router;
