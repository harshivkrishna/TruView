import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Star, Calendar, MapPin, RotateCcw, CheckCircle } from 'lucide-react';

interface AdvancedSearchProps {
  onSearch: (filters: any) => void;
  onClose: () => void;
  initialFilters?: any;
}

interface FilterState {
  query: string;
  category: string;
  rating: string;
  dateRange: string;
  tags: string[];
  location: string;
  companyName: string;
  sortBy: string;
}

const defaultFilters: FilterState = {
  query: '',
  category: '',
  rating: '',
  dateRange: '',
  tags: [],
  location: '',
  companyName: '',
  sortBy: 'relevance'
};

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ onSearch, onClose, initialFilters }) => {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [isDataRestored, setIsDataRestored] = useState(false);
  const [showRestoredMessage, setShowRestoredMessage] = useState(false);

  // Initialize filters with persisted values or initial filters
  useEffect(() => {
    const persistedFilters = localStorage.getItem('advancedSearchFilters');
    let hasPersistedData = false;
    
    if (persistedFilters) {
      try {
        const parsedFilters = JSON.parse(persistedFilters);
        // Check if there's actual data (not just default values)
        const hasData = Object.keys(parsedFilters).some(key => {
          if (key === 'tags') return parsedFilters[key].length > 0;
          if (key === 'sortBy') return parsedFilters[key] !== 'relevance';
          return parsedFilters[key] !== '' && parsedFilters[key] !== defaultFilters[key as keyof FilterState];
        });
        
        if (hasData) {
          setFilters(parsedFilters);
          setIsDataRestored(true);
          setShowRestoredMessage(true);
          // Hide the message after 3 seconds
          setTimeout(() => setShowRestoredMessage(false), 3000);
          hasPersistedData = true;
        }
      } catch (error) {
        console.error('Error parsing persisted filters:', error);
        localStorage.removeItem('advancedSearchFilters');
      }
    }
    
    // Only use initialFilters if no persisted data exists
    if (!hasPersistedData && initialFilters) {
      setFilters(prev => ({ ...prev, ...initialFilters }));
    }
  }, []); // Remove initialFilters dependency to prevent unnecessary re-runs

  // Save filters to localStorage whenever they change (but not on initial load)
  useEffect(() => {
    // Only save if the component has been mounted and filters are not default
    if (isDataRestored || filters !== defaultFilters) {
      localStorage.setItem('advancedSearchFilters', JSON.stringify(filters));
    }
  }, [filters, isDataRestored]);

  const categories = [
    'Technology', 'Food & Dining', 'Travel', 'Shopping', 'Entertainment',
    'Healthcare', 'Education', 'Services', 'Automotive', 'Home & Garden'
  ];

  const tags = ['Brutal', 'Honest', 'Praise', 'Rant', 'Warning', 'Recommended'];

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleTagToggle = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleSearch = () => {
    onSearch(filters);
    onClose();
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    setIsDataRestored(false);
    localStorage.removeItem('advancedSearchFilters');
  };

  const handleClose = () => {
    // Don't clear filters when closing, just close the modal
    onClose();
  };

  // Check if any filters are currently active
  const hasActiveFilters = Object.keys(filters).some(key => {
    if (key === 'tags') return filters[key as keyof FilterState].length > 0;
    if (key === 'sortBy') return filters[key as keyof FilterState] !== 'relevance';
    return filters[key as keyof FilterState] !== '' && filters[key as keyof FilterState] !== defaultFilters[key as keyof FilterState];
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">Advanced Search</h2>
            {hasActiveFilters && (
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                Filters Active
              </span>
            )}
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>



        <div className="space-y-6">
          {/* Search Query */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Keywords</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={filters.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Search in titles, descriptions, company names..."
              />
            </div>
          </div>

          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
            <input
              type="text"
              value={filters.companyName}
              onChange={(e) => handleFilterChange('companyName', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Enter company name"
            />
          </div>

          {/* Category and Rating */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Rating</label>
              <select
                value={filters.rating}
                onChange={(e) => handleFilterChange('rating', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Any Rating</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="2">2+ Stars</option>
                <option value="1">1+ Stars</option>
              </select>
            </div>
          </div>

          {/* Date Range and Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Any Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="City, State, Country"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filters.tags.includes(tag)
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="relevance">Relevance</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="rating-high">Highest Rating</option>
              <option value="rating-low">Lowest Rating</option>
              <option value="most-helpful">Most Helpful</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t">
            <button
              onClick={clearFilters}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                hasActiveFilters 
                  ? 'text-red-600 hover:text-red-800 hover:bg-red-50 border border-red-200' 
                  : 'text-gray-400 cursor-not-allowed'
              }`}
              disabled={!hasActiveFilters}
              title={hasActiveFilters ? 'Clear all search filters' : 'No active filters to clear'}
            >
              <RotateCcw className="w-4 h-4" />
              Clear All Filters
              {hasActiveFilters && (
                <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs font-medium">
                  {Object.keys(filters).filter(key => {
                    if (key === 'tags') return filters[key as keyof FilterState].length > 0;
                    if (key === 'sortBy') return filters[key as keyof FilterState] !== 'relevance';
                    return filters[key as keyof FilterState] !== '' && filters[key as keyof FilterState] !== defaultFilters[key as keyof FilterState];
                  }).length}
                </span>
              )}
            </button>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSearch}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                Apply Filters
                {hasActiveFilters && (
                  <span className="bg-orange-400 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                    {Object.keys(filters).filter(key => {
                      if (key === 'tags') return filters[key as keyof FilterState].length > 0;
                      if (key === 'sortBy') return filters[key as keyof FilterState] !== 'relevance';
                      return filters[key as keyof FilterState] !== '' && filters[key as keyof FilterState] !== defaultFilters[key as keyof FilterState];
                    }).length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearch;