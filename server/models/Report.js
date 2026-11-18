/**
 * Report model
 * Represents a user-submitted urban issue report (e.g. pothole, flooding).
 */
const mongoose = require('mongoose');

// ---------------------------------------------------------------------------
// GeoJSON Point sub-schema (reusable, shared coordinate validation rules)
// ---------------------------------------------------------------------------
const geoPointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: {
        values: ['Point'],
        message: 'location.type must be "Point"'
      },
      required: [true, 'location.type is required']
    },
    coordinates: {
      type: [Number],
      required: [true, 'location.coordinates is required'],
      validate: [
        {
          validator: (coords) => Array.isArray(coords) && coords.length === 2,
          message: 'location.coordinates must contain exactly two values: [longitude, latitude]'
        },
        {
          validator: (coords) => coords[0] >= -180 && coords[0] <= 180,
          message: 'Longitude must be between -180 and 180'
        },
        {
          validator: (coords) => coords[1] >= -90 && coords[1] <= 90,
          message: 'Latitude must be between -90 and 90'
        }
      ]
    }
  },
  { _id: false } // embedded sub-document; no separate _id needed
);

// ---------------------------------------------------------------------------
// Report schema
// ---------------------------------------------------------------------------
const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true
    },

    description: {
      type: String,
      required: [true, 'Description is required']
    },

    category: {
      type: String,
      required: [true, 'Category is required']
    },

    location: {
      type: geoPointSchema,
      required: [true, 'Location is required']
    },

    images: {
      type: [String],
      default: []
    },

    // Optional until User model is introduced
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    status: {
      type: String,
      enum: {
        values: ['active', 'resolved'],
        message: 'status must be "active" or "resolved"'
      },
      default: 'active'
    },

    confirmations: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: []
    },

    disputes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: []
    },

    confidenceScore: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true // adds createdAt and updatedAt
  }
);

// 2dsphere index enables geospatial queries on location
reportSchema.index({ location: '2dsphere' });

// ---------------------------------------------------------------------------
// Guard against duplicate model compilation (hot-reload / test environments)
// ---------------------------------------------------------------------------
const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);

module.exports = Report;
