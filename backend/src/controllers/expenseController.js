const Expense = require('../models/Expense');
const Project = require('../models/Project');
const CostEstimate = require('../models/CostEstimate');
const fallbackDb = require('../services/fallbackDb');
const { getMongoStatus } = require('../config/db');

// @desc Get all expenses and summaries for project
// @route GET /api/expenses/:projectId
exports.getExpenses = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    let expenses;

    if (getMongoStatus()) {
      expenses = await Expense.find({ projectId, isVoided: { $ne: true } }).sort({ date: -1 });
    } else {
      expenses = await fallbackDb.expenses.find({ projectId });
      expenses = expenses.filter(e => !e.isVoided);
      expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    let project = getMongoStatus() ? await Project.findById(projectId) : await fallbackDb.projects.findById(projectId);
    let estimate = getMongoStatus() ? await CostEstimate.findOne({ projectId }) : (await fallbackDb.costEstimates.find({ projectId })).pop();

    let totalSpent = 0;
    let materialSpent = 0;
    let labourSpent = 0;
    let contractorSpent = 0;
    let otherSpent = 0;

    expenses.forEach(e => {
      totalSpent += (e.totalAmount || 0);
      if (e.category === 'Material') materialSpent += e.totalAmount;
      else if (e.category === 'Labour') labourSpent += e.totalAmount;
      else if (e.category === 'Contractor Fee') contractorSpent += e.totalAmount;
      else otherSpent += e.totalAmount;
    });

    const totalBudget = project?.budget || 3500000;
    const remainingBudget = totalBudget - totalSpent;
    const estimatedTotal = estimate?.totalEstimatedCost || totalBudget;
    const costVariance = totalSpent - (estimatedTotal * 0.3); // comparing current burn rate

    res.status(200).json({
      success: true,
      summary: {
        totalBudget,
        estimatedTotal,
        totalSpent,
        remainingBudget,
        materialSpent,
        labourSpent,
        contractorSpent,
        otherSpent,
        burnPercentage: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
        costVariance
      },
      expenses
    });
  } catch (error) {
    next(error);
  }
};

// @desc Log a new expense
// @route POST /api/expenses/:projectId
exports.addExpense = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const {
      date,
      supplierOrPayee,
      category,
      materialOrService,
      quantity,
      unit,
      rate,
      totalAmount,
      paymentStatus,
      discount,
      additionalCharges,
      associatedBoqCode,
      associatedStageCode,
      invoiceNumber,
      notes
    } = req.body;

    if (!supplierOrPayee || !materialOrService || rate === undefined || rate === null || rate === '') {
      return res.status(400).json({ success: false, message: 'Please provide payee, material/service description and rate' });
    }

    const qty = Math.max(0, Number(quantity || 1));
    const rt = Math.max(0, Number(rate || 0));
    const disc = Math.max(0, Number(discount || 0));
    const extra = Math.max(0, Number(additionalCharges || 0));
    const subtotal = qty * rt;
    const calculatedTotal = totalAmount !== undefined && totalAmount !== '' ? Number(totalAmount) : Math.max(0, subtotal - disc + extra);
    const invoiceUrl = req.file ? `/uploads/${req.file.filename}` : '';

    const payload = {
      projectId,
      date: date || new Date().toISOString().split('T')[0],
      supplierOrPayee,
      category: category || 'Material',
      materialOrService,
      quantity: qty,
      unit: unit || 'unit',
      rate: rt,
      subtotal,
      discount: disc,
      additionalCharges: extra,
      totalAmount: calculatedTotal,
      paymentStatus: paymentStatus || 'Paid',
      associatedBoqCode: associatedBoqCode || '',
      associatedStageCode: associatedStageCode || '',
      invoiceNumber: invoiceNumber || '',
      invoiceUrl,
      notes: notes || '',
      isVoided: false
    };

    let expense;
    if (getMongoStatus()) {
      expense = await Expense.create(payload);
    } else {
      expense = await fallbackDb.expenses.create(payload);
    }

    res.status(201).json({ success: true, message: 'Expense logged successfully', expense });
  } catch (error) {
    next(error);
  }
};

// @desc Update expense
// @route PUT /api/expenses/:projectId/:expenseId
exports.updateExpense = async (req, res, next) => {
  try {
    const { expenseId } = req.params;
    const updateData = { ...req.body };

    if (updateData.quantity !== undefined || updateData.rate !== undefined || updateData.discount !== undefined || updateData.additionalCharges !== undefined) {
      let existing = getMongoStatus() ? await Expense.findById(expenseId) : await fallbackDb.expenses.findById(expenseId);
      if (existing) {
        const qty = updateData.quantity !== undefined ? Number(updateData.quantity) : (existing.quantity || 1);
        const rt = updateData.rate !== undefined ? Number(updateData.rate) : (existing.rate || 0);
        const disc = updateData.discount !== undefined ? Math.max(0, Number(updateData.discount)) : (existing.discount || 0);
        const extra = updateData.additionalCharges !== undefined ? Math.max(0, Number(updateData.additionalCharges)) : (existing.additionalCharges || 0);
        const sub = qty * rt;
        updateData.subtotal = sub;
        updateData.discount = disc;
        updateData.additionalCharges = extra;
        updateData.totalAmount = Math.max(0, sub - disc + extra);
      }
    }

    let updated;
    if (getMongoStatus()) {
      updated = await Expense.findByIdAndUpdate(expenseId, updateData, { new: true });
    } else {
      updated = await fallbackDb.expenses.findByIdAndUpdate(expenseId, updateData);
    }

    res.status(200).json({ success: true, message: 'Expense record updated', expense: updated });
  } catch (error) {
    next(error);
  }
};

// @desc Void / Delete expense with audit history
// @route DELETE /api/expenses/:projectId/:expenseId
exports.deleteExpense = async (req, res, next) => {
  try {
    const { expenseId } = req.params;

    if (getMongoStatus()) {
      await Expense.findByIdAndUpdate(expenseId, { isVoided: true });
    } else {
      await fallbackDb.expenses.findByIdAndUpdate(expenseId, { isVoided: true });
    }

    res.status(200).json({ success: true, message: 'Expense record marked as voided' });
  } catch (error) {
    next(error);
  }
};
