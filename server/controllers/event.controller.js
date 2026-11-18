/**
 * Event controller
 * Handles CRUD and geospatial operations for Event documents.
 */
const mongoose = require('mongoose');
const Event = require('../models/Event');

// ---------------------------------------------------------------------------
// POST /api/events
// Create and save a new event.
// ---------------------------------------------------------------------------
const createEvent = async (req, res) => {
  const { title, description, category, venue, location, startDate, endDate, image } = req.body;

  // Required field validation
  if (!title || !description || !category || !venue || !location || !startDate || !endDate) {
    return res.status(400).json({
      status: 'error',
      message: 'title, description, category, venue, location, startDate, and endDate are required'
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

  // Date sanity check before hitting Mongoose
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({
      status: 'error',
      message: 'startDate and endDate must be valid dates'
    });
  }

  if (end <= start) {
    return res.status(400).json({
      status: 'error',
      message: 'endDate must be later than startDate'
    });
  }

  try {
    const event = new Event({
      title,
      description,
      category,
      venue,
      location,
      startDate: start,
      endDate: end,
      image: image || null
    });

    const saved = await event.save();

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
      message: 'Failed to create event'
    });
  }
};

// ---------------------------------------------------------------------------
// GET /api/events
// Retrieve all events with pagination, newest first.
// Query params: page (default 1), limit (default 20)
// ---------------------------------------------------------------------------
const getEvents = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  try {
    const [events, total] = await Promise.all([
      Event.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Event.countDocuments()
    ]);

    return res.status(200).json({
      status: 'success',
      data: events,
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
      message: 'Failed to retrieve events'
    });
  }
};

// ---------------------------------------------------------------------------
// GET /api/events/nearby
// Find events within a radius using $near + GeoJSON.
// Query params: longitude (required), latitude (required), radius (metres, default 5000)
// ---------------------------------------------------------------------------
const getNearbyEvents = async (req, res) => {
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
    const events = await Event.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radius
        }
      }
    });

    return res.status(200).json({
      status: 'success',
      data: events,
      meta: {
        longitude: lng,
        latitude: lat,
        radiusMetres: radius,
        count: events.length
      }
    });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve nearby events'
    });
  }
};

// ---------------------------------------------------------------------------
// GET /api/events/:id
// Retrieve a single event by its MongoDB ObjectId.
// ---------------------------------------------------------------------------
const getEventById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      status: 'error',
      message: `"${id}" is not a valid event ID`
    });
  }

  try {
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        status: 'error',
        message: 'Event not found'
      });
    }

    return res.status(200).json({
      status: 'success',
      data: event
    });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve event'
    });
  }
};

module.exports = {
  createEvent,
  getEvents,
  getNearbyEvents,
  getEventById
};
