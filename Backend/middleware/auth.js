const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    console.log('Auth header:', authHeader);
    console.log('Token:', token);

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('Decoded token:', decoded);
    
    const user = await User.findById(decoded.userId);
    console.log('Found user:', user);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    req.user = decoded; // Store decoded token info
    req.userProfile = user; // Store full user profile
    return next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(403).json({ message: 'Invalid token' });
  }
};

const isAdmin = (req, res, next) => {
  console.log('Checking admin access for user:', req.userProfile);
  console.log('User role:', req.userProfile.role);
  
  if (req.userProfile.role !== 'admin') {
    console.log('Access denied - user is not admin');
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  console.log('Admin access granted');
  next();
};

module.exports = { authenticateToken, isAdmin };