const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user?.role || 'anonymous'}' is not authorized to perform this administrative action`,
      });
    }
    next();
  };
};

module.exports = { authorizeRoles };
