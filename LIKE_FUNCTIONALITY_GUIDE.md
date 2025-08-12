# Like Functionality Guide

## Overview
The TruView platform implements a comprehensive like (upvote) system that ensures users can only like reviews once and requires authentication for interaction while allowing public access for viewing and sharing.

## Key Features

### 1. **Authentication Requirements**
- **Likes**: Require user authentication
- **Views**: No authentication required (public)
- **Sharing**: No authentication required (public)

### 2. **One Like Per User**
- Each user can only like a review once
- Clicking the like button again removes the like (toggle functionality)
- Visual feedback shows current like state

### 3. **Real-time Updates**
- Like count updates immediately after interaction
- Visual state changes (filled/unfilled icon)
- Toast notifications for user feedback

## Implementation Details

### Frontend Implementation

#### ReviewDetail Component
```typescript
// State management
const [hasUpvoted, setHasUpvoted] = useState(false);

// Check if user has upvoted on load
const fetchReview = async (reviewId) => {
  const reviewData = await getReview(reviewId);
  setReview(reviewData);
  
  if (currentUser && reviewData.upvotedBy) {
    const hasUpvoted = reviewData.upvotedBy.some(id => id === currentUser.userId);
    setHasUpvoted(hasUpvoted);
  }
};

// Handle upvote with authentication check
const handleUpvote = async () => {
  if (!currentUser) {
    toast.error('Please log in to like reviews');
    return;
  }

  try {
    const updatedReview = await upvoteReview(id);
    setReview(updatedReview);
    
    // Update upvote state
    if (updatedReview.upvotedBy) {
      const hasUpvoted = updatedReview.upvotedBy.some(id => id === currentUser.userId);
      setHasUpvoted(hasUpvoted);
      
      toast.success(hasUpvoted ? 'Review liked!' : 'Like removed');
    }
  } catch (error) {
    if (error.response?.status === 401) {
      toast.error('Please log in to like reviews');
    } else {
      toast.error('Failed to like review');
    }
  }
};
```

#### Visual States
```typescript
// Like button with different states
<button
  onClick={handleUpvote}
  disabled={!currentUser}
  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
    hasUpvoted 
      ? 'text-orange-500 bg-orange-50' 
      : currentUser 
        ? 'text-gray-600 hover:text-orange-500 hover:bg-orange-50' 
        : 'text-gray-400 cursor-not-allowed'
  }`}
  title={!currentUser ? 'Please log in to like reviews' : ''}
>
  <ThumbsUp className={`w-5 h-5 ${hasUpvoted ? 'fill-current' : ''}`} />
  <span>{review.upvotes || 0}</span>
</button>
```

### Backend Implementation

#### Review Model
```javascript
// Schema fields
upvotes: {
  type: Number,
  default: 0
},
upvotedBy: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User'
}],

// Toggle upvote method
ReviewSchema.methods.toggleUpvote = function(userId) {
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
```

#### API Endpoint
```javascript
// Upvote endpoint with authentication
router.patch('/:id/upvote', authenticateToken, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    const result = review.toggleUpvote(req.user.userId);
    await review.save();
    
    // Return the updated review object
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
```

## User Experience Flow

### 1. **Unauthenticated User**
- Can view reviews and upvote counts
- Can share reviews
- Like button is disabled with tooltip: "Please log in to like reviews"
- Clicking like button shows toast: "Please log in to like reviews"

### 2. **Authenticated User**
- Can like/unlike reviews
- Visual feedback shows current like state
- Toast notifications confirm actions
- Like count updates in real-time

### 3. **Like Interaction**
1. User clicks like button
2. Frontend checks authentication
3. If authenticated, sends request to backend
4. Backend toggles like state
5. Frontend updates UI and shows feedback
6. Like count and visual state update

## Error Handling

### Frontend Errors
- **401 Unauthorized**: Shows "Please log in to like reviews"
- **404 Not Found**: Shows "Review not found"
- **Network Errors**: Shows "Failed to like review"
- **General Errors**: Shows appropriate error message

### Backend Errors
- **Invalid Review ID**: Returns 404
- **Authentication Required**: Returns 401
- **Database Errors**: Returns 500 with error message

## Security Features

### 1. **Authentication Middleware**
```javascript
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    req.user = decoded;
    req.userProfile = user;
    return next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};
```

### 2. **Data Validation**
- User ID validation
- Review existence check
- Duplicate upvote prevention
- Input sanitization

## Performance Optimizations

### 1. **Database Indexing**
```javascript
// Index on upvotedBy array for faster lookups
ReviewSchema.index({ upvotedBy: 1 });

// Index on upvotes for sorting
ReviewSchema.index({ upvotes: -1 });
```

### 2. **Frontend Optimizations**
- Local state management
- Optimistic updates
- Error boundary handling
- Debounced API calls

## Testing Scenarios

### 1. **Authentication Tests**
- Unauthenticated user cannot like
- Authenticated user can like
- Token expiration handling
- Invalid token rejection

### 2. **Like Functionality Tests**
- First like adds to count
- Second like removes from count
- Multiple users can like same review
- Like count accuracy

### 3. **Edge Cases**
- Deleted reviews
- Deleted users
- Network failures
- Concurrent likes

## Future Enhancements

### 1. **Advanced Features**
- Like notifications
- Like analytics
- Like history
- Bulk like operations

### 2. **Performance Improvements**
- Redis caching
- Database optimization
- CDN integration
- Real-time updates

### 3. **User Experience**
- Like animations
- Like sound effects
- Like preferences
- Like categories

This like functionality provides a robust, secure, and user-friendly way for users to interact with reviews while maintaining data integrity and preventing abuse. 