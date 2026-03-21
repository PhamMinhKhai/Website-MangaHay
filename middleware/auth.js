const jwt = require('jsonwebtoken');
const config = require('../config/config');

// Authentication middleware - Supports both session and JWT
const isAuthenticated = (req, res, next) => {
  // First, try session-based authentication (for web)
  if (req.session && req.session.userId) {
    req.userId = req.session.userId;
    req.username = req.session.username;
    req.isAdmin = req.session.isAdmin;
    return next();
  }
  
  // Then, try JWT token authentication (for mobile apps)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      req.userId = decoded.userId;
      req.username = decoded.username;
      req.isAdmin = decoded.isAdmin;
      return next();
    } catch (error) {
      // Token invalid or expired
      if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
        return res.status(401).json({ 
          success: false,
          error: 'Invalid or expired token' 
        });
      }
    }
  }
  
  // Not authenticated
  if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
    return res.status(401).json({ 
      success: false,
      error: 'Unauthorized' 
    });
  }
  res.redirect('/login');
};

// Admin middleware - Supports both session and JWT
const isAdmin = (req, res, next) => {
  // First, try session-based authentication
  if (req.session && req.session.userId && req.session.isAdmin) {
    req.userId = req.session.userId;
    req.username = req.session.username;
    req.isAdmin = req.session.isAdmin;
    return next();
  }
  
  // Then, try JWT token authentication
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      if (decoded.isAdmin) {
        req.userId = decoded.userId;
        req.username = decoded.username;
        req.isAdmin = decoded.isAdmin;
        return next();
      }
      // User is authenticated but not admin
      if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
        return res.status(403).json({ 
          success: false,
          error: 'Forbidden: Admin access required' 
        });
      }
    } catch (error) {
      if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
        return res.status(401).json({ 
          success: false,
          error: 'Invalid or expired token' 
        });
      }
    }
  }
  
  // Not authorized
  if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
    return res.status(403).json({ 
      success: false,
      error: 'Forbidden: Admin access required' 
    });
  }
  res.redirect('/');
};

// Optional authentication (doesn't block if not authenticated) - Supports both session and JWT
const optionalAuth = (req, res, next) => {
  // Try session authentication first
  if (req.session && req.session.userId) {
    req.isAuthenticated = true;
    req.userId = req.session.userId;
    req.username = req.session.username;
    req.isAdmin = req.session.isAdmin;
    return next();
  }
  
  // Try JWT authentication
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      req.isAuthenticated = true;
      req.userId = decoded.userId;
      req.username = decoded.username;
      req.isAdmin = decoded.isAdmin;
      return next();
    } catch (error) {
      // Token invalid, continue as unauthenticated
    }
  }
  
  // Not authenticated, but that's okay for optional auth
  req.isAuthenticated = false;
  next();
};

module.exports = {
  isAuthenticated,
  isAdmin,
  optionalAuth
};

