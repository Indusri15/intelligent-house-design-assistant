const jwt = require('jsonwebtoken');
const User = require('../models/User');
const fallbackDb = require('../services/fallbackDb');
const { getMongoStatus } = require('../config/db');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
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
        return res.status(401).json({ success: false, message: 'User associated with token not found' });
      }

      next();
    } catch (error) {
      console.error('Auth verification error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed or expired' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };
