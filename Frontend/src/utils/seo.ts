/**
 * Enhanced SEO Utility Functions
 * Comprehensive SEO management with performance optimization
 */

interface MetaTagsConfig {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  canonical?: string;
}

interface ReviewData {
  id: string;
  title: string;
  description: string;
  rating: number;
  category: string;
  subcategory?: string;
  author: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt?: string;
  images?: string[];
  tags?: string[];
  trustScore?: number;
  upvotes?: number;
  views?: number;
}

/**
 * Update page meta tags dynamically with enhanced SEO
 */
export const updateMetaTags = (config: MetaTagsConfig) => {
  const {
    title = 'TruView - Authentic Reviews & Ratings Platform',
    description = 'Discover genuine reviews and ratings for products, services, and experiences.',
    keywords = 'reviews, ratings, product reviews, service reviews',
    image = import.meta.env.VITE_FRONTEND_URL ? `${import.meta.env.VITE_FRONTEND_URL}/assets/logo.png` : '/assets/logo.png',
    url = window.location.href,
    type = 'website',
    author,
    publishedTime,
    modifiedTime,
    section,
    tags = [],
    canonical
  } = config;

  // Update document title
  document.title = title;

  // Basic meta tags
  updateMetaTag('name', 'description', description);
  updateMetaTag('name', 'keywords', keywords);
  if (author) updateMetaTag('name', 'author', author);
  
  // Open Graph tags
  updateMetaTag('property', 'og:title', title);
  updateMetaTag('property', 'og:description', description);
  updateMetaTag('property', 'og:image', image);
  updateMetaTag('property', 'og:url', url);
  updateMetaTag('property', 'og:type', type);
  updateMetaTag('property', 'og:site_name', 'TruView');
  if (publishedTime) updateMetaTag('property', 'article:published_time', publishedTime);
  if (modifiedTime) updateMetaTag('property', 'article:modified_time', modifiedTime);
  if (section) updateMetaTag('property', 'article:section', section);
  if (tags.length > 0) {
    tags.forEach(tag => updateMetaTag('property', 'article:tag', tag));
  }
  
  // Twitter Card tags
  updateMetaTag('name', 'twitter:card', 'summary_large_image');
  updateMetaTag('name', 'twitter:title', title);
  updateMetaTag('name', 'twitter:description', description);
  updateMetaTag('name', 'twitter:image', image);
  updateMetaTag('name', 'twitter:url', url);
  
  // Additional SEO tags
  updateMetaTag('name', 'robots', 'index, follow');
  updateMetaTag('name', 'viewport', 'width=device-width, initial-scale=1.0');
  updateMetaTag('name', 'theme-color', '#ff6b35');
  
  // Canonical URL
  if (canonical) {
    updateCanonicalUrl(canonical);
  }
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
 * Update canonical URL
 */
const updateCanonicalUrl = (url: string) => {
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', url);
};

/**
 * Generate enhanced structured data for a review
 */
export const generateReviewStructuredData = (review: ReviewData) => {
  const baseUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    'headline': review.title,
    'itemReviewed': {
      '@type': 'Product',
      'name': review.title,
      'description': review.description.substring(0, 160),
      'image': review.images?.[0] || `${baseUrl}/assets/logo.png`,
      'category': review.category,
      'brand': {
        '@type': 'Brand',
        'name': 'TruView'
      }
    },
    'reviewRating': {
      '@type': 'Rating',
      'ratingValue': review.rating,
      'bestRating': '5',
      'worstRating': '1'
    },
    'author': {
      '@type': 'Person',
      'name': `${review.author.firstName} ${review.author.lastName}`,
      'image': review.author.avatar || `${baseUrl}/assets/default-avatar.png`
    },
    'reviewBody': review.description,
    'datePublished': review.createdAt,
    'dateModified': review.updatedAt || review.createdAt,
    'publisher': {
      '@type': 'Organization',
      'name': 'TruView',
      'logo': {
        '@type': 'ImageObject',
        'url': `${baseUrl}/assets/logo.png`
      }
    },
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': `${baseUrl}/review/${review.id}`
    },
    'keywords': review.tags?.join(', ') || review.category,
    'interactionStatistic': [
      {
        '@type': 'InteractionCounter',
        'interactionType': 'https://schema.org/ViewAction',
        'userInteractionCount': review.views || 0
      },
      {
        '@type': 'InteractionCounter',
        'interactionType': 'https://schema.org/LikeAction',
        'userInteractionCount': review.upvotes || 0
      }
    ]
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
 * Generate organization structured data
 */
export const generateOrganizationStructuredData = () => {
  const baseUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'TruView',
    'url': baseUrl,
    'logo': `${baseUrl}/assets/logo.png`,
    'description': 'Authentic reviews and ratings platform for products, services, and experiences.',
    'sameAs': [
      // Add social media URLs when available
    ],
    'contactPoint': {
      '@type': 'ContactPoint',
      'contactType': 'customer service',
      'email': 'support@truviews.in'
    }
  };
};

