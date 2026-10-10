const Project = require('../models/Project');
const FloorPlan = require('../models/FloorPlan');
const VastuResult = require('../models/VastuResult');
const CostEstimate = require('../models/CostEstimate');
const ConstructionStage = require('../models/ConstructionStage');
const Expense = require('../models/Expense');
const fallbackDb = require('../services/fallbackDb');
const { getMongoStatus } = require('../config/db');
const { processChatbotMessage } = require('../services/chatbotService');

// @desc Process chatbot query
// @route POST /api/chatbot/message
exports.handleMessage = async (req, res, next) => {
  try {
    const { message, projectId, history } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    let project = null;
    let floorPlan = null;
    let vastu = null;
    let boq = null;
    let stages = [];
    let expenses = [];

    if (projectId) {
      if (getMongoStatus()) {
        project = await Project.findById(projectId);
        floorPlan = await FloorPlan.findOne({ projectId }).sort({ createdAt: -1 });
        vastu = await VastuResult.findOne({ projectId }).sort({ createdAt: -1 });
        boq = await CostEstimate.findOne({ projectId }).sort({ updatedAt: -1 });
        stages = await ConstructionStage.find({ projectId }).sort({ stageOrder: 1 });
        expenses = await Expense.find({ projectId, isVoided: { $ne: true } });
      } else {
        project = await fallbackDb.projects.findById(projectId);
        const plans = await fallbackDb.floorPlans.find({ projectId });
        floorPlan = plans[plans.length - 1] || null;
        const vastus = await fallbackDb.vastuResults.find({ projectId });
        vastu = vastus[vastus.length - 1] || null;
        const estimates = await fallbackDb.costEstimates.find({ projectId });
        boq = estimates[estimates.length - 1] || null;
        stages = await fallbackDb.constructionStages.find({ projectId });
        expenses = (await fallbackDb.expenses.find({ projectId })).filter(e => !e.isVoided);
      }
    }

    const response = await processChatbotMessage({
      message,
      project,
      floorPlan,
      vastu,
      boq,
      stages,
      expenses,
      history
    });

    res.status(200).json({
      success: true,
      reply: response.reply,
      source: response.source
    });
  } catch (error) {
    next(error);
  }
};
