/**
 * Authentication Middleware Reference
 * Verifies JWT tokens and enforces role-based access control.
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'urbanpulse_secure_jwt_secret_dev_2026';

exports.protect = (req, res, next) => {
  let token;

  // Extract from Authorization header (Bearer <token>)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Access denied. Authentication token required.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, role, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired authentication token. Please log in again.',
    });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden. You do not have permission to perform this action.',
      });
    }
    next();
  };
};
