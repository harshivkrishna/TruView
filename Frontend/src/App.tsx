import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ReviewProvider } from './contexts/ReviewContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import TokenExpirationCheck from './components/TokenExpirationCheck';

// Lazy load pages for better performance and code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const ReviewSubmission = lazy(() => import('./pages/ReviewSubmission'));
const CategoryBrowser = lazy(() => import('./pages/CategoryBrowser'));
const ReviewDetail = lazy(() => import('./pages/ReviewDetail'));
const DiscoveryEngine = lazy(() => import('./pages/DiscoveryEngine'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const UserProfile = lazy(() => import('./pages/UserProfile'));

// Loading component for suspense fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ReviewProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/submit" element={
                  <ProtectedRoute>
                    <ReviewSubmission />
                  </ProtectedRoute>
                } />
                <Route path="/categories" element={<CategoryBrowser />} />
                <Route path="/review/:id" element={<ReviewDetail />} />
                <Route path="/discover" element={<DiscoveryEngine />} />
                <Route path="/profile/:userId" element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
              </Routes>
            </Suspense>
            <Toaster position="top-right" />
            <TokenExpirationCheck />
          </div>
        </Router>
      </ReviewProvider>
    </AuthProvider>
  );
};

export default App;