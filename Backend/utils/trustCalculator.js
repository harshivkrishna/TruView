const calculateTrustScore = (review) => {
  const factors = analyzeTrustFactors(review);
  
  // Weighted scoring system
  const weights = {
    contentQuality: 0.25,
    engagement: 0.20,
    credibility: 0.25,
    recency: 0.15,
    mediaPresence: 0.15
  };
  
  const totalScore = Object.entries(factors).reduce((score, [factor, value]) => {
    return score + (value * weights[factor]);
  }, 0);
  
  // Convert to percentage (0-100)
  return Math.round(totalScore * 100);
};

const analyzeTrustFactors = (review) => {
  // Content Quality Score (0-1)
  const contentQuality = calculateContentQuality(review);
  
  // Engagement Score (0-1)
  const engagement = calculateEngagement(review);
  
  // Credibility Score (0-1)
  const credibility = calculateCredibility(review);
  
  // Recency Score (0-1)
  const recency = calculateRecency(review);
  
  // Media Presence Score (0-1)
  const mediaPresence = calculateMediaPresence(review);
  
  return {
    contentQuality,
    engagement,
    credibility,
    recency,
    mediaPresence
  };
};

const calculateContentQuality = (review) => {
  let score = 0;
  
  // Title quality (0-0.2)
  const titleLength = review.title.length;
  if (titleLength >= 10 && titleLength <= 100) score += 0.2;
  else if (titleLength >= 5 && titleLength <= 150) score += 0.1;
  
  // Description quality (0-0.3)
  const descLength = review.description.length;
  if (descLength >= 100 && descLength <= 2000) score += 0.3;
  else if (descLength >= 50 && descLength <= 5000) score += 0.2;
  else if (descLength >= 20) score += 0.1;
  
  // Rating balance (0-0.2)
  if (review.rating >= 3 && review.rating <= 5) score += 0.2;
  else if (review.rating >= 1 && review.rating <= 5) score += 0.1;
  
  // Tag relevance (0-0.3)
  const relevantTags = ['Honest', 'Brutal', 'Praise', 'Warning'];
  const hasRelevantTag = review.tags.some(tag => relevantTags.includes(tag));
  if (hasRelevantTag) score += 0.3;
  
  return Math.min(score, 1);
};

const calculateEngagement = (review) => {
  let score = 0;
  
  // Views score (0-0.4)
  if (review.views >= 100) score += 0.4;
  else if (review.views >= 50) score += 0.3;
  else if (review.views >= 20) score += 0.2;
  else if (review.views >= 5) score += 0.1;
  
  // Upvotes score (0-0.4)
  if (review.upvotes >= 20) score += 0.4;
  else if (review.upvotes >= 10) score += 0.3;
  else if (review.upvotes >= 5) score += 0.2;
  else if (review.upvotes >= 1) score += 0.1;
  
  // Engagement ratio (0-0.2)
  const engagementRatio = review.views > 0 ? review.upvotes / review.views : 0;
  if (engagementRatio >= 0.3) score += 0.2;
  else if (engagementRatio >= 0.1) score += 0.1;
  
  return Math.min(score, 1);
};

const calculateCredibility = (review) => {
  let score = 0;
  
  // Author presence (0-0.3)
  if (review.author?.name && review.author.name !== 'Anonymous') score += 0.3;
  
  // Tag credibility (0-0.4)
  if (review.tags.includes('Honest')) score += 0.4;
  else if (review.tags.includes('Brutal')) score += 0.3;
  else if (review.tags.includes('Praise')) score += 0.2;
  else if (review.tags.includes('Warning')) score += 0.2;
  
  // Rating credibility (0-0.3)
  // Balanced ratings (3-4) are often more credible than extreme ratings
  if (review.rating >= 3 && review.rating <= 4) score += 0.3;
  else if (review.rating >= 2 && review.rating <= 5) score += 0.2;
  else if (review.rating >= 1 && review.rating <= 5) score += 0.1;
  
  return Math.min(score, 1);
};

const calculateRecency = (review) => {
  const now = new Date();
  const reviewDate = new Date(review.createdAt);
  const daysDiff = Math.floor((now.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Recent reviews get higher scores
  if (daysDiff <= 1) return 1.0;
  if (daysDiff <= 7) return 0.9;
  if (daysDiff <= 30) return 0.8;
  if (daysDiff <= 90) return 0.6;
  if (daysDiff <= 365) return 0.4;
  return 0.2;
};

const calculateMediaPresence = (review) => {
  if (!review.media || review.media.length === 0) return 0.1;
  
  let score = 0.1; // Base score for having media
  
  // Number of media files (0-0.4)
  if (review.media.length >= 5) score += 0.4;
  else if (review.media.length >= 3) score += 0.3;
  else if (review.media.length >= 2) score += 0.2;
  else if (review.media.length >= 1) score += 0.1;
  
  // Media type diversity (0-0.3)
  const hasImages = review.media.some(m => m.type === 'image');
  const hasVideos = review.media.some(m => m.type === 'video');
  if (hasImages && hasVideos) score += 0.3;
  else if (hasImages || hasVideos) score += 0.2;
  
  // Media quality indicator (0-0.2)
  // Assuming media with proper URLs are higher quality
  const validMedia = review.media.filter(m => m.url && m.url.length > 10);
  if (validMedia.length === review.media.length) score += 0.2;
  
  return Math.min(score, 1);
};

const getTrustLevel = (trustScore) => {
  if (trustScore >= 80) {
    return {
      level: 'High',
      color: 'bg-green-100 text-green-700',
      description: 'Very trustworthy review'
    };
  } else if (trustScore >= 60) {
    return {
      level: 'Good',
      color: 'bg-blue-100 text-blue-700',
      description: 'Reliable review'
    };
  } else if (trustScore >= 40) {
    return {
      level: 'Fair',
      color: 'bg-yellow-100 text-yellow-700',
      description: 'Moderately trustworthy'
    };
  } else if (trustScore >= 20) {
    return {
      level: 'Low',
      color: 'bg-orange-100 text-orange-700',
      description: 'Limited trust indicators'
    };
  } else {
    return {
      level: 'Poor',
      color: 'bg-red-100 text-red-700',
      description: 'Low trust indicators'
    };
  }
};

module.exports = {
  calculateTrustScore,
  analyzeTrustFactors,
  getTrustLevel
}; 