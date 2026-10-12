const FloorPlan = require('../models/FloorPlan');
const Project = require('../models/Project');
const fallbackDb = require('../services/fallbackDb');
const { getMongoStatus } = require('../config/db');
const { generateGeometricFloorPlan } = require('../services/geometryEngine');
const { evaluateVastuCompliance } = require('../services/vastuEngine');
const { calculateProjectBOQ } = require('../services/boqCalculator');

// @desc Generate or regenerate floor plans
// @route POST /api/floor-plans/generate/:projectId
exports.generateFloorPlan = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    let project;

    if (getMongoStatus()) {
      project = await Project.findById(projectId);
    } else {
      project = await fallbackDb.projects.findById(projectId);
    }

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const userId = req.user._id || req.user.id;
    if (project.user && project.user.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized: You can only generate floor plans for your own projects' });
    }

    // Generate new layout
    const generated = generateGeometricFloorPlan(project);

    let plan;
    if (getMongoStatus()) {
      plan = await FloorPlan.create({
        projectId,
        ...generated
      });
      await Project.findByIdAndUpdate(projectId, { activeFloorPlanId: plan._id });
    } else {
      plan = await fallbackDb.floorPlans.create({
        projectId,
        ...generated
      });
      await fallbackDb.projects.findByIdAndUpdate(projectId, { activeFloorPlanId: plan._id });
    }

    // Refresh Vastu & BOQ with new plan
    const vastu = evaluateVastuCompliance(project, plan);
    const boq = calculateProjectBOQ(project, plan, project.selectedPackage);

    if (getMongoStatus()) {
      await require('../models/VastuResult').findOneAndUpdate({ projectId }, vastu, { upsert: true });
      await require('../models/CostEstimate').findOneAndUpdate({ projectId }, boq, { upsert: true });
    } else {
      await fallbackDb.vastuResults.create({ projectId, ...vastu });
      await fallbackDb.costEstimates.create({ projectId, ...boq });
    }

    res.status(200).json({
      success: true,
      message: 'New architectural floor plans generated successfully',
      floorPlan: plan,
      vastu,
      boq
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get active floor plan for project
// @route GET /api/floor-plans/:projectId
exports.getFloorPlan = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    let floorPlan;

    if (getMongoStatus()) {
      floorPlan = await FloorPlan.findOne({ projectId }).sort({ createdAt: -1 });
    } else {
      const plans = await fallbackDb.floorPlans.find({ projectId });
      floorPlan = plans[plans.length - 1] || null;
    }

    if (!floorPlan) {
      // Auto-generate if missing
      let project = getMongoStatus() ? await Project.findById(projectId) : await fallbackDb.projects.findById(projectId);
      if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
      const generated = generateGeometricFloorPlan(project);
      floorPlan = getMongoStatus() ? await FloorPlan.create({ projectId, ...generated }) : await fallbackDb.floorPlans.create({ projectId, ...generated });
    }

    res.status(200).json({ success: true, floorPlan });
  } catch (error) {
    next(error);
  }
};

// @desc Select layout candidate (Alternative A, B, or C)
// @route POST /api/floor-plans/select/:projectId
exports.selectLayoutCandidate = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { candidateId } = req.body;

    let floorPlan;
    if (getMongoStatus()) {
      floorPlan = await FloorPlan.findOne({ projectId }).sort({ createdAt: -1 });
    } else {
      const plans = await fallbackDb.floorPlans.find({ projectId });
      floorPlan = plans[plans.length - 1] || null;
    }

    if (!floorPlan) return res.status(404).json({ success: false, message: 'Floor plan not found' });

    const selectedAlt = floorPlan.alternatives.find(a => a.id === candidateId);
    if (!selectedAlt) {
      return res.status(400).json({ success: false, message: 'Invalid layout alternative selected' });
    }

    const updatedData = {
      layoutCandidateName: selectedAlt.name,
      floors: selectedAlt.floors
    };

    let updatedPlan;
    if (getMongoStatus()) {
      updatedPlan = await FloorPlan.findByIdAndUpdate(floorPlan._id, updatedData, { new: true });
    } else {
      updatedPlan = await fallbackDb.floorPlans.findByIdAndUpdate(floorPlan._id, updatedData);
    }

    res.status(200).json({
      success: true,
      message: `Selected layout option '${selectedAlt.name}' activated`,
      floorPlan: updatedPlan
    });
  } catch (error) {
    next(error);
  }
};

// @desc Save revision
// @route POST /api/floor-plans/save-revision/:projectId
exports.saveRevision = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { notes } = req.body;

    let floorPlan = getMongoStatus() ? 
      await FloorPlan.findOne({ projectId }).sort({ createdAt: -1 }) : 
      (await fallbackDb.floorPlans.find({ projectId })).pop();

    if (!floorPlan) return res.status(404).json({ success: false, message: 'Floor plan not found' });

    const nextRev = (floorPlan.revision || 1) + 1;
    let newRev;
    if (getMongoStatus()) {
      newRev = await FloorPlan.create({
        projectId,
        revision: nextRev,
        layoutCandidateName: `${floorPlan.layoutCandidateName} (Rev ${nextRev})`,
        totalBuiltUpAreaSqFt: floorPlan.totalBuiltUpAreaSqFt,
        groundFloorAreaSqFt: floorPlan.groundFloorAreaSqFt,
        firstFloorAreaSqFt: floorPlan.firstFloorAreaSqFt,
        floors: floorPlan.floors,
        alternatives: floorPlan.alternatives,
        validation: floorPlan.validation
      });
    } else {
      newRev = await fallbackDb.floorPlans.create({
        projectId,
        revision: nextRev,
        layoutCandidateName: `${floorPlan.layoutCandidateName} (Rev ${nextRev})`,
        totalBuiltUpAreaSqFt: floorPlan.totalBuiltUpAreaSqFt,
        groundFloorAreaSqFt: floorPlan.groundFloorAreaSqFt,
        firstFloorAreaSqFt: floorPlan.firstFloorAreaSqFt,
        floors: floorPlan.floors,
        alternatives: floorPlan.alternatives,
        validation: floorPlan.validation
      });
    }

    res.status(201).json({ success: true, message: `Revision ${nextRev} saved successfully`, floorPlan: newRev });
  } catch (error) {
    next(error);
  }
};
