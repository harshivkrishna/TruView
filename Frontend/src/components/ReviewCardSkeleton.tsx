import React from 'react';

const ReviewCardSkeleton: React.FC = React.memo(() => {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-full min-h-[600px] animate-pulse">
      {/* Tags Section Skeleton */}
      <div className="p-6 py-5 bg-gray-50 border-b border-gray-200 min-h-[80px]">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
          <div className="h-6 bg-gray-200 rounded-full w-24 ml-auto"></div>
        </div>
      </div>

      {/* Media Section Skeleton */}
      <div className="h-48 bg-gray-200"></div>

      {/* Content Section Skeleton */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Title Skeleton */}
        <div className="mb-3 h-[56px]">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </div>

        {/* Rating Skeleton */}
        <div className="flex items-center mb-3">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-4 h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-4 bg-gray-200 rounded w-12 ml-2"></div>
        </div>

        {/* Description Skeleton */}
        <div className="mb-6 space-y-2 h-[90px]">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>

        {/* Footer Skeleton */}
        <div className="mt-auto space-y-4">
          {/* Author Info Skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full mr-3"></div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>

          {/* Stats Skeleton */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="h-4 bg-gray-200 rounded w-8"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="h-4 bg-gray-200 rounded w-8"></div>
              </div>
            </div>
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
});

ReviewCardSkeleton.displayName = 'ReviewCardSkeleton';

export default ReviewCardSkeleton; 