# MongoDB Connection Issues - Fix Documentation

## Problem
Sometimes trending reviews (and other endpoints) return empty results or fail intermittently. This is typically caused by:

1. **MongoDB Connection State Issues**: Temporary disconnections or connection not ready
2. **Race Conditions**: Using `.lean()` with `.populate()` can cause timing issues
3. **Null Reference Errors**: Author data may be null if user was deleted
4. **Missing Error Handling**: Errors were being logged but not handled gracefully

## Solutions Implemented

### 1. Connection State Checking
All review endpoints now check MongoDB connection state before executing queries:

```javascript
if (mongoose.connection.readyState !== 1) {
  console.error('MongoDB not connected. State:', mongoose.connection.readyState);
  return res.status(503).json({ 
    message: 'Database temporarily unavailable. Please try again.',
    reviews: [] 
  });
}
```

**Connection States:**
- `0` = disconnected
- `1` = connected
- `2` = connecting
- `3` = disconnecting

### 2. Improved Population with Null Safety
Fixed the populate query to handle edge cases:

```javascript
.populate({
  path: 'author.userId',
  select: 'firstName lastName avatar',
  options: { strictPopulate: false }
})
```

Added comprehensive null checking:

```javascript
if (userId && typeof userId === 'object' && userId.firstName) {
  // User exists and was populated successfully
  reviewObj.author.name = `${userId.firstName} ${userId.lastName}`;
  reviewObj.author.avatar = userId.avatar;
  reviewObj.author.userId = userId._id;
} else {
  // Handle deleted users or failed population
  reviewObj.author.name = 'Anonymous';
  reviewObj.author.avatar = null;
  reviewObj.author.userId = null;
}
```

### 3. Added `.exec()` to Queries
Using `.exec()` returns proper promises and improves error handling:

```javascript
const reviews = await Review.find(query)
  .populate(...)
  .select(...)
  .sort(...)
  .limit(10)
  .lean()
  .exec();  // Important!
```

### 4. Enhanced Error Logging
Added detailed logging to track issues:

```javascript
console.log(`Successfully fetched ${formattedReviews.length} trending reviews`);
console.error('Error stack:', error.stack);
```

### 5. Graceful Error Handling
Instead of returning 500 errors that break the UI, endpoints now return empty arrays:

```javascript
catch (error) {
  console.error('Error fetching trending reviews:', error);
  // Return empty array instead of error to prevent UI breaks
  res.status(200).json([]);
}
```

### 6. MongoDB Auto-Reconnection
Enhanced connection event listeners to handle disconnections gracefully:

```javascript
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
  // Mongoose will automatically attempt to reconnect with retryWrites: true
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected successfully');
});
```

## MongoDB Connection Options

The following options ensure stable connections:

```javascript
{
  maxPoolSize: 5,
  minPoolSize: 1,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 30000,
  connectTimeoutMS: 10000,
  bufferCommands: false,
  retryWrites: true,           // Auto-retry failed writes
  w: 'majority',               // Write concern
  heartbeatFrequencyMS: 10000, // Check connection health every 10s
}
```

## Affected Endpoints

The following endpoints were fixed:

1. ✅ `GET /api/reviews` - Main reviews list with pagination
2. ✅ `GET /api/reviews/trending` - Trending reviews (most viewed)

## Testing

To test if the fixes work:

1. **Check Server Logs**: Look for these messages:
   - `✅ MongoDB reconnected successfully`
   - `Successfully fetched X trending reviews`
   - `Fetched X reviews out of Y total`

2. **Test Endpoints**:
   ```bash
   curl https://your-backend.onrender.com/api/reviews/trending
   curl https://your-backend.onrender.com/api/reviews
   ```

3. **Monitor Connection State**:
   - If you see `⚠️ MongoDB disconnected`, Mongoose will auto-reconnect
   - Queries during disconnection will return empty results gracefully

## Common Issues

### Issue 1: Empty Results Despite Data Existing
**Cause**: MongoDB temporarily disconnected
**Solution**: Wait a few seconds for auto-reconnection, refresh the page

### Issue 2: Author Shows as "Anonymous"
**Cause**: User account was deleted but reviews remain
**Solution**: This is expected behavior - reviews are preserved with anonymous author

### Issue 3: Intermittent Failures
**Cause**: Network latency or MongoDB Atlas maintenance
**Solution**: 
- Check MongoDB Atlas status
- Ensure MongoDB allows connections from 0.0.0.0/0
- Check Render logs for detailed error messages

## Monitoring

Monitor these logs on Render to catch issues early:

- `MongoDB not connected. State: X` - Connection not ready
- `⚠️ MongoDB disconnected` - Temporary disconnection
- `✅ MongoDB reconnected` - Connection restored
- `Failed to populate author` - Data integrity issue

## Best Practices

1. **Always check connection state** before database operations
2. **Use `.exec()`** on queries for proper promise handling
3. **Handle null references** when dealing with populated data
4. **Return graceful errors** (empty arrays) instead of 500 errors
5. **Log detailed errors** for debugging but don't expose to users
6. **Use strictPopulate: false** for flexible population
7. **Enable retryWrites** for automatic retry on network issues

## Future Improvements

Consider implementing:

1. **Caching Layer**: Redis cache for trending reviews
2. **Connection Pool Monitoring**: Track pool usage and adjust sizes
3. **Query Performance Monitoring**: Log slow queries
4. **Fallback Data**: Return cached data when MongoDB is unavailable
5. **Health Check Improvements**: Include MongoDB connection state in `/health` endpoint

