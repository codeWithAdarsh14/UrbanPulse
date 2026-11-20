require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { connectDB } = require('./config/database');
const healthRoutes = require('./routes/health.routes');
const reportRoutes = require('./routes/report.routes');
const eventRoutes = require('./routes/event.routes');
const authRoutes = require('./routes/auth.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/events', eventRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'UrbanPulse API',
    version: '1.0.0',
    documentation: 'See README.md for endpoint specifications',
    healthCheck: '/api/health'
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  });
});

// Start listening only after a successful database connection
let server;
if (require.main === module) {
  connectDB()
    .then(() => {
      server = app.listen(PORT, '127.0.0.1', () => {
        console.log(`UrbanPulse Server running on http://localhost:${PORT}`);
        console.log(`Health endpoint available at http://localhost:${PORT}/api/health`);
      });
    })
    .catch((err) => {
      console.error('Startup failed:', err.message);
      process.exit(1);
    });
}

module.exports = { app, server };
