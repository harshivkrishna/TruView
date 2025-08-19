import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ArrowUp } from 'lucide-react';
import { getCategoriesWithSubcategories } from '../services/api';

interface Category {
  id: number;
  name: string;
  slug: string;
  subcategories: string[];
}

const Footer: React.FC = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await getCategoriesWithSubcategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

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



  // Get top 6 categories for footer display
  const topCategories = categories.slice(0, 6);

  return (
    <>
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  {/* Star icon removed as per new_code */}
                </div>
                <span className="text-xl font-bold">Truviews</span>
              </div>
              <p className="text-gray-400 mb-4">
                The platform for honest, unfiltered reviews. Share your real experiences and help others make better decisions.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  {/* Facebook icon removed as per new_code */}
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  {/* Twitter icon removed as per new_code */}
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  {/* Instagram icon removed as per new_code */}
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  {/* Linkedin icon removed as per new_code */}
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/categories" className="text-gray-400 hover:text-white transition-colors">
                    Browse Reviews
                  </Link>
                </li>
                <li>
                  <Link to="/discover" className="text-gray-400 hover:text-white transition-colors">
                    Discovery
                  </Link>
                </li>
                <li>
                  <Link to="/submit" className="text-gray-400 hover:text-white transition-colors">
                    Write Review
                  </Link>
                </li>
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Popular Categories</h3>
              <ul className="space-y-2">
                {topCategories.map(category => (
                  <li key={category.id}>
                    <Link 
                      to={`/categories?category=${category.name}`} 
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Mail className="w-4 h-4 mr-3 text-orange-500" />
                  <span className="text-gray-400">support@truviews.com</span>
                </li>
                <li className="flex items-center">
                  <Phone className="w-4 h-4 mr-3 text-orange-500" />
                  <span className="text-gray-400">+1 (555) 123-4567</span>
                </li>
                <li className="flex items-center">
                  <MapPin className="w-4 h-4 mr-3 text-orange-500" />
                  <span className="text-gray-400">San Francisco, CA</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-800 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400 text-sm mb-4 md:mb-0">
                © 2025 Truviews. All rights reserved.
              </div>
              <div className="flex space-x-6 text-sm">
                <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
                <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </Link>
                <Link to="/guidelines" className="text-gray-400 hover:text-white transition-colors">
                  Community Guidelines
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-110 z-50"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </>
  );
};

export default Footer;