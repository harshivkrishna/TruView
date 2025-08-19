import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ReviewProvider } from './contexts/ReviewContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import TokenExpirationCheck from './components/TokenExpirationCheck';

// Regular imports instead of lazy loading
import HomePage from './pages/HomePage';
import ReviewSubmission from './pages/ReviewSubmission';
import CategoryBrowser from './pages/CategoryBrowser';
import ReviewDetail from './pages/ReviewDetail';
import DiscoveryEngine from './pages/DiscoveryEngine';
import AdminDashboard from './pages/AdminDashboard';
import UserProfile from './pages/UserProfile';


const App: React.FC = () => {
  console.log('App component rendering, current path:', window.location.pathname);
  
  return (
    <AuthProvider>
      <ReviewProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
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
            <Toaster position="top-right" />
            <TokenExpirationCheck />
          </div>
        </Router>
      </ReviewProvider>
    </AuthProvider>
  );
};

export default App;