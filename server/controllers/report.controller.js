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
    const reportData = {
      title,
      description,
      category,
      location,
      images: images || [],
      status: status || 'active'
    };

    if (req.user && (req.user.id || req.user._id)) {
      reportData.createdBy = req.user.id || req.user._id;
    }

    const report = new Report(reportData);

    const saved = await report.save();

    return res.status(201).json({
      status: 'success',
      data: saved
    });
  } catch (err) {
    console.error('Error creating report:', err);
    // Mongoose validation errors → 400
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        status: 'error',
        message: err.message
      });
    }
    return res.status(500).json({
      status: 'error',
      message: err.message || 'Failed to create report'
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

// ---------------------------------------------------------------------------
// POST /api/reports/:id/confirm
// Confirm an existing report.
// Rules:
// - Cannot confirm own report (403)
// - Cannot confirm more than once (409)
// - Cannot both confirm and dispute (409)
// - Concurrency-safe atomic update
// - Recalculates confidenceScore: (confirmations / (confirmations + disputes)) * 100
// ---------------------------------------------------------------------------
const confirmReport = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      status: 'error',
      message: `"${id}" is not a valid report ID`
    });
  }

  const userId = req.user?.id || req.user?._id;
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(401).json({
      status: 'error',
      message: 'Access denied. Authentication token required.'
    });
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const reportObjectId = new mongoose.Types.ObjectId(id);

  try {
    const existing = await Report.findById(reportObjectId);
    if (!existing) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }

    // Rule 1: A user cannot confirm their own report
    if (existing.createdBy && existing.createdBy.toString() === userId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You cannot confirm your own report'
      });
    }

    // Rule 2: A user cannot confirm the same report more than once
    if (existing.confirmations && existing.confirmations.some(uid => uid.toString() === userId.toString())) {
      return res.status(409).json({
        status: 'error',
        message: 'You have already confirmed this report'
      });
    }

    // Rule 3: A user cannot both confirm and dispute the same report
    if (existing.disputes && existing.disputes.some(uid => uid.toString() === userId.toString())) {
      return res.status(409).json({
        status: 'error',
        message: 'You have already disputed this report and cannot confirm it'
      });
    }

    // Atomic update preventing concurrent race conditions
    const updated = await Report.findOneAndUpdate(
      {
        _id: reportObjectId,
        createdBy: { $ne: userObjectId },
        confirmations: { $ne: userObjectId },
        disputes: { $ne: userObjectId }
      },
      [
        {
          $set: {
            confirmations: {
              $concatArrays: [
                { $ifNull: ['$confirmations', []] },
                [userObjectId]
              ]
            }
          }
        },
        {
          $set: {
            confidenceScore: {
              $let: {
                vars: {
                  cCount: { $size: { $ifNull: ['$confirmations', []] } },
                  dCount: { $size: { $ifNull: ['$disputes', []] } }
                },
                in: {
                  $cond: [
                    { $eq: [{ $add: ['$$cCount', '$$dCount'] }, 0] },
                    0,
                    {
                      $multiply: [
                        { $divide: ['$$cCount', { $add: ['$$cCount', '$$dCount'] }] },
                        100
                      ]
                    }
                  ]
                }
              }
            }
          }
        }
      ],
      { returnDocument: 'after', updatePipeline: true }
    );

    if (!updated) {
      // If atomic query didn't match, inspect current state to return accurate HTTP code
      const current = await Report.findById(reportObjectId);
      if (!current) {
        return res.status(404).json({ status: 'error', message: 'Report not found' });
      }
      if (current.createdBy && current.createdBy.toString() === userId.toString()) {
        return res.status(403).json({ status: 'error', message: 'You cannot confirm your own report' });
      }
      if (current.confirmations && current.confirmations.some(uid => uid.toString() === userId.toString())) {
        return res.status(409).json({ status: 'error', message: 'You have already confirmed this report' });
      }
      if (current.disputes && current.disputes.some(uid => uid.toString() === userId.toString())) {
        return res.status(409).json({ status: 'error', message: 'You have already disputed this report and cannot confirm it' });
      }
      return res.status(409).json({ status: 'error', message: 'Conflicting vote detected' });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Report confirmed successfully',
      data: updated
    });
  } catch (err) {
    console.error('Error confirming report:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to confirm report'
    });
  }
};

