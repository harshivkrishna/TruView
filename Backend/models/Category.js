const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  icon: String,
  subcategories: [{
    type: String,
    required: true
  }],
  reviewCount: {
    type: Number,
    default: 0
  },
  trending: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Category', CategorySchema);