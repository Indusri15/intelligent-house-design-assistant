const VastuResult = require('../models/VastuResult');
const Project = require('../models/Project');
const FloorPlan = require('../models/FloorPlan');
const fallbackDb = require('../services/fallbackDb');
const { getMongoStatus } = require('../config/db');
const { evaluateVastuCompliance } = require('../services/vastuEngine');

// @desc Get Vastu analysis for project
// @route GET /api/vastu/:projectId
exports.getVastuResult = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    let vastu;

    if (getMongoStatus()) {
      vastu = await VastuResult.findOne({ projectId }).sort({ createdAt: -1 });
    } else {
      const results = await fallbackDb.vastuResults.find({ projectId });
      vastu = results[results.length - 1] || null;
    }

    if (!vastu) {
      let project = getMongoStatus() ? await Project.findById(projectId) : await fallbackDb.projects.findById(projectId);
      let floorPlan = getMongoStatus() ? await FloorPlan.findOne({ projectId }) : (await fallbackDb.floorPlans.find({ projectId }))[0];

      if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
      const evaluated = evaluateVastuCompliance(project, floorPlan);

      vastu = getMongoStatus() ? 
        await VastuResult.create({ projectId, ...evaluated }) : 
        await fallbackDb.vastuResults.create({ projectId, ...evaluated });
    }

    res.status(200).json({ success: true, vastu });
  } catch (error) {
    next(error);
  }
};

// @desc Re-evaluate Vastu compliance
// @route POST /api/vastu/evaluate/:projectId
exports.evaluateVastu = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    let project = getMongoStatus() ? await Project.findById(projectId) : await fallbackDb.projects.findById(projectId);
    let floorPlan = getMongoStatus() ? await FloorPlan.findOne({ projectId }).sort({ createdAt: -1 }) : (await fallbackDb.floorPlans.find({ projectId })).pop();

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const evaluated = evaluateVastuCompliance(project, floorPlan);

    let vastu;
    if (getMongoStatus()) {
      vastu = await VastuResult.create({ projectId, ...evaluated });
    } else {
      vastu = await fallbackDb.vastuResults.create({ projectId, ...evaluated });
    }

    res.status(200).json({ success: true, message: 'Vastu evaluation updated successfully', vastu });
  } catch (error) {
    next(error);
  }
};
