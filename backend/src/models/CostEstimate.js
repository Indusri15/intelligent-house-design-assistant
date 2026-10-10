const mongoose = require('mongoose');

const costEstimateSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  selectedPackage: {
    type: String,
    enum: ['BASIC', 'MEDIUM', 'RICH'],
    default: 'MEDIUM',
  },
  totalBuiltUpAreaSqFt: {
    type: Number,
    required: true,
  },
  totalEstimatedCost: {
    type: Number,
    required: true,
  },
  costPerSqFt: {
    type: Number,
    required: true,
  },
  userBudget: {
    type: Number,
    required: true,
  },
  budgetDifference: {
    type: Number, // budget - totalEstimatedCost (positive: saving, negative: shortfall)
    required: true,
  },
  summary: {
    materialCost: Number,
    labourCost: Number,
    contractorCost: Number,
    interiorCost: Number,
    otherExpenses: Number,
    contingency: Number,
  },
  boqLineItems: [
    {
      category: String,
      code: String,
      itemName: String,
      description: String,
      specification: String,
      unit: String,
      quantity: Number,
      wastagePercentage: Number,
      purchasableQuantity: Number,
      materialRate: Number,
      materialCost: Number,
      labourRate: Number,
      labourCost: Number,
      totalCost: Number,
      rateSource: { type: String, default: 'Telangana Regional Schedule of Rates 2026' },
      effectiveDate: { type: String, default: '2026-01-01' },
      assumptions: String,
    }
  ],
  packages: {
    basic: {
      totalCost: Number,
      costPerSqFt: Number,
      diffFromBudget: Number,
      specs: [String],
      materialsCost: Number,
      labourCost: Number,
    },
    medium: {
      totalCost: Number,
      costPerSqFt: Number,
      diffFromBudget: Number,
      specs: [String],
      materialsCost: Number,
      labourCost: Number,
    },
    rich: {
      totalCost: Number,
      costPerSqFt: Number,
      diffFromBudget: Number,
      specs: [String],
      materialsCost: Number,
      labourCost: Number,
    }
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.models.CostEstimate || mongoose.model('CostEstimate', costEstimateSchema);
