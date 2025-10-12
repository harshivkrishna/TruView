const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    console.log('Auth header:', authHeader ? 'Present' : 'Missing');
    console.log('Token:', token ? 'Present' : 'Missing');

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('Decoded token userId:', decoded.userId);
    
    // Handle hardcoded admin case
    if (decoded.userId === 'admin' && decoded.isAdmin) {
      console.log('Hardcoded admin access granted');
      req.user = decoded;
      req.userProfile = {
        _id: 'admin',
        email: 'connect.truview@gmail.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
      };
      return next();
    }
    
    // Regular user authentication
    const user = await User.findById(decoded.userId);
    console.log('Found user:', user ? `Yes (${user.email})` : 'No');
    
    if (!user) {
      console.error('User not found in database with ID:', decoded.userId);
      return res.status(404).json({ message: 'User not found. Please log in again.' });
    }
    
    req.user = decoded; // Store decoded token info
    req.userProfile = user; // Store full user profile
    return next();
  } catch (error) {
    console.error('Auth error:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please log in again.' });
    }
    return res.status(403).json({ message: 'Invalid token' });
  }
};

const isAdmin = (req, res, next) => {
  // console.log('Checking admin access for user:', req.userProfile);
  // console.log('User role:', req.userProfile.role);
  
  if (req.userProfile.role !== 'admin') {
    // console.log('Access denied - user is not admin');
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  // console.log('Admin access granted');
  next();
};

module.exports = { authenticateToken, isAdmin };