const ConstructionStage = require('../models/ConstructionStage');
const fallbackDb = require('../services/fallbackDb');
const { getMongoStatus } = require('../config/db');
const { evaluateStageEligibility, computeProjectProgressMetrics } = require('../services/dependencyEngine');

// @desc Get all 21 construction stages for project
// @route GET /api/progress/:projectId
exports.getStages = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    let stages;

    if (getMongoStatus()) {
      stages = await ConstructionStage.find({ projectId }).sort({ stageOrder: 1 });
    } else {
      stages = await fallbackDb.constructionStages.find({ projectId });
      stages.sort((a, b) => a.stageOrder - b.stageOrder);
    }

    const metrics = computeProjectProgressMetrics(stages);

    res.status(200).json({
      success: true,
      metrics,
      stages
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update stage details (status, progress, contractor, notes)
// @route PUT /api/progress/:projectId/stages/:stageId
exports.updateStage = async (req, res, next) => {
  try {
    const { stageId } = req.params;
    const { status, progressPercentage, assignedContractor, notes, actualCost, actualStart, actualFinish } = req.body;

    let stage;
    if (getMongoStatus()) {
      stage = await ConstructionStage.findById(stageId);
    } else {
      stage = await fallbackDb.constructionStages.findById(stageId);
    }

    if (!stage) return res.status(404).json({ success: false, message: 'Stage not found' });

    // Enforce prerequisite dependencies when updating status to Completed
    if (status === 'Completed' && !stage.exceptionOverride?.isOverridden) {
      let allStages = getMongoStatus() ? 
        await ConstructionStage.find({ projectId: stage.projectId }).sort({ stageOrder: 1 }) : 
        await fallbackDb.constructionStages.find({ projectId: stage.projectId });
      const eligibility = evaluateStageEligibility(stage, allStages);
      if (!eligibility.eligible) {
        return res.status(400).json({
          success: false,
          message: `Cannot complete stage '${stage.name}'. Prerequisite stage(s) incomplete: ${eligibility.blockingStages.join(', ')}`,
          blockingStages: eligibility.blockingStages
        });
      }
    }

    const previousStatus = stage.status;
    const updateData = {
      status: status || stage.status,
      progressPercentage: progressPercentage !== undefined ? Number(progressPercentage) : stage.progressPercentage,
      assignedContractor: assignedContractor || stage.assignedContractor,
      notes: notes !== undefined ? notes : stage.notes,
      actualCost: actualCost !== undefined ? Number(actualCost) : stage.actualCost,
      actualStart: actualStart || stage.actualStart,
      actualFinish: actualFinish || stage.actualFinish,
      updatedAt: new Date()
    };

    if (status && status !== previousStatus) {
      stage.activityHistory = stage.activityHistory || [];
      stage.activityHistory.push({
        timestamp: new Date(),
        action: `Status changed from ${previousStatus} to ${status}`,
        previousStatus,
        newStatus: status,
        updatedBy: req.user.name,
        note: notes || ''
      });
      updateData.activityHistory = stage.activityHistory;
    }

    let updated;
    if (getMongoStatus()) {
      updated = await ConstructionStage.findByIdAndUpdate(stageId, updateData, { new: true });
    } else {
      updated = await fallbackDb.constructionStages.findByIdAndUpdate(stageId, updateData);
    }

    res.status(200).json({ success: true, message: 'Stage updated successfully', stage: updated });
  } catch (error) {
    next(error);
  }
};

// @desc Mark stage completed with dependency resolution
// @route POST /api/progress/:projectId/stages/:stageId/complete
exports.completeStage = async (req, res, next) => {
  try {
    const { projectId, stageId } = req.params;
    const { notes } = req.body;

    let stages = getMongoStatus() ? 
      await ConstructionStage.find({ projectId }).sort({ stageOrder: 1 }) : 
      await fallbackDb.constructionStages.find({ projectId });

    const targetStage = stages.find(s => s._id.toString() === stageId.toString() || s.id === stageId);
    if (!targetStage) return res.status(404).json({ success: false, message: 'Stage not found' });

    // Check prerequisites if not overridden
    if (!targetStage.exceptionOverride?.isOverridden) {
      const eligibility = evaluateStageEligibility(targetStage, stages);
      if (!eligibility.eligible) {
        return res.status(400).json({
          success: false,
          message: `Cannot complete stage '${targetStage.name}'. Prerequisite stage(s) incomplete: ${eligibility.blockingStages.join(', ')}`,
          blockingStages: eligibility.blockingStages
        });
      }
    }

    const updateData = {
      status: 'Completed',
      progressPercentage: 100,
      actualFinish: new Date().toISOString().split('T')[0],
      updatedAt: new Date()
    };

    targetStage.activityHistory = targetStage.activityHistory || [];
    targetStage.activityHistory.push({
      timestamp: new Date(),
      action: 'Stage Marked Completed',
      previousStatus: targetStage.status,
      newStatus: 'Completed',
      updatedBy: req.user.name,
      note: notes || 'Verified completion'
    });
    updateData.activityHistory = targetStage.activityHistory;

    if (getMongoStatus()) {
      await ConstructionStage.findByIdAndUpdate(stageId, updateData);
      stages = await ConstructionStage.find({ projectId }).sort({ stageOrder: 1 });
    } else {
      await fallbackDb.constructionStages.findByIdAndUpdate(stageId, updateData);
      stages = await fallbackDb.constructionStages.find({ projectId });
    }

    const metrics = computeProjectProgressMetrics(stages);

    res.status(200).json({
      success: true,
      message: `Stage '${targetStage.name}' marked completed successfully!`,
      metrics,
      stages
    });
  } catch (error) {
    next(error);
  }
};

// @desc Record justified dependency exception
// @route POST /api/progress/:projectId/stages/:stageId/exception
exports.recordException = async (req, res, next) => {
  try {
    const { stageId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.length < 5) {
      return res.status(400).json({ success: false, message: 'Please provide a justified technical reason for the exception' });
    }

    const updateData = {
      exceptionOverride: {
        isOverridden: true,
        reason,
        overriddenAt: new Date()
      }
    };

    let updated;
    if (getMongoStatus()) {
      updated = await ConstructionStage.findByIdAndUpdate(stageId, updateData, { new: true });
    } else {
      updated = await fallbackDb.constructionStages.findByIdAndUpdate(stageId, updateData);
    }

    res.status(200).json({ success: true, message: 'Dependency override exception recorded', stage: updated });
  } catch (error) {
    next(error);
  }
};
