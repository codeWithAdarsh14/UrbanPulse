/**
 * Event routes
 * Mounts all event-related endpoints under /api/events (set in server.js).
 */
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');

// IMPORTANT: /nearby must be declared before /:id so Express does not
// interpret the literal string "nearby" as a dynamic :id segment.

// POST   /api/events            → create a new event
router.post('/', eventController.createEvent);

// GET    /api/events            → list events (paginated)
router.get('/', eventController.getEvents);

// GET    /api/events/nearby     → geospatial nearby search
router.get('/nearby', eventController.getNearbyEvents);

// GET    /api/events/:id        → single event by ID
router.get('/:id', eventController.getEventById);

module.exports = router;
