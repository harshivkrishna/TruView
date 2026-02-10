import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Star, Camera, Video, Play } from 'lucide-react';
import { createReview, uploadMedia, getCategoriesWithSubcategories } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import MediaCarousel from '../components/MediaCarousel';
import { getCachedData, reviewCache } from '../utils/cache';
import { updateMetaTags } from '../utils/seo';
import { compressImage } from '../utils/imageOptimization';
import toast from 'react-hot-toast';

interface Category {
  id: number;
  name: string;
  slug: string;
  subcategories: string[];
}

const ReviewSubmission = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    rating: 0,
    tags: [] as string[],
    authorName: ''
  });
  
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);

  const sentimentTags = ['Honest', 'Brutal', 'Fair', 'Rant', 'Praise', 'Caution', 'Warning', 'Recommended'];

  // Optimized categories fetching with caching
  const fetchCategories = useCallback(async () => {
    try {
      const categoriesData = await getCachedData(
        reviewCache,
        'categories-with-subcategories',
        () => getCategoriesWithSubcategories()
      );
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Handle error silently
    }
  }, []);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
    
    // Update SEO meta tags
    updateMetaTags({
      title: 'Submit a Review - TruView',
      description: 'Share your authentic review and help others make informed decisions. Submit your honest feedback about products and services.',
      keywords: 'submit review, write review, review submission, authentic review',
      canonical: `${window.location.origin}/submit-review`
    });
  }, [fetchCategories]);

  // Update available subcategories when category changes
  useEffect(() => {
    if (formData.category) {
      const selectedCategory = categories.find(cat => cat.name === formData.category);
      if (selectedCategory) {
        setAvailableSubcategories(selectedCategory.subcategories);
        // Reset subcategory if it's not available in the new category
        if (!selectedCategory.subcategories.includes(formData.subcategory)) {
          setFormData(prev => ({ ...prev, subcategory: '' }));
        }
      }
    } else {
      setAvailableSubcategories([]);
      setFormData(prev => ({ ...prev, subcategory: '' }));
    }
  }, [formData.category, categories]);

  // Set author name from current user when component mounts
  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        authorName: `${currentUser.firstName} ${currentUser.lastName}`
      }));
    }
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagToggle = (tag: string) => {
    setFormData(prev => {
      if (prev.tags.includes(tag)) {
        // Remove tag if already selected
        return {
          ...prev,
          tags: prev.tags.filter(t => t !== tag)
        };
      } else {
        // Add tag only if less than 2 tags are already selected
        if (prev.tags.length < 2) {
          return {
            ...prev,
            tags: [...prev.tags, tag]
          };
        }
        // If already 2 tags selected, don't add more
        return prev;
      }
    });
  };

  const handleRatingClick = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleFileUpload = useCallback(async (files: FileList) => {
    setUploadError('');
    
    // Validate file types and count
    const fileArray = Array.from(files);
    const images = fileArray.filter(file => file.type.startsWith('image/'));
    const videos = fileArray.filter(file => file.type.startsWith('video/'));
    
    // Check if trying to upload multiple videos
    if (videos.length > 1) {
      setUploadError('You can only upload one video at a time');
      return;
    }
    
    // Check if trying to upload video with existing video
    const existingVideos = uploadedFiles.filter(file => file.type === 'video');
    if (videos.length > 0 && existingVideos.length > 0) {
      setUploadError('You can only upload one video per review');
      return;
    }
    
    // Check total file count (max 5 images + 1 video)
    const existingImages = uploadedFiles.filter(file => file.type === 'image');
    if (existingImages.length + images.length > 5) {
      setUploadError('You can upload maximum 5 images');
      return;
    }

    try {
      const formData = new FormData();
      
      // Process images with compression
      for (const image of images) {
        try {
          const compressedImage = await compressImage(image, 0.8, 1200, 1200);
          formData.append('media', compressedImage, image.name);
        } catch (compressionError) {
          console.warn('Compression failed, using original image:', compressionError);
          formData.append('media', image);
        }
      }
      
      // Add videos as-is (no compression for videos)
      videos.forEach(video => {
        formData.append('media', video);
      });

      const result = await uploadMedia(formData);
      setUploadedFiles(prev => [...prev, ...result.files]);
    } catch (error) {
      console.error('Error uploading files:', error);
      setUploadError('Error uploading files. Please try again.');
    }
  }, [uploadedFiles]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.category || !formData.subcategory || !formData.rating) {
      toast.error('Please fill in all required fields', {
        duration: 3000,
        icon: '⚠️',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const reviewData = {
        ...formData,
        media: uploadedFiles
      };

      await createReview(reviewData);
      toast.success('Review submitted successfully!', {
        duration: 3000,
        icon: '✅',
      });
      navigate('/categories');
    } catch (error) {
      toast.error('Error submitting review. Please try again.', {
        duration: 4000,
        icon: '❌',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Share Your Experience</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Media Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Photos or Videos
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging ? 'border-orange-500 bg-orange-50' : 'border-gray-300'
                }`}
                onDrop={handleDrop}
                onDragOver={(e: React.DragEvent) => e.preventDefault()}
                onDragEnter={() => setIsDragging(true)}
                onDragLeave={() => setIsDragging(false)}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Drag and drop your files here, or{' '}
                  <button
                    type="button"
                    className="text-orange-500 hover:text-orange-600"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    browse
                  </button>
                </p>
                <p className="text-sm text-gray-500">
                  Supports: JPG, PNG, GIF, MP4, MOV (Max 50MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              
              {/* Uploaded Files Preview */}
              <div className="mt-4">
                <MediaCarousel 
                  files={uploadedFiles} 
                  onRemove={removeFile}
                  editable={true}
                />
              </div>
              
              {uploadError && (
                <div className="mt-2 text-red-600 text-sm">
                  {uploadError}
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Review Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Summarize your experience in one line"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Review *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Share your detailed experience, be honest and helpful"
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating *
              </label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => handleRatingClick(rating)}
                    className={`p-1 ${
                      formData.rating >= rating ? 'text-orange-500' : 'text-gray-300'
                    } hover:text-orange-500 transition-colors`}
                  >
                    <Star className="w-8 h-8 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.name} value={category.name}>{category.name}</option>
                ))}
              </select>
            </div>

            {/* Subcategory (conditional) */}
            {formData.category && (
              <div>
                <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategory *
                </label>
                <select
                  id="subcategory"
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a subcategory</option>
                  {availableSubcategories.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Sentiment Tags
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Choose up to 2 tags that best describe the sentiment of your review ({formData.tags.length}/2 selected)
              </p>
              {formData.tags.length >= 2 && (
                <p className="text-sm text-orange-600 mb-3">
                  ✓ Maximum tags selected. You can deselect a tag to choose a different one.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {sentimentTags.map(tag => {
                  const isSelected = formData.tags.includes(tag);
                  const isDisabled = !isSelected && formData.tags.length >= 2;
                  
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      disabled={isDisabled}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        isSelected
                          ? getTagStyle(tag, true)
                          : isDisabled
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : getTagStyle(tag, false)
                      }`}
                      title={isDisabled ? 'Maximum 2 tags allowed. Deselect a tag first.' : ''}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Author Name - Now auto-filled and read-only */}
            <div>
              <label htmlFor="authorName" className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                id="authorName"
                name="authorName"
                value={formData.authorName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50"
                readOnly
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">
                Your name is automatically filled from your profile
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-orange-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

  const getTagStyle = (tag: string, isSelected: boolean) => {
    const styles: Record<string, string> = {
      'Honest': isSelected ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200',
      'Brutal': isSelected ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200',
      'Fair': isSelected ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200',
      'Rant': isSelected ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-200',
      'Praise': isSelected ? 'bg-yellow-500 text-white' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
      'Caution': isSelected ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-700 hover:bg-orange-200',
      'Warning': isSelected ? 'bg-red-600 text-white' : 'bg-red-200 text-red-800 hover:bg-red-300',
      'Recommended': isSelected ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
    };
    return styles[tag] || (isSelected ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200');
  };

export default ReviewSubmission;