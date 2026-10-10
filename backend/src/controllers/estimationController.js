const CostEstimate = require('../models/CostEstimate');
const Project = require('../models/Project');
const FloorPlan = require('../models/FloorPlan');
const fallbackDb = require('../services/fallbackDb');
const defaultRates = require('../data/defaultRates.json');
const { getMongoStatus } = require('../config/db');
const { calculateProjectBOQ } = require('../services/boqCalculator');

// @desc Get project BOQ and estimate
// @route GET /api/estimation/:projectId
exports.getEstimate = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    let estimate;

    if (getMongoStatus()) {
      estimate = await CostEstimate.findOne({ projectId }).sort({ updatedAt: -1 });
    } else {
      const estimates = await fallbackDb.costEstimates.find({ projectId });
      estimate = estimates[estimates.length - 1] || null;
    }

    if (!estimate) {
      let project = getMongoStatus() ? await Project.findById(projectId) : await fallbackDb.projects.findById(projectId);
      let floorPlan = getMongoStatus() ? await FloorPlan.findOne({ projectId }) : (await fallbackDb.floorPlans.find({ projectId }))[0];

      if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
      const calculated = calculateProjectBOQ(project, floorPlan, project.selectedPackage);

      estimate = getMongoStatus() ? 
        await CostEstimate.create({ projectId, ...calculated }) : 
        await fallbackDb.costEstimates.create({ projectId, ...calculated });
    }

    res.status(200).json({ success: true, estimate });
  } catch (error) {
    next(error);
  }
};

// @desc Recalculate BOQ
// @route POST /api/estimation/recalculate/:projectId
exports.recalculateEstimate = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { packageTier } = req.body;

    let project = getMongoStatus() ? await Project.findById(projectId) : await fallbackDb.projects.findById(projectId);
    let floorPlan = getMongoStatus() ? await FloorPlan.findOne({ projectId }).sort({ createdAt: -1 }) : (await fallbackDb.floorPlans.find({ projectId })).pop();

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const selectedPkg = packageTier || project.selectedPackage || 'MEDIUM';
    const boq = calculateProjectBOQ(project, floorPlan, selectedPkg);

    let updated;
    if (getMongoStatus()) {
      updated = await CostEstimate.findOneAndUpdate({ projectId }, boq, { new: true, upsert: true });
      await Project.findByIdAndUpdate(projectId, { selectedPackage: selectedPkg });
    } else {
      updated = await fallbackDb.costEstimates.create({ projectId, ...boq });
      await fallbackDb.projects.findByIdAndUpdate(projectId, { selectedPackage: selectedPkg });
    }

    res.status(200).json({ success: true, message: 'BOQ and cost estimate recalculated successfully', estimate: updated });
  } catch (error) {
    next(error);
  }
};

// @desc Get 3-tier packages comparison
// @route GET /api/estimation/packages/:projectId
exports.getPackages = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    let project = getMongoStatus() ? await Project.findById(projectId) : await fallbackDb.projects.findById(projectId);
    let floorPlan = getMongoStatus() ? await FloorPlan.findOne({ projectId }).sort({ createdAt: -1 }) : (await fallbackDb.floorPlans.find({ projectId })).pop();

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const boq = calculateProjectBOQ(project, floorPlan, project.selectedPackage);

    res.status(200).json({
      success: true,
      selectedPackage: project.selectedPackage || 'MEDIUM',
      userBudget: project.budget,
      builtUpArea: boq.totalBuiltUpAreaSqFt,
      packages: boq.packages
    });
  } catch (error) {
    next(error);
  }
};

// @desc Select package
// @route POST /api/estimation/select-package/:projectId
exports.selectPackage = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { packageTier } = req.body;

    if (!['BASIC', 'MEDIUM', 'RICH'].includes(packageTier)) {
      return res.status(400).json({ success: false, message: 'Invalid package tier (must be BASIC, MEDIUM, or RICH)' });
    }

    let project = getMongoStatus() ? await Project.findById(projectId) : await fallbackDb.projects.findById(projectId);
    let floorPlan = getMongoStatus() ? await FloorPlan.findOne({ projectId }).sort({ createdAt: -1 }) : (await fallbackDb.floorPlans.find({ projectId })).pop();

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const boq = calculateProjectBOQ(project, floorPlan, packageTier);

    if (getMongoStatus()) {
      await Project.findByIdAndUpdate(projectId, { selectedPackage: packageTier });
      await CostEstimate.findOneAndUpdate({ projectId }, boq, { upsert: true });
    } else {
      await fallbackDb.projects.findByIdAndUpdate(projectId, { selectedPackage: packageTier });
      await fallbackDb.costEstimates.create({ projectId, ...boq });
    }

    res.status(200).json({
      success: true,
      message: `Project updated to '${packageTier}' tier`,
      selectedPackage: packageTier,
      estimate: boq
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get regional rates catalog
// @route GET /api/estimation/rates
exports.getRates = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, rates: defaultRates });
  } catch (error) {
    next(error);
  }
};
