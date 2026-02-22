/**
 * Advanced Image Caching System
 * Implements browser cache, memory cache, and retry logic for images
 */

import React from 'react';

interface CachedImage {
  url: string;
  blob: Blob;
  timestamp: number;
  objectUrl: string;
}

class ImageCacheManager {
  private memoryCache: Map<string, CachedImage> = new Map();
  private loadingPromises: Map<string, Promise<string>> = new Map();
  private readonly MAX_CACHE_SIZE = 100; // Maximum number of images in memory
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Load image with caching and retry logic
   */
  async loadImage(url: string, retries = this.MAX_RETRIES): Promise<string> {
    // Check memory cache first
    const cached = this.memoryCache.get(url);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.objectUrl;
    }

    // Check if already loading
    const existingPromise = this.loadingPromises.get(url);
    if (existingPromise) {
      return existingPromise;
    }

    // For CloudFront/S3 images, just return the URL directly to avoid CORS issues
    // Browser will handle caching automatically
    if (url.includes('cloudfront.net') || url.includes('s3.amazonaws.com')) {
      return url;
    }

    // Create new loading promise for other images
    const loadPromise = this.fetchWithRetry(url, retries);
    this.loadingPromises.set(url, loadPromise);

    try {
      const objectUrl = await loadPromise;
      return objectUrl;
    } finally {
      this.loadingPromises.delete(url);
    }
  }

  /**
   * Fetch image with retry logic
   */
  private async fetchWithRetry(url: string, retries: number): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        // Add cache busting for retries
        const fetchUrl = attempt > 0 ? `${url}${url.includes('?') ? '&' : '?'}retry=${attempt}` : url;
        
        const response = await fetch(fetchUrl, {
          method: 'GET',
          cache: 'force-cache', // Use browser cache
          mode: 'cors',
          credentials: 'omit',
          headers: {
            'Accept': 'image/*'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);

        // Store in memory cache
        this.cacheImage(url, blob, objectUrl);

        return objectUrl;
      } catch (error) {
        lastError = error as Error;
        
        // Only log on final attempt to reduce console noise
        if (attempt === retries - 1) {
          console.error(`Failed to load image after ${retries} attempts:`, url, lastError);
        }

        // Wait before retry (exponential backoff)
        if (attempt < retries - 1) {
          await this.delay(this.RETRY_DELAY * Math.pow(2, attempt));
        }
      }
    }

    throw new Error(`Failed to load image after ${retries} attempts: ${lastError?.message}`);
  }

  /**
   * Cache image in memory
   */
  private cacheImage(url: string, blob: Blob, objectUrl: string): void {
    // Clean old cache if size limit reached
    if (this.memoryCache.size >= this.MAX_CACHE_SIZE) {
      this.cleanOldCache();
    }

    this.memoryCache.set(url, {
      url,
      blob,
      objectUrl,
      timestamp: Date.now()
    });
  }

  /**
   * Clean old cached images
   */
  private cleanOldCache(): void {
    const now = Date.now();
    const entriesToDelete: string[] = [];

    // Find expired entries
    for (const [url, cached] of this.memoryCache.entries()) {
      if (now - cached.timestamp > this.CACHE_DURATION) {
        URL.revokeObjectURL(cached.objectUrl);
        entriesToDelete.push(url);
      }
    }

    // Delete expired entries
    entriesToDelete.forEach(url => this.memoryCache.delete(url));

    // If still too large, delete oldest entries
    if (this.memoryCache.size >= this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.memoryCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toDelete = entries.slice(0, Math.floor(this.MAX_CACHE_SIZE / 4));
      toDelete.forEach(([url, cached]) => {
        URL.revokeObjectURL(cached.objectUrl);
        this.memoryCache.delete(url);
      });
    }
  }

  /**
   * Preload images
   */
  async preloadImages(urls: string[]): Promise<void> {
    const promises = urls.map(url => 
      this.loadImage(url).catch(error => {
        console.warn(`Failed to preload image ${url}:`, error);
        return null;
      })
    );

    await Promise.allSettled(promises);
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    for (const cached of this.memoryCache.values()) {
      URL.revokeObjectURL(cached.objectUrl);
    }
    this.memoryCache.clear();
    this.loadingPromises.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.memoryCache.size,
      maxSize: this.MAX_CACHE_SIZE,
      loading: this.loadingPromises.size
    };
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const imageCache = new ImageCacheManager();

/**
 * React hook for cached image loading
 */
export function useCachedImage(url: string | undefined) {
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    imageCache.loadImage(url)
      .then(objectUrl => {
        if (!cancelled) {
          setImageUrl(objectUrl);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return { imageUrl, loading, error };
}

/**
 * Preload images for better UX with priority loading
 * @param reviews - Array of reviews to preload images from
 * @param priorityCount - Number of images to load with high priority (default: 6)
 */
export async function preloadReviewImages(reviews: any[], priorityCount: number = 6): Promise<void> {
  const imageUrls: string[] = [];
  const videoUrls: string[] = [];
  
  reviews.forEach(review => {
    if (review.media && Array.isArray(review.media)) {
      review.media.forEach((media: any) => {
        if (media.type === 'image' && media.url) {
          imageUrls.push(media.url);
        } else if (media.type === 'video' && media.url) {
          videoUrls.push(media.url);
        }
      });
    }
  });

  if (imageUrls.length === 0 && videoUrls.length === 0) return;

  // Load priority images immediately (first visible items)
  const priorityImages = imageUrls.slice(0, priorityCount);
  const remainingImages = imageUrls.slice(priorityCount);

  // Load priority images first
  if (priorityImages.length > 0) {
    await Promise.allSettled(
      priorityImages.map(url => imageCache.loadImage(url).catch(() => null))
    );
  }

  // Load remaining images in background (don't await)
  if (remainingImages.length > 0) {
    imageCache.preloadImages(remainingImages).catch(() => {
      // Silent fail for background loading
    });
  }

  // Preload video thumbnails by creating hidden video elements
  videoUrls.slice(0, priorityCount).forEach(url => {
    const video = document.createElement('video');
    video.src = url;
    video.preload = 'metadata';
    video.style.display = 'none';
    document.body.appendChild(video);
    
    // Remove after loading
    video.addEventListener('loadeddata', () => {
      setTimeout(() => document.body.removeChild(video), 100);
    });
    video.addEventListener('error', () => {
      setTimeout(() => document.body.removeChild(video), 100);
    });
  });
}

export default imageCache;
