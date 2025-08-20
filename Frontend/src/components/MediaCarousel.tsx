import React, { useState, useRef, useEffect } from 'react';
import { X, Play, ChevronLeft, ChevronRight, Image, AlertCircle } from 'lucide-react';

interface MediaFile {
  type: 'image' | 'video';
  url: string;
  filename: string;
  originalUrl?: string; // Fallback URL
}

interface MediaCarouselProps {
  files: MediaFile[];
  onRemove?: (index: number) => void;
  editable?: boolean;
  autoPlay?: boolean;
}

const MediaCarousel: React.FC<MediaCarouselProps> = ({ 
  files, 
  onRemove, 
  editable = false,
  autoPlay = false 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const carouselRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentIndex < files.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleVideoPlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const scrollToIndex = (index: number) => {
    setCurrentIndex(index);
    if (carouselRef.current) {
      const scrollLeft = index * carouselRef.current.offsetWidth;
      carouselRef.current.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const handleImageError = (index: number, url: string) => {
    setFailedImages(prev => new Set(prev).add(index));
  };

  const handleImageLoad = (index: number, url: string) => {
    setFailedImages(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  };

  useEffect(() => {
    // Only run scroll effect if we have files and a valid index
    if (files.length > 0 && currentIndex < files.length) {
      scrollToIndex(currentIndex);
    }
  }, [currentIndex, files.length]);

  // Early return check must come AFTER hooks
  if (files.length === 0) {
    return (
      <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500 text-sm">No media files uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Main Carousel */}
      <div 
        ref={carouselRef}
        className="relative w-full h-96 md:h-[500px] overflow-hidden rounded-lg bg-gray-100"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {files.map((file, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
              index === currentIndex ? 'translate-x-0' : 'translate-x-full'
            }`}
            style={{
              transform: index === currentIndex ? 'translateX(0)' : 'translateX(100%)'
            }}
          >
              {file.type === 'video' ? (
                <div className="relative w-full h-full bg-black flex items-center justify-center">
                  <video
                    ref={index === currentIndex ? videoRef : null}
                    src={file.url}
                    className="max-w-full max-h-full object-contain"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                    controls={false}
                    preload="metadata"
                  />
                  {!isPlaying && (
                    <button
                      onClick={handleVideoPlay}
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-40 transition-all"
                    >
                      <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all">
                        <Play className="w-8 h-8 text-gray-800 ml-1" />
                      </div>
                    </button>
                  )}
                  {isPlaying && (
                    <button
                      onClick={handleVideoPlay}
                      className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="relative w-full h-full bg-gray-100 flex items-center justify-center">
                  {file.type === 'image' ? (
                    <div className="relative w-full h-full">
                      {failedImages.has(index) ? (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <div className="text-center">
                            <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">Image failed to load</p>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={file.url}
                          alt={`Media ${index + 1}`}
                          className="w-full h-full object-cover object-center transition-transform duration-300 hover:scale-105"
                          style={{
                            minWidth: '100%',
                            minHeight: '100%',
                            maxWidth: 'none',
                            maxHeight: 'none',
                            objectPosition: 'center center'
                          }}
                          loading="lazy"
                          onError={(e) => {
                            handleImageError(index, file.url);
                          }}
                          onLoad={() => {
                            handleImageLoad(index, file.url);
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="relative w-full h-full bg-gray-100 flex items-center justify-center">
                      {failedImages.has(index) ? (
                        // Fallback for failed images
                        <div className="text-center text-gray-500">
                          <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm">Image failed to load</p>
                          {file.originalUrl && file.originalUrl !== file.url && (
                            <button
                              onClick={() => {
                                // Try original URL
                                const img = new window.Image();
                                img.onload = () => {
                                  setFailedImages(prev => {
                                    const newSet = new Set(prev);
                                    newSet.delete(index);
                                    return newSet;
                                  });
                                };
                                img.src = file.originalUrl!;
                              }}
                              className="mt-2 text-xs text-blue-500 hover:text-blue-600"
                            >
                              Try alternative URL
                            </button>
                          )}
                        </div>
                      ) : (
                        <img
                          src={file.url}
                          alt={`Media ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            handleImageError(index, file.url);
                          }}
                          onLoad={() => {
                            handleImageLoad(index, file.url);
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Remove button for editable mode */}
              {editable && onRemove && (
                <button
                  onClick={() => onRemove(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
          </div>
        ))}
      </div>

      {/* Thumbnail Navigation */}
      {files.length > 1 && (
        <div className="mt-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {files.map((file, index) => (
              <button
                key={index}
                onClick={() => scrollToIndex(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  currentIndex === index 
                    ? 'border-orange-500 ring-2 ring-orange-200' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {file.type === 'video' ? (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center relative">
                    <video
                      src={file.url}
                      className="w-full h-full object-cover"
                      preload="metadata"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="w-4 h-4 text-white" />
                    </div>
                  </div>
                ) : failedImages.has(index) ? (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <Image className="w-6 h-6 text-gray-400" />
                  </div>
                ) : (
                  <img
                    src={file.url}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      handleImageError(index, file.url);
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Media Counter */}
      {files.length > 1 && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-sm">
          {currentIndex + 1} / {files.length}
        </div>
      )}
    </div>
  );
};

export default MediaCarousel;