// ---------------------------------------------------------------------------
// POST /api/reports/:id/dispute
// Dispute an existing report.
// Rules:
// - Cannot dispute own report (403)
// - Cannot dispute more than once (409)
// - Cannot both confirm and dispute (409)
// - Concurrency-safe atomic update
// - Recalculates confidenceScore: (confirmations / (confirmations + disputes)) * 100
// ---------------------------------------------------------------------------
const disputeReport = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      status: 'error',
      message: `"${id}" is not a valid report ID`
    });
  }

  const userId = req.user?.id || req.user?._id;
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(401).json({
      status: 'error',
      message: 'Access denied. Authentication token required.'
    });
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const reportObjectId = new mongoose.Types.ObjectId(id);

  try {
    const existing = await Report.findById(reportObjectId);
    if (!existing) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }

    // Rule 1: A user cannot dispute their own report
    if (existing.createdBy && existing.createdBy.toString() === userId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You cannot dispute your own report'
      });
    }

    // Rule 2: A user cannot dispute the same report more than once
    if (existing.disputes && existing.disputes.some(uid => uid.toString() === userId.toString())) {
      return res.status(409).json({
        status: 'error',
        message: 'You have already disputed this report'
      });
    }

    // Rule 3: A user cannot both confirm and dispute the same report
    if (existing.confirmations && existing.confirmations.some(uid => uid.toString() === userId.toString())) {
      return res.status(409).json({
        status: 'error',
        message: 'You have already confirmed this report and cannot dispute it'
      });
    }

    // Atomic update preventing concurrent race conditions
    const updated = await Report.findOneAndUpdate(
      {
        _id: reportObjectId,
        createdBy: { $ne: userObjectId },
        confirmations: { $ne: userObjectId },
        disputes: { $ne: userObjectId }
      },
      [
        {
          $set: {
            disputes: {
              $concatArrays: [
                { $ifNull: ['$disputes', []] },
                [userObjectId]
              ]
            }
          }
        },
        {
          $set: {
            confidenceScore: {
              $let: {
                vars: {
                  cCount: { $size: { $ifNull: ['$confirmations', []] } },
                  dCount: { $size: { $ifNull: ['$disputes', []] } }
                },
                in: {
                  $cond: [
                    { $eq: [{ $add: ['$$cCount', '$$dCount'] }, 0] },
                    0,
                    {
                      $multiply: [
                        { $divide: ['$$cCount', { $add: ['$$cCount', '$$dCount'] }] },
                        100
                      ]
                    }
                  ]
                }
              }
            }
          }
        }
      ],
      { returnDocument: 'after', updatePipeline: true }
    );

    if (!updated) {
      // If atomic query didn't match, inspect current state to return accurate HTTP code
      const current = await Report.findById(reportObjectId);
      if (!current) {
        return res.status(404).json({ status: 'error', message: 'Report not found' });
      }
      if (current.createdBy && current.createdBy.toString() === userId.toString()) {
        return res.status(403).json({ status: 'error', message: 'You cannot dispute your own report' });
      }
      if (current.disputes && current.disputes.some(uid => uid.toString() === userId.toString())) {
        return res.status(409).json({ status: 'error', message: 'You have already disputed this report' });
      }
      if (current.confirmations && current.confirmations.some(uid => uid.toString() === userId.toString())) {
        return res.status(409).json({ status: 'error', message: 'You have already confirmed this report and cannot dispute it' });
      }
      return res.status(409).json({ status: 'error', message: 'Conflicting vote detected' });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Report disputed successfully',
      data: updated
    });
  } catch (err) {
    console.error('Error disputing report:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to dispute report'
    });
  }
};

module.exports = {
  createReport,
  confirmReport,
  disputeReport,
  getReports,
  getNearbyReports,
  getReportById
};
