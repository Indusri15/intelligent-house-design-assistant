const Project = require('../models/Project');
const FloorPlan = require('../models/FloorPlan');
const VastuResult = require('../models/VastuResult');
const CostEstimate = require('../models/CostEstimate');
const ConstructionStage = require('../models/ConstructionStage');
const Expense = require('../models/Expense');
const fallbackDb = require('../services/fallbackDb');
const { getMongoStatus } = require('../config/db');

const { generateProjectPdf } = require('../services/pdfGenerator');
const { generateProjectExcel } = require('../services/excelGenerator');
const { calculateProjectBOQ } = require('../services/boqCalculator');
const { evaluateVastuCompliance } = require('../services/vastuEngine');

async function getProjectBundle(projectId) {
  let project = getMongoStatus() ? await Project.findById(projectId) : await fallbackDb.projects.findById(projectId);
  if (!project) return null;

  let floorPlan = getMongoStatus() ? 
    await FloorPlan.findOne({ projectId }).sort({ createdAt: -1 }) : 
    (await fallbackDb.floorPlans.find({ projectId })).pop();

  let vastu = getMongoStatus() ? 
    await VastuResult.findOne({ projectId }).sort({ createdAt: -1 }) : 
    (await fallbackDb.vastuResults.find({ projectId })).pop();

  let boq = getMongoStatus() ? 
    await CostEstimate.findOne({ projectId }).sort({ updatedAt: -1 }) : 
    (await fallbackDb.costEstimates.find({ projectId })).pop();

  let stages = getMongoStatus() ? 
    await ConstructionStage.find({ projectId }).sort({ stageOrder: 1 }) : 
    await fallbackDb.constructionStages.find({ projectId });

  let expenses = getMongoStatus() ? 
    await Expense.find({ projectId, isVoided: { $ne: true } }) : 
    (await fallbackDb.expenses.find({ projectId })).filter(e => !e.isVoided);

  // Ensure Vastu and BOQ are dynamically synchronized with current floor plan geometry
  if (!vastu || (floorPlan && vastu.createdAt && floorPlan.createdAt && new Date(floorPlan.createdAt) > new Date(vastu.createdAt))) {
    vastu = evaluateVastuCompliance(project, floorPlan);
  }

  if (!boq || (floorPlan && floorPlan.totalBuiltUpAreaSqFt && boq.totalBuiltUpAreaSqFt !== floorPlan.totalBuiltUpAreaSqFt)) {
    boq = calculateProjectBOQ(project, floorPlan, project.selectedPackage || 'MEDIUM');
  }

  return { project, floorPlan, vastu, boq, stages, expenses };
}

// @desc Download comprehensive PDF report
// @route GET /api/reports/:projectId/pdf
exports.downloadPdf = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id || req.user.id;
    const bundle = await getProjectBundle(projectId);

    if (!bundle) return res.status(404).json({ success: false, message: 'Project not found' });

    // Resource ownership authorization check: allow project owner or administrator
    if (bundle.project.user && bundle.project.user.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized: You do not own this project' });
    }

    const safeFilename = `${bundle.project.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_Portfolio.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);

    await generateProjectPdf(bundle, res);
  } catch (error) {
    next(error);
  }
};

// @desc Download detailed Excel report
// @route GET /api/reports/:projectId/excel
exports.downloadExcel = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id || req.user.id;
    const bundle = await getProjectBundle(projectId);

    if (!bundle) return res.status(404).json({ success: false, message: 'Project not found' });

    // Resource ownership authorization check: allow project owner or administrator
    if (bundle.project.user && bundle.project.user.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized: You do not own this project' });
    }

    await generateProjectExcel(bundle, res);
  } catch (error) {
    next(error);
  }
};
