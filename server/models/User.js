/**
 * User Model
 * Connects directly to the 'user' collection in MongoDB Atlas 'auth' database.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
        'Please enter a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Do not return password by default in queries
    },
    role: {
      type: String,
      enum: ['citizen', 'official', 'moderator', 'admin'],
      default: 'citizen',
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    avatar: {
      type: String,
      default: '',
      trim: true,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    city: {
      type: String,
      default: '',
      trim: true,
    },
    state: {
      type: String,
      default: '',
      trim: true,
    },
    pincode: {
      type: String,
      default: '',
      trim: true,
    },
    country: {
      type: String,
      default: 'India',
      trim: true,
    },
    preferences: {
      alertNearbyEvents: { type: Boolean, default: true },
      alertCivic: { type: Boolean, default: true },
      alertUpdates: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving if modified
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password securely, with safe migration if legacy record is plaintext
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password || !candidatePassword) return false;
  
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
    return await bcrypt.compare(candidatePassword, this.password);
  }
  
  // Safe migration fallback: if legacy password was plaintext
  if (this.password === candidatePassword) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(candidatePassword, salt);
    await this.save();
    return true;
  }
  
  return false;
};

// Safe JSON serialization (strip password and internal fields)
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj.password;
  delete obj.__v;
  return obj;
};

// Bind strictly to the 'user' collection in 'auth' database
module.exports = mongoose.model('User', userSchema, 'user');
