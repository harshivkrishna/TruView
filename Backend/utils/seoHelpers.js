/**
 * SEO Helper Functions for Backend
 * Generates dynamic meta tags and structured data
 */

/**
 * Generate meta tags for a review
 */
const generateReviewMetaTags = (review) => {
  return {
    title: `${review.productName || review.title} - Review | TruView`,
    description: review.description 
      ? review.description.substring(0, 160) + '...' 
      : 'Read authentic review on TruView',
    keywords: [
      review.category?.name,
      review.subcategory?.name,
      'review',
      'rating',
      'authentic review'
    ].filter(Boolean).join(', '),
    image: review.images?.[0] || review.image || '/assets/logo.png',
    url: `https://truview-steel.vercel.app/review/${review._id}`,
    type: 'article',
  };
};

/**
 * Generate structured data for a review (JSON-LD)
 */
const generateReviewStructuredData = (review) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    'itemReviewed': {
      '@type': 'Product',
      'name': review.productName || review.title,
      'image': review.images?.[0] || review.image,
      'category': review.category?.name,
    },
    'reviewRating': {
      '@type': 'Rating',
      'ratingValue': review.rating,
      'bestRating': '5',
      'worstRating': '1'
    },
    'author': {
      '@type': 'Person',
      'name': review.author?.firstName && review.author?.lastName 
        ? `${review.author.firstName} ${review.author.lastName}` 
        : 'Anonymous User'
    },
    'reviewBody': review.description || review.content,
    'datePublished': review.createdAt,
    'publisher': {
      '@type': 'Organization',
      'name': 'TruView',
      'url': 'https://truview-steel.vercel.app'
    }
  };
};

/**
 * Generate breadcrumb structured data
 */
const generateBreadcrumbData = (items) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': item.url
    }))
  };
};

/**
 * Generate category page meta tags
 */
const generateCategoryMetaTags = (category) => {
  return {
    title: `${category.name} Reviews | TruView`,
    description: `Browse authentic reviews for ${category.name}. Read real experiences and ratings from verified users.`,
    keywords: `${category.name}, reviews, ratings, ${category.name} reviews`,
    url: `https://truview-steel.vercel.app/categories/${category.slug}`,
  };
};

/**
 * Sanitize text for SEO (remove HTML, limit length)
 */
const sanitizeForSEO = (text, maxLength = 160) => {
  if (!text) return '';
  
  // Remove HTML tags
  const stripped = text.replace(/<[^>]*>/g, '');
  
  // Limit length
  if (stripped.length > maxLength) {
    return stripped.substring(0, maxLength) + '...';
  }
  
  return stripped;
};

/**
 * Generate Open Graph tags
 */
const generateOpenGraphTags = (data) => {
  return {
    'og:title': data.title,
    'og:description': data.description,
    'og:image': data.image,
    'og:url': data.url,
    'og:type': data.type || 'website',
    'og:site_name': 'TruView',
  };
};

/**
 * Generate Twitter Card tags
 */
const generateTwitterCardTags = (data) => {
  return {
    'twitter:card': 'summary_large_image',
    'twitter:title': data.title,
    'twitter:description': data.description,
    'twitter:image': data.image,
    'twitter:url': data.url,
  };
};

module.exports = {
  generateReviewMetaTags,
  generateReviewStructuredData,
  generateBreadcrumbData,
  generateCategoryMetaTags,
  sanitizeForSEO,
  generateOpenGraphTags,
  generateTwitterCardTags,
};
