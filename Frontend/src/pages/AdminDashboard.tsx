import React, { useState, useEffect } from 'react';
import { Users, FileText, Flag, TrendingUp, Search, Filter, Check, X, Eye, Key, BarChart3, PieChart, Calendar, Activity } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getPassKey, updatePassKey, getAdminReviews, getAdminUsers, getAdminReports, handleReportAction } from '../services/api';
import toast from 'react-hot-toast';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useNavigate } from 'react-router-dom';

// Type assertions for Lucide icons to fix TypeScript compatibility
const UsersIcon = Users as React.ComponentType<any>;
const FileTextIcon = FileText as React.ComponentType<any>;
const FlagIcon = Flag as React.ComponentType<any>;
const TrendingUpIcon = TrendingUp as React.ComponentType<any>;
const SearchIcon = Search as React.ComponentType<any>;
const FilterIcon = Filter as React.ComponentType<any>;
const CheckIcon = Check as React.ComponentType<any>;
const XIcon = X as React.ComponentType<any>;
const EyeIcon = Eye as React.ComponentType<any>;
const KeyIcon = Key as React.ComponentType<any>;
const BarChart3Icon = BarChart3 as React.ComponentType<any>;
const PieChartIcon = PieChart as React.ComponentType<any>;
const CalendarIcon = Calendar as React.ComponentType<any>;
const ActivityIcon = Activity as React.ComponentType<any>;

