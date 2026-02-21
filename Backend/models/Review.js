const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxLength: 100
  },
  description: {
    type: String,
    required: true,
    maxLength: 10000
  },
  category: {
    type: String,
    required: true
  },
  subcategory: {
    type: String,
    required: true
  },
  tags: [{
    type: String,
    enum: ['Brutal', 'Honest', 'Praise', 'Rant', 'Warning', 'Recommended', 'Caution', 'Fair']
  }],
  media: [{
    type: {
      type: String,
      enum: ['image', 'video']
    },
    url: String,
    filename: String
  }],
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  author: {
    name: String,
    avatar: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  upvotes: {
    type: Number,
    default: 0
  },
  upvotedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  },
  viewedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  featured: {
    type: Boolean,
    default: false
  },
  trustScore: {
    type: Number,
    default: 0
  },
  isRemovedByAdmin: {
    type: Boolean,
    default: false
  },
  adminRemovalReason: {
    type: String,
    maxLength: 500
  },
  originalLanguage: {
    type: String,
    default: null
  },
  translations: {
    type: Map,
    of: String,
    default: () => new Map()
  },
  titleTranslations: {
    type: Map,
    of: String,
    default: () => new Map()
  }
}, {
  timestamps: true
});

// Method to add view (only once per user)
ReviewSchema.methods.addView = function (userId) {
  if (!userId) return false;

  const existingView = this.viewedBy.find(view => view.userId.toString() === userId.toString());
  if (!existingView) {
    this.viewedBy.push({ userId, viewedAt: new Date() });
    this.views = this.viewedBy.length;
    return true;
  }
  return false;
};

// Method to toggle upvote (one per user)
ReviewSchema.methods.toggleUpvote = function (userId) {
  if (!userId) return false;

  const userIdStr = userId.toString();
  const existingUpvote = this.upvotedBy.find(id => id.toString() === userIdStr);

  if (existingUpvote) {
    // Remove upvote
    this.upvotedBy = this.upvotedBy.filter(id => id.toString() !== userIdStr);
    this.upvotes = Math.max(0, this.upvotes - 1);
    return { upvoted: false, upvotes: this.upvotes };
  } else {
    // Add upvote
    this.upvotedBy.push(userId);
    this.upvotes = this.upvotedBy.length;
    return { upvoted: true, upvotes: this.upvotes };
  }
};

// Method to check if user has upvoted
ReviewSchema.methods.hasUserUpvoted = function (userId) {
  if (!userId) return false;
  return this.upvotedBy.some(id => id.toString() === userId.toString());
};

// Method to check if user has viewed
ReviewSchema.methods.hasUserViewed = function (userId) {
  if (!userId) return false;
  return this.viewedBy.some(view => view.userId.toString() === userId.toString());
};

module.exports = mongoose.model('Review', ReviewSchema);