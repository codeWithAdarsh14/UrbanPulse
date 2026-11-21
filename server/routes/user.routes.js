/**
 * User Profile Routes
 * Protected endpoints for fetching and updating authenticated user profile in MongoDB.
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// GET /api/users/profile - Fetch authenticated user's profile from MongoDB
router.get('/profile', protect, authController.getMe);

// PUT /api/users/profile - Update authenticated user's profile in MongoDB
router.put('/profile', protect, authController.updateProfile);

module.exports = router;
