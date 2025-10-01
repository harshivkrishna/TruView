import { useEffect } from 'react';

/**
 * Performance monitoring hook
 * Tracks and logs performance metrics using the Performance API
 */
export const usePerformanceMonitor = () => {
  useEffect(() => {
    // Wait for page to fully load
    if (typeof window === 'undefined') return;

    const reportPerformance = () => {
      // Get navigation timing
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (perfData) {
        const metrics = {
          // Time to First Byte
          ttfb: perfData.responseStart - perfData.requestStart,
          
          // DOM Content Loaded
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          
          // Full page load time
          loadTime: perfData.loadEventEnd - perfData.loadEventStart,
          
          // DOM Interactive (when DOM is ready)
          domInteractive: perfData.domInteractive - perfData.fetchStart,
          
          // Total page load
          totalLoadTime: perfData.loadEventEnd - perfData.fetchStart,
        };

        // Log to console in development
        if (import.meta.env.DEV) {
          console.log('⚡ Performance Metrics:', {
            'Time to First Byte': `${metrics.ttfb.toFixed(2)}ms`,
            'DOM Content Loaded': `${metrics.domContentLoaded.toFixed(2)}ms`,
            'DOM Interactive': `${metrics.domInteractive.toFixed(2)}ms`,
            'Total Load Time': `${metrics.totalLoadTime.toFixed(2)}ms`,
          });
        }

        // You can send these metrics to an analytics service
        // Example: sendToAnalytics(metrics);
      }

      // Get resource timing (optional - for detailed analysis)
      const resources = performance.getEntriesByType('resource');
      const slowResources = resources.filter((resource: any) => resource.duration > 1000);
      
      if (slowResources.length > 0 && import.meta.env.DEV) {
        console.warn('⚠️ Slow Resources (>1s):', slowResources.map((r: any) => ({
          name: r.name,
          duration: `${r.duration.toFixed(2)}ms`,
          type: r.initiatorType
        })));
      }
    };

    // Report after page load
    if (document.readyState === 'complete') {
      reportPerformance();
    } else {
      window.addEventListener('load', reportPerformance);
      return () => window.removeEventListener('load', reportPerformance);
    }
  }, []);
};

/**
 * Measure component render performance
 */
export const measureRender = (componentName: string) => {
  if (typeof window === 'undefined' || !import.meta.env.DEV) return;

  const startMark = `${componentName}-start`;
  const endMark = `${componentName}-end`;
  const measureName = `${componentName}-render`;

  performance.mark(startMark);

  return () => {
    performance.mark(endMark);
    performance.measure(measureName, startMark, endMark);
    
    const measure = performance.getEntriesByName(measureName)[0];
    if (measure) {
      console.log(`🎨 ${componentName} render time: ${measure.duration.toFixed(2)}ms`);
    }

    // Clean up marks
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(measureName);
  };
};

/**
 * Report Web Vitals (Core Web Vitals)
 */
export const reportWebVitals = () => {
  if (typeof window === 'undefined') return;

  // Largest Contentful Paint (LCP)
  const observeLCP = () => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      if (import.meta.env.DEV) {
        console.log('📊 LCP (Largest Contentful Paint):', `${lastEntry.startTime.toFixed(2)}ms`);
      }
    });

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // LCP not supported
    }
  };

  // First Input Delay (FID)
  const observeFID = () => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        const fid = entry.processingStart - entry.startTime;
        
        if (import.meta.env.DEV) {
          console.log('📊 FID (First Input Delay):', `${fid.toFixed(2)}ms`);
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      // FID not supported
    }
  };

  // Cumulative Layout Shift (CLS)
  const observeCLS = () => {
    let clsScore = 0;
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsScore += entry.value;
        }
      });

      if (import.meta.env.DEV) {
        console.log('📊 CLS (Cumulative Layout Shift):', clsScore.toFixed(4));
      }
    });

    try {
      observer.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // CLS not supported
    }
  };

  observeLCP();
  observeFID();
  observeCLS();
};
