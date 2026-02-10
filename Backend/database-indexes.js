// Database indexes for high-scale optimization
// Run these commands in MongoDB shell or MongoDB Compass

// Reviews collection indexes
db.reviews.createIndex({ "createdAt": -1 });
db.reviews.createIndex({ "rating": -1 });
db.reviews.createIndex({ "category": 1, "subcategory": 1 });
db.reviews.createIndex({ "author.userId": 1 });
db.reviews.createIndex({ "tags": 1 });
db.reviews.createIndex({ "trustScore": -1 });
db.reviews.createIndex({ "upvotes": -1 });
db.reviews.createIndex({ "views": -1 });
db.reviews.createIndex({ "createdAt": -1, "rating": -1 });
db.reviews.createIndex({ "category": 1, "createdAt": -1 });
db.reviews.createIndex({ "author.userId": 1, "createdAt": -1 });

// CRITICAL: Compound index for trending reviews optimization
db.reviews.createIndex({ "views": -1, "upvotes": -1, "createdAt": -1 });

// IMPORTANT: Compound index for weekly trending with date filter
db.reviews.createIndex({ "createdAt": -1, "views": -1, "upvotes": -1 });

// OPTIMIZATION: Partial index for non-removed reviews (most common query)
db.reviews.createIndex(
  { "views": -1, "upvotes": -1, "createdAt": -1 },
  { partialFilterExpression: { "isRemovedByAdmin": { $ne: true } } }
);

// Users collection indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "userId": 1 }, { unique: true });
db.users.createIndex({ "createdAt": -1 });
db.users.createIndex({ "lastLogin": -1 });

// Categories collection indexes
db.categories.createIndex({ "name": 1 }, { unique: true });
db.categories.createIndex({ "parentCategory": 1 });

// Reports collection indexes
db.reports.createIndex({ "reviewId": 1 });
db.reports.createIndex({ "reporterId": 1 });
db.reports.createIndex({ "status": 1 });
db.reports.createIndex({ "createdAt": -1 });

// Compound indexes for complex queries
db.reviews.createIndex({ "category": 1, "subcategory": 1, "createdAt": -1 });
db.reviews.createIndex({ "tags": 1, "createdAt": -1 });
db.reviews.createIndex({ "rating": -1, "createdAt": -1 });
db.reviews.createIndex({ "trustScore": -1, "createdAt": -1 });

// Text search index for review content
db.reviews.createIndex({ 
  "title": "text", 
  "description": "text", 
  "tags": "text" 
});

// Partial indexes for better performance
db.reviews.createIndex(
  { "createdAt": -1 }, 
  { partialFilterExpression: { "status": "published" } }
);

db.reviews.createIndex(
  { "upvotes": -1 }, 
  { partialFilterExpression: { "upvotes": { $gte: 1 } } }
);

// Sparse indexes for optional fields
db.reviews.createIndex({ "subcategory": 1 }, { sparse: true });
db.users.createIndex({ "avatar": 1 }, { sparse: true });

console.log("✅ All database indexes created successfully for high-scale optimization!");
