import React, { useState, useEffect, useCallback } from 'react';
import { Users, FileText, Flag, TrendingUp, Search, Check, X, Eye, BarChart3, PieChart, Calendar, Activity, LogOut, Shield, EyeOff, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getAdminReviews, getAdminUsers, getAdminReports, handleReportAction, adminLogin } from '../services/api';
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
import { useNavigate, Link } from 'react-router-dom';
import { getCachedData, reviewCache } from '../utils/cache';
import { updateMetaTags } from '../utils/seo';

// Type assertions for Lucide icons to fix TypeScript compatibility
const UsersIcon = Users as React.ComponentType<any>;
const FileTextIcon = FileText as React.ComponentType<any>;
const FlagIcon = Flag as React.ComponentType<any>;
const TrendingUpIcon = TrendingUp as React.ComponentType<any>;
const SearchIcon = Search as React.ComponentType<any>;
const CheckIcon = Check as React.ComponentType<any>;
const XIcon = X as React.ComponentType<any>;
const EyeIcon = Eye as React.ComponentType<any>;
// KeyIcon removed - Admin Management tab removed
const BarChart3Icon = BarChart3 as React.ComponentType<any>;
const PieChartIcon = PieChart as React.ComponentType<any>;
const CalendarIcon = Calendar as React.ComponentType<any>;
const ActivityIcon = Activity as React.ComponentType<any>;
const LogOutIcon = LogOut as React.ComponentType<any>;
const FilterIcon = Filter as React.ComponentType<any>;

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
  const { currentUser, logout, updateCurrentUser } = useAuth();
  const navigate = useNavigate();
  
  // Admin login states (showAdminLogin not needed since we show form based on isAdmin)
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
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
  
  // PassKey management removed - Admin Management tab removed

  // Check if user is admin
  const isAdmin = currentUser?.role === 'admin' || (currentUser as any)?.isAdmin;

  // Admin login handler
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      const response = await adminLogin({ email: adminEmail, password: adminPassword });
      
      // Store token and user data
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Update auth context with the admin user data
      updateCurrentUser(response.user);
      
      toast.success('Admin login successful!');
      
      // Force a small delay to ensure state updates, then reload to show dashboard
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error: any) {
      console.error('Admin login error:', error);
      console.error('Error response:', error.response);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response?.status === 500) {
        errorMessage = 'Server error. Please check the backend logs.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoggingIn(false);
    }
  };


  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch reviews, users, and reports data using admin endpoints with caching
      const [reviewsData, usersData, reportsData] = await Promise.all([
        getCachedData(
          reviewCache,
          'admin-reviews',
          () => getAdminReviews()
        ),
        getCachedData(
          reviewCache,
          'admin-users',
          () => getAdminUsers()
        ),
        getCachedData(
          reviewCache,
          'admin-reports',
          () => getAdminReports()
        )
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
  }, []);

  // fetchPassKey removed - Admin Management tab removed

  useEffect(() => {
    if (currentUser) {
      // Update SEO meta tags
      updateMetaTags({
        title: 'Admin Dashboard - TruView',
        description: 'Admin dashboard for managing reviews, users, and reports on TruView platform.',
        keywords: 'admin dashboard, review management, user management, reports',
        canonical: `${window.location.origin}/admin`
      });

      fetchAdminData();
    }
  }, [currentUser, fetchAdminData]);

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
    
    const result = Object.keys(ratings).map(rating => ({
      rating: `${rating} Star`,
      count: ratings[parseInt(rating) as keyof typeof ratings],
      fill: rating === '5' ? '#10B981' : rating === '4' ? '#3B82F6' : rating === '3' ? '#F59E0B' : rating === '2' ? '#F97316' : '#EF4444'
    }));
    
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

  // handleUpdatePassKey removed - Admin Management tab removed

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    reportId: string | null;
    action: 'accept' | 'reject' | null;
    reportType: string;
  }>({
    isOpen: false,
    reportId: null,
    action: null,
    reportType: ''
  });

  const handleReportActionLocal = async (reportId: string, action: 'accept' | 'reject') => {
    // Find the report to get its type for the confirmation dialog
    const report = reports.find((r: any) => r._id === reportId) as any;
    const reportType = report?.type || report?.reason || 'report';
    
    setConfirmDialog({
      isOpen: true,
      reportId,
      action,
      reportType
    });
  };

  const confirmReportAction = async () => {
    if (!confirmDialog.reportId || !confirmDialog.action) return;
    
    try {
      toast.loading(`${confirmDialog.action === 'accept' ? 'Accepting' : 'Rejecting'} report...`);
      
      await handleReportAction(confirmDialog.reportId, confirmDialog.action);
      
      toast.dismiss();
      toast.success(`Report ${confirmDialog.action === 'accept' ? 'accepted' : 'rejected'} successfully!`);
      
      // Refresh data
      await fetchAdminData();
    } catch (error: any) {
      toast.dismiss();
      console.error('Report action error:', error);
      
      let errorMessage = `Failed to ${confirmDialog.action} report. Please try again.`;
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setConfirmDialog({
        isOpen: false,
        reportId: null,
        action: null,
        reportType: ''
      });
    }
  };

  const cancelReportAction = () => {
    setConfirmDialog({
      isOpen: false,
      reportId: null,
      action: null,
      reportType: ''
    });
  };


  // Show admin login form if not authenticated as admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-orange-500 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Admin Access
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              TruView Admin Dashboard
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <form className="space-y-6" onSubmit={handleAdminLogin}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  // placeholder="connect.truview@gmail.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 pr-10"
                    // placeholder="Admin@1009"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>


              <div>
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoggingIn ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign in as Admin'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/')}
                className="text-sm text-gray-600 hover:text-gray-500"
              >
                ← Back to Home
              </button>
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
    { id: 'reports', label: 'Reports', icon: FlagIcon }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">Manage reviews, users, and platform content</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              title="Logout from admin panel"
            >
              <LogOutIcon className="w-4 h-4" />
              Logout
            </button>
          </div>
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
                <p className="text-2xl font-bold text-gray-900">{stats.monthlyGrowth >= 0 ? '+' : ''}{stats.monthlyGrowth}%</p>
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
            </>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm {confirmDialog.action === 'accept' ? 'Accept' : 'Reject'} Report
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to {confirmDialog.action} this {confirmDialog.reportType} report? 
              {confirmDialog.action === 'accept' 
                ? ' This will mark the report as resolved and may result in content removal.'
                : ' This will dismiss the report without taking action.'
              }
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelReportAction}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmReportAction}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${
                  confirmDialog.action === 'accept'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {confirmDialog.action === 'accept' ? 'Accept Report' : 'Reject Report'}
              </button>
            </div>
          </div>
        </div>
      )}
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
              <p className="text-blue-100 text-xs mt-1">{stats.monthlyGrowth >= 0 ? '+' : ''}{stats.monthlyGrowth}% this month</p>
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
  const navigate = useNavigate();
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
                  {report.reportedBy ? (
                      <Link to={`/user/${report.reportedBy._id}`} className="text-blue-500 hover:underline">
                        {`${report.reportedBy.firstName} ${report.reportedBy.lastName}`}
                      </Link>
                    ) : (
                      'Anonymous'
                    )}
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
                        onClick={() => navigate(`/review/${report.review?._id}`)}
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

// AdminManagementTab component removed

export default AdminDashboard;