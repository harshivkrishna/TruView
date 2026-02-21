import React, { useState, useEffect } from 'react';

interface CachedImageProps {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean;
}

/**
 * Optimized image component with error handling and retry logic
 */
const CachedImage: React.FC<CachedImageProps> = ({
  src,
  alt,
  className = '',
  onLoad,
  onError,
  priority = false
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [imageSrc, setImageSrc] = useState(src);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    
    // Add retry parameter to URL if retrying
    if (retryCount > 0) {
      const separator = src.includes('?') ? '&' : '?';
      setImageSrc(`${src}${separator}retry=${retryCount}&t=${Date.now()}`);
    } else {
      setImageSrc(src);
    }
  }, [src, retryCount]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    // For CORS errors, try adding timestamp to bypass cache
    if (retryCount === 0) {
      setTimeout(() => {
        setRetryCount(1);
      }, 500);
    } else if (retryCount < 2) {
      // Retry with different approach
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 1000 * (retryCount + 1));
    } else {
      setIsLoading(false);
      setHasError(true);
      onError?.();
    }
  };

  const handleManualRetry = () => {
    setRetryCount(0);
    setHasError(false);
    setIsLoading(true);
  };

  if (hasError) {
    return (
      <div className={`${className} bg-gray-100 flex flex-col items-center justify-center`}>
        <div className="text-center p-4">
          <svg
            className="w-12 h-12 mx-auto mb-2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm text-gray-500 mb-2">Image unavailable</p>
          <button
            onClick={handleManualRetry}
            className="text-xs text-orange-500 hover:text-orange-600 font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} relative`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <img
        src={imageSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        crossOrigin="anonymous"
      />
    </div>
  );
};

export default CachedImage;
