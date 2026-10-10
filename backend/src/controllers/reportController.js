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

  // Fallbacks if not computed yet
  if (!vastu) vastu = evaluateVastuCompliance(project, floorPlan);
  if (!boq) boq = calculateProjectBOQ(project, floorPlan, project.selectedPackage);

  return { project, floorPlan, vastu, boq, stages, expenses };
}

// @desc Download comprehensive PDF report
// @route GET /api/reports/:projectId/pdf
exports.downloadPdf = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const bundle = await getProjectBundle(projectId);

    if (!bundle) return res.status(404).json({ success: false, message: 'Project not found' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${bundle.project.name.replace(/\s+/g, '_')}_Portfolio.pdf"`);

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
    const bundle = await getProjectBundle(projectId);

    if (!bundle) return res.status(404).json({ success: false, message: 'Project not found' });

    await generateProjectExcel(bundle, res);
  } catch (error) {
    next(error);
  }
};
