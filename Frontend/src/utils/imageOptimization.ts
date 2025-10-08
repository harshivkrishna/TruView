/**
 * Image Optimization Utilities
 * Handles lazy loading, compression, and responsive images
 */

interface ImageOptimizationConfig {
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  maxWidth?: number;
  maxHeight?: number;
  lazy?: boolean;
  placeholder?: string;
}

interface ResponsiveImageConfig {
  src: string;
  alt: string;
  sizes?: string;
  srcSet?: string;
  loading?: 'lazy' | 'eager';
  className?: string;
}

/**
 * Generate optimized image URL with parameters
 */
export const getOptimizedImageUrl = (
  originalUrl: string,
  config: ImageOptimizationConfig = {}
): string => {
  const {
    quality = 80,
    format = 'webp',
    maxWidth = 800,
    maxHeight = 600
  } = config;

  // If it's already an external URL, return as is
  if (originalUrl.startsWith('http')) {
    return originalUrl;
  }

  // For local images, you could implement image processing
  // For now, return the original URL
  return originalUrl;
};

/**
 * Generate responsive image srcSet
 */
export const generateSrcSet = (
  baseUrl: string,
  widths: number[] = [320, 640, 800, 1024, 1200]
): string => {
  return widths
    .map(width => `${getOptimizedImageUrl(baseUrl, { maxWidth: width })} ${width}w`)
    .join(', ');
};

/**
 * Create responsive image element
 */
export const createResponsiveImage = (config: ResponsiveImageConfig): HTMLImageElement => {
  const img = document.createElement('img');
  
  img.src = config.src;
  img.alt = config.alt;
  img.className = config.className || '';
  img.loading = config.loading || 'lazy';
  
  if (config.srcSet) {
    img.srcset = config.srcSet;
  }
  
  if (config.sizes) {
    img.sizes = config.sizes;
  }

  return img;
};

/**
 * Lazy load image with intersection observer
 */
export const lazyLoadImage = (
  img: HTMLImageElement,
  options: {
    rootMargin?: string;
    threshold?: number;
    placeholder?: string;
  } = {}
): void => {
  const {
    rootMargin = '50px',
    threshold = 0.1,
    placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+'
  } = options;

  // Set placeholder
  if (placeholder) {
    img.src = placeholder;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLImageElement;
          const dataSrc = target.dataset.src;
          
          if (dataSrc) {
            target.src = dataSrc;
            target.removeAttribute('data-src');
            
            // Add fade-in effect
            target.style.opacity = '0';
            target.style.transition = 'opacity 0.3s ease';
            
            target.onload = () => {
              target.style.opacity = '1';
            };
            
            target.onerror = () => {
              target.src = '/assets/placeholder-image.png';
              target.style.opacity = '1';
            };
          }
          
          observer.unobserve(target);
        }
      });
    },
    {
      rootMargin,
      threshold
    }
  );

  observer.observe(img);
};

/**
 * Preload critical images
 */
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Batch preload images
 */
export const preloadImages = async (urls: string[]): Promise<void[]> => {
  return Promise.allSettled(urls.map(preloadImage)).then(results => {
    const errors = results.filter(result => result.status === 'rejected');
    if (errors.length > 0) {
      console.warn(`Failed to preload ${errors.length} images`);
    }
    return results.map(result => 
      result.status === 'fulfilled' ? result.value : undefined
    ).filter(Boolean) as void[];
  });
};

/**
 * Generate image placeholder
 */
export const generatePlaceholder = (
  width: number,
  height: number,
  color: string = '#f3f4f6'
): string => {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color}"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="14" fill="#9ca3af">
        Loading...
      </text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

/**
 * Compress image client-side (for small images)
 */
export const compressImage = (
  file: File,
  quality: number = 0.8,
  maxWidth: number = 800,
  maxHeight: number = 600
): Promise<Blob> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => resolve(blob!),
        'image/jpeg',
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Get image dimensions
 */
export const getImageDimensions = (src: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Check if WebP is supported
 */
export const isWebPSupported = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

/**
 * Get optimal image format
 */
export const getOptimalImageFormat = async (): Promise<'webp' | 'jpeg'> => {
  const supportsWebP = await isWebPSupported();
  return supportsWebP ? 'webp' : 'jpeg';
};

/**
 * Image optimization hook for React components
 */
export const useImageOptimization = () => {
  const [isWebPSupported, setIsWebPSupported] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    isWebPSupported().then(setIsWebPSupported);
  }, []);

  const optimizeImage = useCallback(async (
    file: File,
    options: ImageOptimizationConfig = {}
  ) => {
    setIsLoading(true);
    
    try {
      const format = options.format || (await getOptimalImageFormat());
      const compressed = await compressImage(file, options.quality, options.maxWidth, options.maxHeight);
      
      setIsLoading(false);
      return compressed;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }, []);

  return {
    isWebPSupported,
    isLoading,
    optimizeImage
  };
};

export default {
  getOptimizedImageUrl,
  generateSrcSet,
  createResponsiveImage,
  lazyLoadImage,
  preloadImage,
  preloadImages,
  generatePlaceholder,
  compressImage,
  getImageDimensions,
  isWebPSupported,
  getOptimalImageFormat,
  useImageOptimization
};
