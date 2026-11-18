/**
 * Event model
 * Represents a community event happening at a specific location and time.
 */
const mongoose = require('mongoose');

// ---------------------------------------------------------------------------
// GeoJSON Point sub-schema (same coordinate validation rules as Report)
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
// Event schema
// ---------------------------------------------------------------------------
const eventSchema = new mongoose.Schema(
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

    venue: {
      type: String,
      required: [true, 'Venue is required']
    },

    location: {
      type: geoPointSchema,
      required: [true, 'Location is required']
    },

    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },

    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function (value) {
          // "this" refers to the document being validated
          return this.startDate && value > this.startDate;
        },
        message: 'endDate must be later than startDate'
      }
    },

    image: {
      type: String,
      default: null
    },

    // Optional until User model is introduced
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true // adds createdAt and updatedAt
  }
);

// 2dsphere index enables geospatial queries on location
eventSchema.index({ location: '2dsphere' });

// ---------------------------------------------------------------------------
// Guard against duplicate model compilation (hot-reload / test environments)
// ---------------------------------------------------------------------------
const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);

module.exports = Event;
