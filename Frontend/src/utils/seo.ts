/**
 * SEO Utility Functions
 * Helps manage dynamic meta tags and structured data
 */

interface MetaTagsConfig {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

/**
 * Update page meta tags dynamically
 */
export const updateMetaTags = (config: MetaTagsConfig) => {
  const {
    title = 'TruView - Authentic Reviews & Ratings Platform',
    description = 'Discover genuine reviews and ratings for products, services, and experiences.',
    keywords = 'reviews, ratings, product reviews, service reviews',
    image = 'https://truview-steel.vercel.app/assets/logo.png',
    url = window.location.href,
    type = 'website'
  } = config;

  // Update document title
  document.title = title;

  // Update or create meta tags
  updateMetaTag('name', 'description', description);
  updateMetaTag('name', 'keywords', keywords);
  
  // Open Graph tags
  updateMetaTag('property', 'og:title', title);
  updateMetaTag('property', 'og:description', description);
  updateMetaTag('property', 'og:image', image);
  updateMetaTag('property', 'og:url', url);
  updateMetaTag('property', 'og:type', type);
  
  // Twitter tags
  updateMetaTag('property', 'twitter:title', title);
  updateMetaTag('property', 'twitter:description', description);
  updateMetaTag('property', 'twitter:image', image);
  updateMetaTag('property', 'twitter:url', url);
};

/**
 * Helper function to update or create a meta tag
 */
const updateMetaTag = (attribute: string, key: string, content: string) => {
  let element = document.querySelector(`meta[${attribute}="${key}"]`);
  
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  
  element.setAttribute('content', content);
};

/**
 * Add structured data (JSON-LD) to the page
 */
export const addStructuredData = (data: object) => {
  // Remove existing structured data script if present
  const existingScript = document.querySelector('script[type="application/ld+json"]#dynamic-structured-data');
  if (existingScript) {
    existingScript.remove();
  }

  // Create new script element
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'dynamic-structured-data';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
};

/**
 * Generate structured data for a review
 */
export const generateReviewStructuredData = (review: any) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    'itemReviewed': {
      '@type': 'Product',
      'name': review.productName || review.title,
      'image': review.images?.[0] || review.image,
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
        : 'Anonymous'
    },
    'reviewBody': review.description || review.content,
    'datePublished': review.createdAt || new Date().toISOString()
  };
};

/**
 * Generate breadcrumb structured data
 */
export const generateBreadcrumbStructuredData = (items: Array<{ name: string; url: string }>) => {
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
 * Preload critical resources
 */
export const preloadImage = (src: string) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  document.head.appendChild(link);
};

/**
 * Lazy load images with intersection observer
 */
export const lazyLoadImage = (img: HTMLImageElement) => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target as HTMLImageElement;
        const src = target.dataset.src;
        if (src) {
          target.src = src;
          target.removeAttribute('data-src');
        }
        observer.unobserve(target);
      }
    });
  }, {
    rootMargin: '50px'
  });

  observer.observe(img);
};
