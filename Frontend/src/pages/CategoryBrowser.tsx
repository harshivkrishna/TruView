import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Filter, X, ArrowUp } from 'lucide-react';
import ReviewCard from '../components/ReviewCard';
import ReviewCardSkeleton from '../components/ReviewCardSkeleton';
import AdvancedSearch from '../components/AdvancedSearch';
import Footer from '../components/Footer';
import { getReviews, getCategoriesWithSubcategories } from '../services/api';
import { getCachedData, reviewCache } from '../utils/cache';
import { updateMetaTags, generateCategoryStructuredData, addStructuredData } from '../utils/seo';
import { useAuth } from '../contexts/AuthContext';
import { lazyLoadImage } from '../utils/imageOptimization';

// Define review type
interface Review {
  _id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  rating: number;
  tags: string[];
  media?: Array<{
    type: 'image' | 'video';
    url: string;
    filename: string;
  }>;
  author?: {
    name: string;
    avatar?: string;
    userId?: string;
  };
  upvotes: number;
  views: number;
  createdAt: string;
  trustScore?: number;
  companyName?: string;
  originalLanguage?: string;
  translations?: Record<string, string>;
  titleTranslations?: Record<string, string>;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  subcategories: string[];
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalReviews: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface AdvancedFilters {
  query?: string;
  category?: string;
  subcategory?: string;
  rating?: string;
  dateRange?: string;
  tags?: string[];
  location?: string;
  companyName?: string;
  sortBy?: string;
}

const CategoryBrowser: React.FC = () => {
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<AdvancedFilters>({});
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalReviews: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastReviewRef = useRef<HTMLDivElement | null>(null);

  // Fetch categories and initial reviews on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [categoriesData] = await Promise.all([
          getCategoriesWithSubcategories()
        ]);
        setCategories(categoriesData);

        // Fetch initial reviews
        await fetchReviews(1, true);
      } catch (error) {
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch reviews function with caching
  const fetchReviews = useCallback(async (page: number, reset: boolean = false) => {
    try {
      setLoadingMore(true);

      const queryParams: any = { page, limit: 15 };

      // Apply basic filters
      if (selectedCategory) queryParams.category = selectedCategory;
      if (selectedSubcategory) queryParams.subcategory = selectedSubcategory;
      if (searchQuery) queryParams.query = searchQuery;

      // Apply advanced filters
      if (appliedFilters && Object.keys(appliedFilters).length > 0) {
        if (appliedFilters.rating) queryParams.rating = appliedFilters.rating;
        if (appliedFilters.dateRange) queryParams.dateRange = appliedFilters.dateRange;
        if (appliedFilters.tags && appliedFilters.tags.length > 0) queryParams.tags = appliedFilters.tags.join(',');
        if (appliedFilters.location) queryParams.location = appliedFilters.location;
        if (appliedFilters.companyName) queryParams.companyName = appliedFilters.companyName;
        if (appliedFilters.sortBy) queryParams.sortBy = appliedFilters.sortBy;
      }

      // Create cache key based on query parameters
      const cacheKey = `reviews-${JSON.stringify(queryParams)}`;

      // Try to get from cache first
      const response = await getCachedData(
        reviewCache,
        cacheKey,
        () => getReviews(queryParams)
      );

      if (reset) {
        setReviews(response.reviews);
        setPagination(response.pagination);
      } else {
        setReviews(prev => [...prev, ...response.reviews]);
        setPagination(response.pagination);
      }

      setHasMore(response.pagination.hasNextPage);

      // Apply lazy loading to new images
      if (response.reviews.length > 0) {
        setTimeout(() => {
          const images = document.querySelectorAll('img[data-src]');
          images.forEach(img => lazyLoadImage(img as HTMLImageElement));
        }, 100);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      // Handle error silently
    } finally {
      setLoadingMore(false);
    }
  }, [selectedCategory, selectedSubcategory, searchQuery, appliedFilters]);

  // Read category and subcategory from URL query parameters on component mount
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    const subcategoryFromUrl = searchParams.get('subcategory');

    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
      setAppliedFilters({ category: categoryFromUrl });

      // Set subcategory if provided
      if (subcategoryFromUrl) {
        setSelectedSubcategory(subcategoryFromUrl);
        setAppliedFilters(prev => ({ ...prev, subcategory: subcategoryFromUrl }));
      }
    }
  }, [searchParams]);

  // Update SEO meta tags when category changes
  useEffect(() => {
    if (selectedCategory) {
      const category = categories.find(cat => cat.name === selectedCategory);
      if (category) {
        updateMetaTags({
          title: `${selectedCategory} Reviews - TruView`,
          description: `Browse authentic ${selectedCategory.toLowerCase()} reviews and ratings. Discover genuine feedback from real users.`,
          keywords: `${selectedCategory.toLowerCase()}, reviews, ratings, ${selectedCategory.toLowerCase()} reviews`,
          canonical: `${window.location.origin}/categories?category=${encodeURIComponent(selectedCategory)}`
        });

        // Add category structured data
        const categoryData = generateCategoryStructuredData({
          name: selectedCategory,
          description: `Browse authentic ${selectedCategory.toLowerCase()} reviews and ratings`,
          slug: selectedCategory.toLowerCase().replace(/\s+/g, '-')
        });
        addStructuredData(categoryData);
      }
    } else {
      updateMetaTags({
        title: 'Browse Reviews by Category - TruView',
        description: 'Explore authentic reviews and ratings across all categories. Find genuine feedback for products and services.',
        keywords: 'reviews, ratings, categories, browse reviews, authentic reviews',
        canonical: `${window.location.origin}/categories`
      });
    }
  }, [selectedCategory, categories]);

  // Update available subcategories when category changes
  useEffect(() => {
    if (selectedCategory) {
      const category = categories.find(cat => cat.name === selectedCategory);
      if (category) {
        setAvailableSubcategories(category.subcategories);
        // Reset subcategory if it's not available in the new category
        if (!category.subcategories.includes(selectedSubcategory)) {
          setSelectedSubcategory('');
          setAppliedFilters(prev => ({ ...prev, subcategory: '' }));
        }
      }
    } else {
      setAvailableSubcategories([]);
      setSelectedSubcategory('');
      setAppliedFilters(prev => ({ ...prev, subcategory: '' }));
    }
  }, [selectedCategory, categories, selectedSubcategory]);

  // Refetch reviews when filters change
  useEffect(() => {
    if (!loading) {
      fetchReviews(1, true);
    }
  }, [selectedCategory, selectedSubcategory, searchQuery, appliedFilters, fetchReviews, loading]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (loading || loadingMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchReviews(pagination.currentPage + 1, false);
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current = observer;

    if (lastReviewRef.current) {
      observer.observe(lastReviewRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, loadingMore, hasMore, pagination.currentPage, fetchReviews]);

  // Show/hide scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdvancedSearch = (filters: AdvancedFilters) => {
    setAppliedFilters(filters);

    // Update basic filter states
    if (filters.category) {
      setSelectedCategory(filters.category);
    } else {
      setSelectedCategory('');
    }

    if (filters.subcategory) {
      setSelectedSubcategory(filters.subcategory);
    } else {
      setSelectedSubcategory('');
    }

    if (filters.query) {
      setSearchQuery(filters.query);
    } else {
      setSearchQuery('');
    }

    // Update URL params for category and subcategory
    if (filters.category) {
      setSearchParams({
        category: filters.category,
        ...(filters.subcategory && { subcategory: filters.subcategory })
      });
    } else {
      setSearchParams({});
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedSubcategory('');
    // Clear advanced filters when changing basic filters
    setAppliedFilters({ category });
    if (category) {
      setSearchParams({ category });
    } else {
      setSearchParams({});
    }
  };

  const handleSubcategoryChange = (subcategory: string) => {
    setSelectedSubcategory(subcategory);
    // Update advanced filters when changing subcategory
    setAppliedFilters({ category: selectedCategory, subcategory });
    if (subcategory) {
      setSearchParams({ category: selectedCategory, subcategory });
    } else {
      setSearchParams({ category: selectedCategory });
    }
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedSubcategory('');
    setSearchQuery('');
    setSearchParams({});
    setAppliedFilters({});
  };

  // Render skeleton loaders
  const renderSkeletons = (count: number) => {
    return Array.from({ length: count }, (_, index) => (
      <div key={`skeleton-${index}`} className="p-1">
        <ReviewCardSkeleton />
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Browse Reviews</h1>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowAdvancedSearch(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Advanced
            </button>
            <Link
              to="/submit"
              className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors whitespace-nowrap"
            >
              Write Review
            </Link>
          </div>
        </div>

        {/* Category and Subcategory Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Category Filter */}
            <div className="flex-1 min-w-48">
              <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory Filter - Only show when category is selected */}
            {selectedCategory && (
              <div className="flex-1 min-w-48">
                <label htmlFor="subcategory-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategory
                </label>
                <select
                  id="subcategory-filter"
                  value={selectedSubcategory}
                  onChange={(e) => handleSubcategoryChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">All Subcategories</option>
                  {availableSubcategories.map(subcategory => (
                    <option key={subcategory} value={subcategory}>
                      {subcategory}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Clear Filters Button */}
            {(selectedCategory || selectedSubcategory || searchQuery) && (
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Show active filters if present */}
        {(selectedCategory || selectedSubcategory) && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {selectedCategory && (
                <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-800 px-4 py-2 rounded-full">
                  <Filter className="w-4 h-4" />
                  <span className="font-medium">Category: {selectedCategory}</span>
                  <button
                    onClick={() => handleCategoryChange('')}
                    className="text-orange-600 hover:text-orange-800 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {selectedSubcategory && (
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-800 px-4 py-2 rounded-full">
                  <Filter className="w-4 h-4" />
                  <span className="font-medium">Subcategory: {selectedSubcategory}</span>
                  <button
                    onClick={() => handleSubcategoryChange('')}
                    className="text-blue-600 hover:text-blue-800 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="w-full">
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedSubcategory
                  ? `${selectedSubcategory} Reviews`
                  : selectedCategory
                    ? `${selectedCategory} Reviews`
                    : 'All Reviews'
                }
              </h2>
              <span className="text-gray-600">
                {loading ? 'Loading...' : `${pagination.totalReviews} review${pagination.totalReviews !== 1 ? 's' : ''}`}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {renderSkeletons(15)}
            </div>
          ) : reviews.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {reviews.map((review: Review) => (
                  <ReviewCard
                    key={review._id}
                    review={review}
                    currentUserId={currentUser?.id}
                  />
                ))}
              </div>

              {/* Loading More Indicator */}
              {loadingMore && (
                <div className="col-span-full mt-8">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Loading more reviews...</h3>
                  </div>
                </div>
              )}



              {/* Intersection Observer Target */}
              {hasMore && (
                <div
                  ref={lastReviewRef}
                  className="col-span-full h-10 flex items-center justify-center"
                >
                  <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || selectedCategory
                  ? 'Try adjusting your search or category filter.'
                  : 'Be the first to share a review!'
                }
              </p>
              <Link
                to="/submit"
                className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors inline-block"
              >
                Write First Review
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Search Modal */}
      {showAdvancedSearch && (
        <AdvancedSearch
          onSearch={handleAdvancedSearch}
          onClose={() => setShowAdvancedSearch(false)}
          initialFilters={selectedCategory ? { category: selectedCategory } : {}}
        />
      )}

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-4 z-50 bg-orange-500 text-white p-3 rounded-full shadow-lg hover:bg-orange-600 transition-colors"
          title="Scroll to top"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      )}

      <Footer />
    </div>
  );
};

export default CategoryBrowser;