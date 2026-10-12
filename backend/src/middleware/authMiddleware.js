const jwt = require('jsonwebtoken');
const User = require('../models/User');
const fallbackDb = require('../services/fallbackDb');
const { getMongoStatus } = require('../config/db');

const protect = async (req, res, next) => {
  let token;

  // 1. Check Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 2. Fallback: check query parameter ?token= for direct authenticated downloads
  else if (req.query && req.query.token) {
    token = req.query.token;
  }

  // Validate token exists and is not literal string 'null' or 'undefined'
  if (token && typeof token === 'string' && token !== 'null' && token !== 'undefined' && token.trim() !== '') {
    token = token.trim();
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'super_secure_jwt_secret_key_house_design_major_project_2026'
      );

      if (getMongoStatus()) {
        req.user = await User.findById(decoded.id).select('-password');
      } else {
        const user = await fallbackDb.users.findById(decoded.id);
        if (user) {
          const { password, ...userWithoutPass } = user;
          req.user = userWithoutPass;
        }
      }

      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          code: 'USER_NOT_FOUND',
          message: 'User associated with token not found' 
        });
      }

      return next();
    } catch (error) {
      console.error('Auth verification error:', error.message);
      const isExpired = error.name === 'TokenExpiredError';
      return res.status(401).json({ 
        success: false, 
        code: isExpired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
        message: 'Not authorized, token failed or expired' 
      });
    }
  }

  return res.status(401).json({ 
    success: false, 
    code: 'NO_TOKEN',
    message: 'Not authorized, no token provided' 
  });
};

module.exports = { protect };
