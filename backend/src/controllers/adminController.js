const Project = require('../models/Project');
const User = require('../models/User');
const CostEstimate = require('../models/CostEstimate');
const fallbackDb = require('../services/fallbackDb');
const defaultRates = require('../data/defaultRates.json');
const { getMongoStatus } = require('../config/db');

// @desc Get system-wide administration statistics
// @route GET /api/admin/stats
exports.getAdminStats = async (req, res, next) => {
  try {
    let totalUsers = 0;
    let totalProjects = 0;
    let totalEstimatedValue = 0;
    let allProjects = [];

    if (getMongoStatus()) {
      totalUsers = await User.countDocuments();
      totalProjects = await Project.countDocuments();
      allProjects = await Project.find().sort({ createdAt: -1 }).limit(20);
      const estimates = await CostEstimate.find();
      estimates.forEach(e => totalEstimatedValue += (e.totalEstimatedCost || 0));
    } else {
      totalUsers = await fallbackDb.users.countDocuments();
      totalProjects = await fallbackDb.projects.countDocuments();
      allProjects = await fallbackDb.projects.find();
      const estimates = await fallbackDb.costEstimates.find();
      estimates.forEach(e => totalEstimatedValue += (e.totalEstimatedCost || 0));
    }

    const packageDistribution = {
      BASIC: allProjects.filter(p => p.selectedPackage === 'BASIC').length,
      MEDIUM: allProjects.filter(p => p.selectedPackage === 'MEDIUM' || !p.selectedPackage).length,
      RICH: allProjects.filter(p => p.selectedPackage === 'RICH').length,
    };

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalProjects,
        totalEstimatedValue,
        packageDistribution,
        recentProjects: allProjects
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update regional rates
// @route PUT /api/admin/rates
exports.updateRates = async (req, res, next) => {
  try {
    const { materialRates, labourRates } = req.body;
    if (materialRates) Object.assign(defaultRates.materialRates, materialRates);
    if (labourRates) Object.assign(defaultRates.labourRates, labourRates);

    res.status(200).json({
      success: true,
      message: 'Regional Schedules of Rates (SoR) updated successfully',
      rates: defaultRates
    });
  } catch (error) {
    next(error);
  }
};