// Type assertions for Recharts components to fix TypeScript compatibility
const ResponsiveContainerComponent = ResponsiveContainer as React.ComponentType<any>;
const AreaChartComponent = AreaChart as React.ComponentType<any>;
const BarChartComponent = BarChart as React.ComponentType<any>;
const XAxisComponent = XAxis as any;
const YAxisComponent = YAxis as any;
const RechartsPieChartComponent = RechartsPieChart as React.ComponentType<any>;
const CellComponent = Cell as any;
const LegendComponent = Legend as any;
const LineChartComponent = LineChart as React.ComponentType<any>;

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [reviews, setReviews] = useState([]);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalReviews: 0,
    pendingReports: 0,
    monthlyGrowth: 0,
    averageRating: 0
  });
  const [loading, setLoading] = useState(true);
  
  // Chart data states
  const [chartData, setChartData] = useState<{
    monthlyReviews: Array<{ month: string; reviews: number; target: number }>;
    categoryData: Array<{ name: string; value: number; color: string }>;
    userGrowth: Array<{ day: string; users: number }>;
    ratingDistribution: Array<{ rating: string; count: number; fill: string }>;
    activityData: Array<{ day: string; reviews: number; users: number; total: number }>;
  }>({
    monthlyReviews: [],
    categoryData: [],
    userGrowth: [],
    ratingDistribution: [],
    activityData: []
  });
  
  // Time period state
  const [timePeriod, setTimePeriod] = useState('30'); // days
  
  // PassKey management
  const [passKey, setPassKey] = useState('');
  const [newPassKey, setNewPassKey] = useState('');
  const [showPassKeyForm, setShowPassKeyForm] = useState(false);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Fetch reviews, users, and reports data using admin endpoints
      const [reviewsData, usersData, reportsData] = await Promise.all([
        getAdminReviews(),
        getAdminUsers(),
        getAdminReports()
      ]);
      
      setReviews(reviewsData);
      setUsers(usersData);
      setReports(reportsData);
      
      // Process chart data
      processChartData(reviewsData, usersData);
      
      // Calculate initial stats
      const averageRating = reviewsData.length > 0 
        ? (reviewsData.reduce((sum: number, review: any) => sum + (review.rating || 0), 0) / reviewsData.length).toFixed(1)
        : 0;
      
      const currentMonth = new Date().getMonth();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const currentMonthUsers = usersData.filter((user: any) => {
        if (!user.createdAt) return false;
        const userDate = new Date(user.createdAt);
        return userDate.getMonth() === currentMonth;
      }).length;
      const lastMonthUsers = usersData.filter((user: any) => {
        if (!user.createdAt) return false;
        const userDate = new Date(user.createdAt);
        return userDate.getMonth() === lastMonth;
      }).length;
      
      const monthlyGrowth = lastMonthUsers > 0 
        ? Math.round(((currentMonthUsers - lastMonthUsers) / lastMonthUsers) * 100)
        : currentMonthUsers > 0 ? 100 : 0;
      
      setStats({
        totalUsers: usersData.length || 0,
        totalReviews: reviewsData.length || 0,
        pendingReports: reportsData.filter((report: any) => report.status === 'pending').length || 0,
        monthlyGrowth,
        averageRating: parseFloat(averageRating.toString())
      });
      
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPassKey = async () => {
    try {
      const response = await getPassKey();
      setPassKey(response.passKey || '');
    } catch (error) {
      console.error('Error fetching pass key:', error);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchAdminData();
      fetchPassKey();
    }
  }, [currentUser]);

  // Re-process chart data when time period changes
  useEffect(() => {
    if (reviews.length > 0 || users.length > 0) {
      processChartData(reviews, users);
      
      // Recalculate stats for the new time period
      const filteredReviewsForStats = filterDataByTimePeriod(reviews, parseInt(timePeriod));
      const filteredUsersForStats = filterDataByTimePeriod(users, parseInt(timePeriod));
      const filteredReportsForStats = filterDataByTimePeriod(reports, parseInt(timePeriod));
      
      const averageRating = filteredReviewsForStats.length > 0 
        ? (filteredReviewsForStats.reduce((sum: number, review: any) => sum + (review.rating || 0), 0) / filteredReviewsForStats.length).toFixed(1)
        : 0;
      
      const currentMonth = new Date().getMonth();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const currentMonthUsers = filteredUsersForStats.filter(user => {
        if (!user.createdAt) return false;
        const userDate = new Date(user.createdAt);
        return userDate.getMonth() === currentMonth;
      }).length;
      const lastMonthUsers = filteredUsersForStats.filter(user => {
        if (!user.createdAt) return false;
        const userDate = new Date(user.createdAt);
        return userDate.getMonth() === lastMonth;
      }).length;
      
      const monthlyGrowth = lastMonthUsers > 0 
        ? Math.round(((currentMonthUsers - lastMonthUsers) / lastMonthUsers) * 100)
        : currentMonthUsers > 0 ? 100 : 0;
      
      setStats({
        totalUsers: filteredUsersForStats.length || 0,
        totalReviews: filteredReviewsForStats.length || 0,
        pendingReports: filteredReportsForStats.filter((report: any) => report.status === 'pending').length || 0,
        monthlyGrowth: monthlyGrowth,
        averageRating: parseFloat(averageRating.toString())
      });
    }
  }, [timePeriod, reviews, users, reports]);

  // Data processing functions for charts
  const processChartData = (reviewsData: any[], usersData: any[]) => {
    // Filter data based on selected time period
    const filteredReviews = filterDataByTimePeriod(reviewsData, parseInt(timePeriod));
    const filteredUsers = filterDataByTimePeriod(usersData, parseInt(timePeriod));
    
    // Monthly reviews data (adjusted for time period)
    const monthlyReviews = generateMonthlyData(filteredReviews, parseInt(timePeriod));
    
    // Category distribution (filtered)
    const categoryData = processCategoryData(filteredReviews);
    
    // User growth data (adjusted for time period)
    const userGrowth = generateUserGrowthData(filteredUsers, parseInt(timePeriod));
    
    // Rating distribution (filtered)
    const ratingDistribution = processRatingData(filteredReviews);
    
    // Activity data (adjusted for time period)
    const activityData = generateActivityData(filteredReviews, filteredUsers, parseInt(timePeriod));
    
    setChartData({
      monthlyReviews,
      categoryData,
      userGrowth,
      ratingDistribution,
      activityData
    });
  };

  // Filter data by time period
  const filterDataByTimePeriod = (data: any[], days: number) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return data.filter(item => {
      if (!item.createdAt) return false;
      const itemDate = new Date(item.createdAt);
      return itemDate >= cutoffDate;
    });
  };

  const generateMonthlyData = (reviews: any[], days: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    const data = [];
    
    // Determine how many months to show based on time period
    const monthsToShow = days <= 30 ? 3 : days <= 90 ? 6 : 12;
    
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = months[date.getMonth()];
      const reviewCount = reviews.filter(review => {
        if (!review.createdAt) return false;
        const reviewDate = new Date(review.createdAt);
        return reviewDate.getMonth() === date.getMonth() && 
               reviewDate.getFullYear() === date.getFullYear();
      }).length;
      
      data.push({
        month: monthName,
        reviews: reviewCount,
        target: Math.max(reviewCount + Math.floor(reviewCount * 0.2), reviewCount) // 20% growth target
      });
    }
    
    return data;
  };

  const processCategoryData = (reviews: any[]) => {
    const categories: { [key: string]: number } = {};
    
    // Only process real review data
    reviews.forEach(review => {
      const category = review.category || 'Uncategorized';
      categories[category] = (categories[category] || 0) + 1;
    });
    
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    
    // Return real data or empty array if no reviews
    return Object.keys(categories).length > 0 
      ? Object.keys(categories).map((category, index) => ({
          name: category,
          value: categories[category],
          color: colors[index % colors.length]
        }))
      : [];
  };

  const generateUserGrowthData = (users: any[], days: number) => {
    const currentDate = new Date();
    const data = [];
    
    // Determine data points based on time period
    const dataPoints = days <= 7 ? 7 : days <= 30 ? 15 : days <= 90 ? 30 : 60;
    const interval = Math.max(1, Math.floor(days / dataPoints));
    
    for (let i = dataPoints - 1; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - (i * interval));
      
      let dayName;
      if (days <= 7) {
        dayName = date.toLocaleDateString('en', { weekday: 'short' });
      } else if (days <= 30) {
        dayName = date.getDate().toString();
      } else {
        dayName = date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
      }
      
      // Count users for this date range
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + interval);
      
      const userCount = users.filter(user => {
        if (!user.createdAt) return false;
        const userDate = new Date(user.createdAt);
        return userDate >= startDate && userDate < endDate;
      }).length;
      
      data.push({
        day: dayName,
        users: userCount
      });
    }
    
    return data;
  };

  const processRatingData = (reviews: any[]) => {
    const ratings = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    // Only process real review ratings
    reviews.forEach(review => {
      const rating = Math.floor(review.rating || 0);
      if (rating >= 1 && rating <= 5) {
        ratings[rating as keyof typeof ratings]++;
      }
    });
    
    console.log('Processing rating data:', { reviews: reviews.length, ratings });
    
    const result = Object.keys(ratings).map(rating => ({
      rating: `${rating} Star`,
      count: ratings[parseInt(rating) as keyof typeof ratings],
      fill: rating === '5' ? '#10B981' : rating === '4' ? '#3B82F6' : rating === '3' ? '#F59E0B' : rating === '2' ? '#F97316' : '#EF4444'
    }));
    
    console.log('Rating data result:', result);
    return result;
  };

  const generateActivityData = (reviews: any[], users: any[], days: number) => {
    const currentDate = new Date();
    const data = [];
    
    // Determine data points based on time period
    const dataPoints = days <= 7 ? 7 : days <= 30 ? 15 : days <= 90 ? 30 : 60;
    const interval = Math.max(1, Math.floor(days / dataPoints));
    
    for (let i = dataPoints - 1; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - (i * interval));
      
      let dayName;
      if (days <= 7) {
        dayName = date.toLocaleDateString('en', { weekday: 'short' });
      } else if (days <= 30) {
        dayName = date.getDate().toString();
      } else {
        dayName = date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
      }
      
      // Count activity for this date range
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + interval);
      
      const reviewCount = reviews.filter(review => {
        if (!review.createdAt) return false;
        const reviewDate = new Date(review.createdAt);
        return reviewDate >= startDate && reviewDate < endDate;
      }).length;
      
      const userCount = users.filter(user => {
        if (!user.createdAt) return false;
        const userDate = new Date(user.createdAt);
        return userDate >= startDate && userDate < endDate;
      }).length;
      
      data.push({
        day: dayName,
        reviews: reviewCount,
        users: userCount,
        total: reviewCount + userCount
      });
    }
    
    return data;
  };

  const handleUpdatePassKey = async () => {
    try {
      await updatePassKey(newPassKey);
      setPassKey(newPassKey);
      setNewPassKey('');
      setShowPassKeyForm(false);
      toast.success('Registration PassKey updated successfully');
    } catch (error) {
      toast.error('Failed to update PassKey');
    }
  };

  const handleReportActionLocal = async (reportId: string, action: 'accept' | 'reject') => {
    try {
      await handleReportAction(reportId, action);
      fetchAdminData(); // Refresh data
    } catch (error) {
      console.error('Error handling report:', error);
    }
  };

  // Check if user should have admin access
  // Since PassKey validation happened during registration, allow access to any authenticated user on /admin route
  const hasAdminAccess = () => {
    // If user is authenticated and accessing /admin route, allow access
    // The PassKey validation already happened during registration
    // Also check if user has admin role
    return currentUser !== null && currentUser.role === 'admin';
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  if (!hasAdminAccess()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <div className="bg-white p-4 rounded-lg shadow-sm border max-w-md mx-auto">
            <p className="text-sm text-gray-600 mb-2">Current user info:</p>
            <p className="text-sm"><strong>Email:</strong> {currentUser.email}</p>
            <p className="text-sm"><strong>Role:</strong> {currentUser.role || 'undefined'}</p>
            <p className="text-sm"><strong>Name:</strong> {currentUser.firstName} {currentUser.lastName}</p>
            <p className="text-xs text-gray-500 mt-2 mb-4">
              Please ensure you registered with a valid admin PassKey.
            </p>
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-3">Need admin access?</p>
              <button
                onClick={() => navigate('/')}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm"
              >
                Go to Home & Register as Admin
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Use the Sign Up button and enter passkey: <code className="bg-gray-100 px-1 rounded">truviews</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUpIcon },
    { id: 'reviews', label: 'Reviews', icon: FileTextIcon },
    { id: 'users', label: 'Users', icon: UsersIcon },
    { id: 'reports', label: 'Reports', icon: FlagIcon },
    { id: 'admin', label: 'Admin Management', icon: KeyIcon }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage reviews, users, and platform content</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <UsersIcon className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <FileTextIcon className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalReviews}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <FlagIcon className="w-8 h-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Reports</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingReports}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <TrendingUpIcon className="w-8 h-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Growth</p>
                <p className="text-2xl font-bold text-gray-900">+{stats.monthlyGrowth}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading admin dashboard...</p>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && <OverviewTab stats={stats} chartData={chartData} timePeriod={timePeriod} setTimePeriod={setTimePeriod} />}
              {activeTab === 'reviews' && <ReviewsTab reviews={reviews} />}
              {activeTab === 'users' && <UsersTab users={users} currentUser={currentUser} />}
              {activeTab === 'reports' && <ReportsTab reports={reports} onAction={handleReportActionLocal} />}
              {activeTab === 'admin' && (
                <AdminManagementTab 
                  passKey={passKey}
                  newPassKey={newPassKey}
                  setNewPassKey={setNewPassKey}
                  showPassKeyForm={showPassKeyForm}
                  setShowPassKeyForm={setShowPassKeyForm}
                  onUpdatePassKey={handleUpdatePassKey}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const OverviewTab = ({ stats, chartData, timePeriod, setTimePeriod }: any) => {
  const handleTimePeriodChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTimePeriod(event.target.value);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h3>
          <p className="text-gray-600 mt-1">Comprehensive overview of platform performance</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <select 
            value={timePeriod}
            onChange={handleTimePeriodChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Users</p>
              <p className="text-3xl font-bold">{stats.totalUsers}</p>
              <p className="text-blue-100 text-xs mt-1">+{stats.monthlyGrowth}% this month</p>
            </div>
            <UsersIcon className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Reviews</p>
              <p className="text-3xl font-bold">{stats.totalReviews}</p>
              <p className="text-green-100 text-xs mt-1">Active submissions</p>
            </div>
            <FileTextIcon className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Pending Reports</p>
              <p className="text-3xl font-bold">{stats.pendingReports}</p>
              <p className="text-orange-100 text-xs mt-1">Requires attention</p>
            </div>
            <FlagIcon className="w-8 h-8 text-orange-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Avg Rating</p>
              <p className="text-3xl font-bold">{stats.averageRating || '0.0'}</p>
              <p className="text-purple-100 text-xs mt-1">Platform average</p>
            </div>
            <TrendingUpIcon className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Reviews Trend */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3Icon className="w-5 h-5 text-blue-600" />
            <h4 className="text-lg font-semibold text-gray-900">
              Reviews Trend ({timePeriod === '7' ? 'Last 7 days' : timePeriod === '30' ? 'Last 30 days' : timePeriod === '90' ? 'Last 90 days' : 'Last year'})
            </h4>
          </div>
          <div className="h-64">
            {chartData.monthlyReviews.some((item: any) => item.reviews > 0) ? (
              <ResponsiveContainerComponent width="100%" height="100%">
                <AreaChartComponent data={chartData.monthlyReviews}>
                  <defs>
                    <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxisComponent dataKey="month" stroke="#6B7280" fontSize={12} />
                  <YAxisComponent stroke="#6B7280" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '1px solid #e5e5e5',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="reviews" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorReviews)" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </AreaChartComponent>
              </ResponsiveContainerComponent>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <BarChart3Icon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No reviews yet</p>
                  <p className="text-gray-400 text-xs">Monthly trends will appear when reviews are submitted</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-5 h-5 text-green-600" />
            <h4 className="text-lg font-semibold text-gray-900">
              Category Distribution ({timePeriod === '7' ? 'Last 7 days' : timePeriod === '30' ? 'Last 30 days' : timePeriod === '90' ? 'Last 90 days' : 'Last year'})
            </h4>
          </div>
          <div className="h-64">
            {chartData.categoryData.length > 0 ? (
              <ResponsiveContainerComponent width="100%" height="100%">
                <RechartsPieChartComponent>
                  <Pie
                    data={chartData.categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.categoryData.map((entry: any, index: number) => (
                      <CellComponent key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '1px solid #e5e5e5',
                      borderRadius: '8px'
                    }}
                  />
                  <LegendComponent 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value: string) => <span className="text-sm">{value}</span>}
                  />
                </RechartsPieChartComponent>
              </ResponsiveContainerComponent>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <PieChartIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No categories yet</p>
                  <p className="text-gray-400 text-xs">Categories will appear when reviews are submitted</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Growth (Weekly) */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <ActivityIcon className="w-5 h-5 text-purple-600" />
            <h4 className="text-lg font-semibold text-gray-900">
              User Growth ({timePeriod === '7' ? 'Last 7 days' : timePeriod === '30' ? 'Last 30 days' : timePeriod === '90' ? 'Last 90 days' : 'Last year'})
            </h4>
          </div>
          <div className="h-64">
            {chartData.userGrowth.some((item: any) => item.users > 0) ? (
              <ResponsiveContainerComponent width="100%" height="100%">
                <LineChartComponent data={chartData.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxisComponent dataKey="day" stroke="#6B7280" fontSize={12} />
                  <YAxisComponent stroke="#6B7280" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '1px solid #e5e5e5',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#8B5CF6" 
                    strokeWidth={3}
                    dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#8B5CF6', strokeWidth: 2 }}
                  />
                </LineChartComponent>
              </ResponsiveContainerComponent>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <ActivityIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No user activity yet</p>
                  <p className="text-gray-400 text-xs">User growth trends will appear when users register</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUpIcon className="w-5 h-5 text-orange-600" />
            <h4 className="text-lg font-semibold text-gray-900">Rating Distribution</h4>
          </div>
          <div className="h-80">
            {chartData.ratingDistribution.some((item: any) => item.count > 0) ? (
              <ResponsiveContainerComponent width="100%" height="100%">
                <BarChartComponent data={chartData.ratingDistribution} margin={{ left: 30, right: 30, top: 30, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxisComponent type="category" dataKey="rating" stroke="#6B7280" fontSize={12} />
                  <YAxisComponent type="number" stroke="#6B7280" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '1px solid #e5e5e5',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={50} fill="#3B82F6" minPointSize={5}>
                    {chartData.ratingDistribution.map((entry: any, index: number) => (
                      <CellComponent key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChartComponent>
              </ResponsiveContainerComponent>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <TrendingUpIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No ratings yet</p>
                  <p className="text-gray-400 text-xs">Rating distribution will appear when reviews are submitted</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <CalendarIcon className="w-5 h-5 text-indigo-600" />
          <h4 className="text-lg font-semibold text-gray-900">Daily Activity Overview</h4>
        </div>
        <div className="h-64">
          {chartData.activityData.some((item: any) => item.total > 0) ? (
            <ResponsiveContainerComponent width="100%" height="100%">
              <AreaChartComponent data={chartData.activityData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorReviews2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxisComponent dataKey="day" stroke="#6B7280" fontSize={12} />
                <YAxisComponent stroke="#6B7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #e5e5e5',
                    borderRadius: '8px'
                  }}
                />
                <LegendComponent />
                <Area 
                  type="monotone" 
                  dataKey="reviews" 
                  stackId="1"
                  stroke="#3B82F6" 
                  fill="url(#colorReviews2)" 
                  name="Reviews"
                />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stackId="1"
                  stroke="#10B981" 
                  fill="url(#colorUsers)"
                  name="New Users"
                />
              </AreaChartComponent>
            </ResponsiveContainerComponent>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No activity yet</p>
                <p className="text-gray-400 text-xs">Daily activity will appear when users register and submit reviews</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ReviewsTab = ({ reviews }: any) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Get unique categories for filter
  const categories = [...new Set(reviews.map((review: any) => review.category).filter(Boolean))] as string[];
  const ratings = [1, 2, 3, 4, 5];

  // Filter and sort reviews
  const filteredReviews = reviews
    .filter((review: any) => {
      const matchesSearch = 
        review.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.author?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.category?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !selectedCategory || review.category === selectedCategory;
      const matchesRating = !selectedRating || review.rating === parseInt(selectedRating);
      
      return matchesSearch && matchesCategory && matchesRating;
    })
    .sort((a: any, b: any) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'createdAt') {
        aValue = new Date(a.createdAt || 0).getTime();
        bValue = new Date(b.createdAt || 0).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleViewReview = (reviewId: string) => {
    window.open(`/review/${reviewId}`, '_blank');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedRating('');
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  return (
  <div className="p-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          All Reviews ({filteredReviews.length} of {reviews.length})
        </h3>
        
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-full sm:w-64"
          />
        </div>
          
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          {/* Rating Filter */}
          <select
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Ratings</option>
            {ratings.map((rating) => (
              <option key={rating} value={rating}>{rating} Star{rating > 1 ? 's' : ''}</option>
            ))}
          </select>
          
          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split('-');
              setSortBy(newSortBy);
              setSortOrder(newSortOrder);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="rating-desc">Highest Rating</option>
            <option value="rating-asc">Lowest Rating</option>
            <option value="title-asc">Title A-Z</option>
            <option value="title-desc">Title Z-A</option>
          </select>
          
          {/* Clear Filters */}
          {(searchTerm || selectedCategory || selectedRating) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
        </button>
          )}
      </div>
    </div>
    
      {filteredReviews.length > 0 ? (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700 min-w-[900px]">
              <div className="col-span-3">Title</div>
              <div className="col-span-2">Author</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-1">Rating</div>
              <div className="col-span-2">Created</div>
              <div className="col-span-2">Actions</div>
          </div>
        </div>
          <div className="divide-y divide-gray-200 overflow-x-auto">
            <div className="min-w-[900px]">
              {filteredReviews.map((review: any, index: number) => (
            <div key={review._id || index} className="px-6 py-4 hover:bg-gray-50">
                  <div className="grid grid-cols-12 gap-4 items-center text-sm">
                    <div className="col-span-3 font-medium text-gray-900 truncate" title={review.title || 'Untitled Review'}>
                  {review.title || 'Untitled Review'}
                </div>
                    <div className="col-span-2 text-gray-600 truncate" title={review.author?.name || 'Anonymous'}>
                  {review.author?.name || 'Anonymous'}
                </div>
                    <div className="col-span-2 text-gray-600 truncate" title={review.category || 'Uncategorized'}>
                  {review.category || 'Uncategorized'}
                </div>
                    <div className="col-span-1 flex items-center gap-1">
                  <span className="text-orange-500">★</span>
                  <span>{review.rating || 0}/5</span>
                </div>
                    <div className="col-span-2 text-gray-600 text-xs">
                      {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className="col-span-2 flex gap-2">
                      <button 
                        onClick={() => handleViewReview(review._id)}
                        className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                        title="View review details"
                      >
                        View
                      </button>
                </div>
              </div>
            </div>
          ))}
            </div>
        </div>
      </div>
    ) : (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <FileTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || selectedCategory || selectedRating ? 'No Reviews Found' : 'No Reviews Yet'}
          </h4>
          <p className="text-gray-600">
            {searchTerm || selectedCategory || selectedRating 
              ? 'Try adjusting your search criteria or filters.'
              : 'Reviews will appear here once users start submitting them.'
            }
          </p>
          {(searchTerm || selectedCategory || selectedRating) && (
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Clear All Filters
            </button>
          )}
      </div>
    )}
  </div>
);
};

const UsersTab = ({ users, currentUser }: any) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Get unique roles for filter
  const roles = [...new Set(users.map((user: any) => user.role).filter(Boolean))] as string[];

  // Filter and sort users
  const filteredUsers = users
    .filter((user: any) => {
      const matchesSearch = 
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = !selectedRole || user.role === selectedRole;
      
      return matchesSearch && matchesRole;
    })
    .sort((a: any, b: any) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'createdAt') {
        aValue = new Date(a.createdAt || 0).getTime();
        bValue = new Date(b.createdAt || 0).getTime();
      } else if (sortBy === 'name') {
        aValue = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase();
        bValue = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedRole('');
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  return (
  <div className="p-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          All Users ({filteredUsers.length} of {users.length})
        </h3>
        
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-full sm:w-64"
          />
        </div>
          
          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Roles</option>
            {roles.map((role) => (
              <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
            ))}
          </select>
          
          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split('-');
              setSortBy(newSortBy);
              setSortOrder(newSortOrder);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="role-asc">Role A-Z</option>
            <option value="role-desc">Role Z-A</option>
          </select>
          
          {/* Clear Filters */}
          {(searchTerm || selectedRole) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
        </button>
          )}
      </div>
    </div>
    
      {filteredUsers.length > 0 ? (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700 min-w-[800px]">
              <div className="col-span-3">Name</div>
              <div className="col-span-4">Email</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-2">Joined</div>
              <div className="col-span-1">Actions</div>
          </div>
        </div>
          <div className="divide-y divide-gray-200 overflow-x-auto">
            <div className="min-w-[800px]">
              {filteredUsers.map((user: any, index: number) => (
            <div key={user._id || index} className="px-6 py-4 hover:bg-gray-50">
                  <div className="grid grid-cols-12 gap-4 items-center text-sm">
                    <div className="col-span-3 font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </div>
                    <div className="col-span-4 text-gray-600 truncate" title={user.email}>
                  {user.email}
                </div>
                    <div className="col-span-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role || 'user'}
                  </span>
                </div>
                    <div className="col-span-2 text-gray-600 text-xs">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </div>
                    <div className="col-span-1 flex gap-2">
                      {user.role !== 'admin' ? (
                        <button 
                          onClick={() => window.open(`/profile/${user._id}`, '_blank')}
                          className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                          title="View user profile"
                        >
                          View Profile
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">No actions</span>
                      )}
                </div>
              </div>
            </div>
          ))}
            </div>
        </div>
      </div>
    ) : (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || selectedRole ? 'No Users Found' : 'No Users Yet'}
          </h4>
          <p className="text-gray-600">
            {searchTerm || selectedRole 
              ? 'Try adjusting your search criteria or filters.'
              : 'Users will appear here once they register for accounts.'
            }
          </p>
          {(searchTerm || selectedRole) && (
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Clear All Filters
            </button>
          )}
      </div>
    )}
  </div>
);
};

const ReportsTab = ({ reports, onAction }: any) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Get unique statuses and types for filter
  const statuses = [...new Set(reports.map((report: any) => report.status).filter(Boolean))] as string[];
  const types = [...new Set(reports.map((report: any) => report.type || report.reason).filter(Boolean))] as string[];

  // Filter and sort reports
  const filteredReports = reports
    .filter((report: any) => {
      const matchesSearch = 
        report.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reporter?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.content?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !selectedStatus || report.status === selectedStatus;
      const matchesType = !selectedType || (report.type || report.reason) === selectedType;
      
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a: any, b: any) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'createdAt') {
        aValue = new Date(a.createdAt || 0).getTime();
        bValue = new Date(b.createdAt || 0).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('');
    setSelectedType('');
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  return (
  <div className="p-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          User Reports ({filteredReports.length} of {reports.length})
        </h3>
        
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-full sm:w-64"
          />
        </div>
          
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
            ))}
          </select>
          
          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Types</option>
            {types.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split('-');
              setSortBy(newSortBy);
              setSortOrder(newSortOrder);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="status-asc">Status A-Z</option>
            <option value="status-desc">Status Z-A</option>
            <option value="type-asc">Type A-Z</option>
            <option value="type-desc">Type Z-A</option>
          </select>
          
          {/* Clear Filters */}
          {(searchTerm || selectedStatus || selectedType) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
        </button>
          )}
      </div>
    </div>
    
      {filteredReports.length > 0 ? (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700 min-w-[1000px]">
              <div className="col-span-2">Report Type</div>
              <div className="col-span-4">Reported Content</div>
              <div className="col-span-2">Reporter</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2">Created</div>
              <div className="col-span-1">Actions</div>
          </div>
        </div>
          <div className="divide-y divide-gray-200 overflow-x-auto">
            <div className="min-w-[1000px]">
              {filteredReports.map((report: any, index: number) => (
            <div key={report._id || index} className="px-6 py-4 hover:bg-gray-50">
                  <div className="grid grid-cols-12 gap-4 items-center text-sm">
                    <div className="col-span-2 font-medium text-gray-900 truncate" title={report.type || report.reason || 'General Report'}>
                      {report.type || report.reason || 'General Report'}
                </div>
                    <div className="col-span-4 text-gray-600 truncate" title={report.content || report.description || 'No description'}>
                  {report.content || report.description || 'No description'}
                </div>
                    <div className="col-span-2 text-gray-600 truncate" title={report.reporter?.name || 'Anonymous'}>
                  {report.reporter?.name || 'Anonymous'}
                </div>
                    <div className="col-span-1">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    report.status === 'pending' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : report.status === 'resolved'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {report.status || 'pending'}
                  </span>
                </div>
                    <div className="col-span-2 text-gray-600 text-xs">
                      {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className="col-span-1 flex gap-2">
                  {report.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => onAction(report._id, 'accept')}
                            className="text-green-600 hover:text-green-800 hover:bg-green-50 p-1 rounded transition-colors"
                            title="Accept report"
                      >
                        <CheckIcon className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onAction(report._id, 'reject')}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded transition-colors"
                            title="Reject report"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </>
                  )}
                      <button 
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1 rounded transition-colors"
                        title="View report details"
                      >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
            </div>
        </div>
      </div>
    ) : (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <FlagIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || selectedStatus || selectedType ? 'No Reports Found' : 'No Reports Yet'}
          </h4>
          <p className="text-gray-600">
            {searchTerm || selectedStatus || selectedType 
              ? 'Try adjusting your search criteria or filters.'
              : 'User reports will appear here when submitted.'
            }
          </p>
          {(searchTerm || selectedStatus || selectedType) && (
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Clear All Filters
            </button>
          )}
      </div>
    )}
  </div>
);
};

const AdminManagementTab = ({ 
  passKey, 
  newPassKey, 
  setNewPassKey, 
  showPassKeyForm, 
  setShowPassKeyForm, 
  onUpdatePassKey
}: any) => (
  <div className="p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-6">Admin Management</h3>
    
    <div className="max-w-2xl mx-auto">
      {/* Registration PassKey Management */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <KeyIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900">Registration PassKey</h4>
            <p className="text-sm text-gray-600">Manage the PassKey required for admin registration</p>
          </div>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Current PassKey</label>
            <div className="flex items-center gap-3">
              <input
                type="password"
                value={passKey}
                readOnly
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-mono"
                placeholder="••••••••"
              />
              <button
                onClick={() => setShowPassKeyForm(!showPassKeyForm)}
                className={`px-4 py-3 text-white rounded-lg transition-colors ${
                  showPassKeyForm 
                    ? 'bg-gray-500 hover:bg-gray-600' 
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {showPassKeyForm ? 'Cancel' : 'Change'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              This PassKey is required when users register for admin accounts on the /admin route
            </p>
          </div>
          
          {showPassKeyForm && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New PassKey</label>
                  <input
                    type="text"
                    value={newPassKey}
                    onChange={(e) => setNewPassKey(e.target.value)}
                    placeholder="Enter new PassKey"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Choose a secure PassKey that will be required for future admin registrations
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={onUpdatePassKey}
                    disabled={!newPassKey.trim()}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Update PassKey
                  </button>
                  <button
                    onClick={() => {
                      setShowPassKeyForm(false);
                      setNewPassKey('');
                    }}
                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default AdminDashboard;