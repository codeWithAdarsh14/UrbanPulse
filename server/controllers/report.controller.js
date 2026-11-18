/**
 * Report controller
 * Handles CRUD and geospatial operations for Report documents.
 */
const mongoose = require('mongoose');
const Report = require('../models/Report');

// ---------------------------------------------------------------------------
// POST /api/reports
// Create and save a new report.
// ---------------------------------------------------------------------------
const createReport = async (req, res) => {
  const { title, description, category, location, images, status } = req.body;

  // Required field validation
  if (!title || !description || !category || !location) {
    return res.status(400).json({
      status: 'error',
      message: 'title, description, category, and location are required'
    });
  }

  // Basic location shape validation before hitting Mongoose
  if (
    location.type !== 'Point' ||
    !Array.isArray(location.coordinates) ||
    location.coordinates.length !== 2
  ) {
    return res.status(400).json({
      status: 'error',
      message: 'location must be a GeoJSON Point with coordinates [longitude, latitude]'
    });
  }

  try {
    const report = new Report({
      title,
      description,
      category,
      location,
      images: images || [],
      status: status || 'active'
    });

    const saved = await report.save();

    return res.status(201).json({
      status: 'success',
      data: saved
    });
  } catch (err) {
    // Mongoose validation errors → 400
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        status: 'error',
        message: err.message
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create report'
    });
  }
};

// ---------------------------------------------------------------------------
// GET /api/reports
// Retrieve all reports with pagination.
// Query params: page (default 1), limit (default 20)
// ---------------------------------------------------------------------------
const getReports = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  try {
    const [reports, total] = await Promise.all([
      Report.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Report.countDocuments()
    ]);

    return res.status(200).json({
      status: 'success',
      data: reports,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve reports'
    });
  }
};

// ---------------------------------------------------------------------------
// GET /api/reports/nearby
// Find reports within a radius using $near + GeoJSON.
// Query params: longitude (required), latitude (required), radius (metres, default 5000)
// ---------------------------------------------------------------------------
const getNearbyReports = async (req, res) => {
  const lng = parseFloat(req.query.longitude);
  const lat = parseFloat(req.query.latitude);
  const radius = Math.max(1, parseInt(req.query.radius) || 5000);

  if (isNaN(lng) || isNaN(lat)) {
    return res.status(400).json({
      status: 'error',
      message: 'longitude and latitude are required numeric query parameters'
    });
  }

  if (lng < -180 || lng > 180) {
    return res.status(400).json({
      status: 'error',
      message: 'longitude must be between -180 and 180'
    });
  }

  if (lat < -90 || lat > 90) {
    return res.status(400).json({
      status: 'error',
      message: 'latitude must be between -90 and 90'
    });
  }

  try {
    const reports = await Report.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radius
        }
      }
    });

    return res.status(200).json({
      status: 'success',
      data: reports,
      meta: {
        longitude: lng,
        latitude: lat,
        radiusMetres: radius,
        count: reports.length
      }
    });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve nearby reports'
    });
  }
};

// ---------------------------------------------------------------------------
// GET /api/reports/:id
// Retrieve a single report by its MongoDB ObjectId.
// ---------------------------------------------------------------------------
const getReportById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      status: 'error',
      message: `"${id}" is not a valid report ID`
    });
  }

  try {
    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }

    return res.status(200).json({
      status: 'success',
      data: report
    });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve report'
    });
  }
};

module.exports = {
  createReport,
  getReports,
  getNearbyReports,
  getReportById
};