/**
 * Generate FAQ structured data
 */
export const generateFAQStructuredData = (faqs: Array<{ question: string; answer: string }>) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(faq => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.answer
      }
    }))
  };
};

/**
 * Generate category structured data
 */
export const generateCategoryStructuredData = (category: { name: string; description: string; slug: string }) => {
  const baseUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': `${category.name} Reviews`,
    'description': category.description,
    'url': `${baseUrl}/category/${category.slug}`,
    'mainEntity': {
      '@type': 'ItemList',
      'name': `${category.name} Reviews`,
      'description': `Browse reviews in ${category.name} category`
    }
  };
};

/**
 * Generate user profile structured data
 */
export const generateUserProfileStructuredData = (user: { firstName: string; lastName: string; bio?: string; reviewCount: number }) => {
  const baseUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    'name': `${user.firstName} ${user.lastName}`,
    'description': user.bio || `Reviewer with ${user.reviewCount} reviews on TruView`,
    'url': `${baseUrl}/user/${user.firstName.toLowerCase()}-${user.lastName.toLowerCase()}`,
    'knowsAbout': 'Product Reviews, Service Reviews, Consumer Feedback'
  };
};

/**
 * Lazy load images with intersection observer and performance optimization
 */
export const lazyLoadImage = (img: HTMLImageElement) => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target as HTMLImageElement;
        const src = target.dataset.src;
        if (src) {
          // Add loading="lazy" for native lazy loading fallback
          target.loading = 'lazy';
          target.src = src;
          target.removeAttribute('data-src');
          
          // Add error handling
          target.onerror = () => {
            target.src = '/assets/placeholder-image.png';
          };
        }
        observer.unobserve(target);
      }
    });
  }, {
    rootMargin: '50px',
    threshold: 0.1
  });

  observer.observe(img);
};

/**
 * Preload critical resources for better performance
 */
export const preloadCriticalResources = (resources: Array<{ href: string; as: string; type?: string }>) => {
  resources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.href;
    link.as = resource.as;
    if (resource.type) link.type = resource.type;
    document.head.appendChild(link);
  });
};

/**
 * Generate sitemap data for dynamic routes
 */
export const generateSitemapData = (routes: Array<{ url: string; lastmod?: string; changefreq?: string; priority?: number }>) => {
  const baseUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
  
  return routes.map(route => ({
    loc: `${baseUrl}${route.url}`,
    lastmod: route.lastmod || new Date().toISOString().split('T')[0],
    changefreq: route.changefreq || 'weekly',
    priority: route.priority || 0.5
  }));
};

/**
 * Track page performance for SEO insights
 */
export const trackPagePerformance = () => {
  if ('performance' in window) {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    const metrics = {
      fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      lcp: performance.getEntriesByName('largest-contentful-paint')[0]?.startTime || 0,
      fid: performance.getEntriesByName('first-input')[0]?.processingStart || 0,
      cls: 0 // Cumulative Layout Shift - would need additional library
    };
    
    // Send to analytics (implement based on your analytics solution)
    console.log('Page Performance Metrics:', metrics);
    
    return metrics;
  }
  return null;
};
