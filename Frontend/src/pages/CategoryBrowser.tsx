import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, TrendingUp, SlidersHorizontal, X } from 'lucide-react';
import ReviewCard from '../components/ReviewCard';
import AdvancedSearch from '../components/AdvancedSearch';
import { getReviews, getCategoriesWithSubcategories } from '../services/api';

// Define review type
interface Review {
  _id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
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
}

interface Category {
  id: number;
  name: string;
  slug: string;
  subcategories: string[];
}

const CategoryBrowser: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);

  // Fetch categories and reviews on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [reviewsData, categoriesData] = await Promise.all([
          getReviews(),
          getCategoriesWithSubcategories()
        ]);
        setReviews(reviewsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setReviews([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const handleAdvancedSearch = (filters: any) => {
    setAppliedFilters(filters);
    if (filters.category) {
      setSelectedCategory(filters.category);
      setSearchParams({ category: filters.category, ...(filters.subcategory && { subcategory: filters.subcategory }) });
    } else {
      setSelectedCategory('');
      setSelectedSubcategory('');
      setSearchParams({});
    }
    if (filters.query) {
      setSearchQuery(filters.query);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedSubcategory('');
    if (category) {
      setSearchParams({ category });
    } else {
      setSearchParams({});
    }
  };

  const handleSubcategoryChange = (subcategory: string) => {
    setSelectedSubcategory(subcategory);
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

  const filteredReviews = reviews.filter((review: Review) => {
    // Filter by search query
    const matchesQuery = searchQuery === '' || 
      review.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (review.companyName && review.companyName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filter by category
    const matchesCategory = !selectedCategory || review.category === selectedCategory;
    
    // Filter by subcategory
    const matchesSubcategory = !selectedSubcategory || review.subcategory === selectedSubcategory;
    
    return matchesQuery && matchesCategory && matchesSubcategory;
  });

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
                {loading ? 'Loading...' : `${filteredReviews.length} review${filteredReviews.length !== 1 ? 's' : ''}`}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading reviews...</h3>
            </div>
          ) : filteredReviews.length > 0 ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredReviews.map((review: Review) => (
                <ReviewCard key={review._id} review={review} />
              ))}
            </div>
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
    </div>
  );
};

export default CategoryBrowser;