const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v);
      },
      message: 'Phone number must be exactly 10 digits'
    }
  },
  dateOfBirth: {
    type: Date
  },
  location: {
    city: String,
    state: String,
    country: String
  },
  bio: {
    type: String,
    maxlength: 500
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  avatar: {
    type: String,
    default: ''
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationOTP: {
    code: String,
    expiresAt: Date
  },
  resetPasswordOTP: {
    code: String,
    expiresAt: Date
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  trustScore: {
    type: Number,
    default: 50
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  isPublicProfile: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
// Using 10 salt rounds for optimal balance between security and performance
// 10 rounds = ~150ms, 12 rounds = ~300ms (2x slower)
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate OTP method
UserSchema.methods.generateOTP = function() {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = mongoose.model('User', UserSchema);