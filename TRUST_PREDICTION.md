# AI-Powered Trust Prediction System

## Overview
The Truviews platform now features an intelligent AI-powered trust prediction system that automatically calculates trust scores for reviews based on multiple factors. This system helps users identify reliable and trustworthy reviews.

## How It Works

### 1. **Multi-Factor Analysis**
The AI analyzes reviews across 5 key dimensions:

#### **Content Quality (25% weight)**
- **Title Quality**: Optimal length (10-100 characters)
- **Description Quality**: Detailed reviews (100-2000 characters)
- **Rating Balance**: Balanced ratings (3-4 stars)
- **Tag Relevance**: Presence of relevant tags (Honest, Brutal, Praise, Warning)

#### **Engagement (20% weight)**
- **Views**: Higher views indicate interest
- **Upvotes**: Community validation
- **Engagement Ratio**: Upvotes per view ratio

#### **Credibility (25% weight)**
- **Author Presence**: Named authors vs anonymous
- **Tag Credibility**: "Honest" and "Brutal" tags score higher
- **Rating Credibility**: Balanced ratings are more credible

#### **Recency (15% weight)**
- **Recent Reviews**: Newer reviews get higher scores
- **Time Decay**: Older reviews gradually lose points

#### **Media Presence (15% weight)**
- **Media Count**: More media files = higher score
- **Media Diversity**: Mix of images and videos
- **Media Quality**: Valid URLs and proper formatting

### 2. **Scoring Algorithm**

```javascript
// Example calculation
const factors = {
  contentQuality: 0.8,    // 80% quality
  engagement: 0.6,        // 60% engagement
  credibility: 0.9,       // 90% credibility
  recency: 1.0,          // 100% recent
  mediaPresence: 0.7     // 70% media presence
};

const weights = {
  contentQuality: 0.25,
  engagement: 0.20,
  credibility: 0.25,
  recency: 0.15,
  mediaPresence: 0.15
};

// Weighted calculation
const trustScore = (0.8 * 0.25) + (0.6 * 0.20) + (0.9 * 0.25) + (1.0 * 0.15) + (0.7 * 0.15);
// Result: 0.815 = 82% trust score
```

### 3. **Trust Levels**

| Score Range | Level | Color | Description |
|-------------|-------|-------|-------------|
| 80-100% | High | Green | Very trustworthy review |
| 60-79% | Good | Blue | Reliable review |
| 40-59% | Fair | Yellow | Moderately trustworthy |
| 20-39% | Low | Orange | Limited trust indicators |
| 0-19% | Poor | Red | Low trust indicators |

## Implementation

### Frontend (`trustPrediction.ts`)
```typescript
import { calculateTrustScore, getTrustLevel } from '../utils/trustPrediction';

// Calculate trust score
const trustScore = calculateTrustScore(review);

// Get trust level with styling
const trustLevel = getTrustLevel(trustScore);
// Returns: { level: 'High', color: 'bg-green-100 text-green-700', description: '...' }
```

### Backend (`trustCalculator.js`)
```javascript
const { calculateTrustScore } = require('../utils/trustCalculator');

// Calculate and store trust score when creating review
const trustScore = calculateTrustScore(reviewData);
reviewData.trustScore = trustScore;
```

## Visual Indicators

### Trust Score Display
- **Percentage**: Shows exact trust score (e.g., "82% Trust")
- **Color Coding**: Visual indication of trust level
- **Dynamic Updates**: Scores update as engagement changes

### Example UI
```
⭐ ⭐ ⭐ ⭐ ⭐ (5/5)  [82% Trust]  ← Green badge for high trust
```

## Benefits

### 1. **User Confidence**
- Clear trust indicators help users make informed decisions
- Reduces uncertainty about review reliability
- Builds trust in the platform

### 2. **Quality Control**
- Encourages detailed, well-written reviews
- Rewards engagement and community participation
- Discourages low-quality content

### 3. **Transparency**
- Open algorithm that users can understand
- Multiple factors prevent gaming the system
- Fair and consistent scoring

## Technical Features

### 1. **Real-time Calculation**
- Scores calculated when reviews are created
- Updates automatically with engagement changes
- No manual intervention required

### 2. **Cross-platform Consistency**
- Same algorithm on frontend and backend
- Consistent results across all platforms
- Reliable and predictable scoring

### 3. **Performance Optimized**
- Efficient calculation algorithms
- Minimal impact on page load times
- Scalable for large datasets

## Future Enhancements

### 1. **Machine Learning Integration**
- **Sentiment Analysis**: Analyze review tone and emotion
- **Pattern Recognition**: Identify suspicious review patterns
- **User Behavior**: Learn from user interactions

### 2. **Advanced Features**
- **Reviewer Reputation**: Track author history and consistency
- **Product Correlation**: Compare reviews across similar products
- **Temporal Analysis**: Account for seasonal trends

### 3. **Personalization**
- **User Preferences**: Customize scoring based on user behavior
- **Category-specific**: Different weights for different product categories
- **Cultural Factors**: Account for regional preferences

## Usage Examples

### High Trust Review Example
```javascript
const highTrustReview = {
  title: "Excellent product with amazing features",
  description: "I've been using this product for 3 months now...",
  rating: 4,
  tags: ["Honest", "Praise"],
  author: { name: "John Doe" },
  upvotes: 25,
  views: 150,
  media: [{ type: "image", url: "..." }],
  createdAt: "2024-01-15"
};
// Trust Score: ~85%
```

### Low Trust Review Example
```javascript
const lowTrustReview = {
  title: "Bad",
  description: "Don't buy",
  rating: 1,
  tags: [],
  author: { name: "Anonymous" },
  upvotes: 0,
  views: 2,
  media: [],
  createdAt: "2024-01-10"
};
// Trust Score: ~15%
```

## Best Practices

### For Users
1. **Write Detailed Reviews**: Longer, descriptive reviews score higher
2. **Use Relevant Tags**: Choose appropriate tags (Honest, Brutal, etc.)
3. **Include Media**: Add photos and videos to increase trust
4. **Engage with Community**: Upvote and view other reviews

### For Developers
1. **Consistent Implementation**: Use the same algorithm across platforms
2. **Regular Updates**: Recalculate scores when engagement changes
3. **Performance Monitoring**: Track calculation performance
4. **User Feedback**: Collect feedback on trust score accuracy

This AI-powered trust prediction system provides users with reliable indicators of review quality while encouraging high-quality content creation on the platform. 