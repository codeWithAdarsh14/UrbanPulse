/**
 * Authentication Controller Reference
 * Production-ready handler for login, register, me, and logout with JWT and bcrypt.
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'urbanpulse_secure_jwt_secret_dev_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Name, email, and password are required',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 8 characters long',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check duplicate
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({
        status: 'error',
        message: 'An account with this email address already exists',
      });
    }

    // Default to 'citizen' unless explicitly authorized
    const userRole = role === 'official' || role === 'admin' ? 'citizen' : 'citizen';

    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: userRole,
      phone: phone ? phone.trim() : null,
    });

    await user.save();

    const token = generateToken(user._id, user.role);

    return res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Query user and explicitly select password
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    // Generic error to prevent account enumeration
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      status: 'success',
      message: 'Logged in successfully',
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User profile not found',
      });
    }

    return res.status(200).json({
      status: 'success',
      user: user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
exports.logout = (req, res) => {
  return res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
};
