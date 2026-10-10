const mongoose = require('mongoose');

const floorPlanSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  revision: {
    type: Number,
    default: 1,
  },
  layoutCandidateName: {
    type: String,
    default: 'Option A (Balanced Circulation)',
  },
  totalBuiltUpAreaSqFt: {
    type: Number,
    required: true,
  },
  groundFloorAreaSqFt: {
    type: Number,
    required: true,
  },
  firstFloorAreaSqFt: {
    type: Number,
    default: 0,
  },
  floors: {
    type: Array,
    default: [],
  },
  alternatives: {
    type: Array,
    default: [],
  },
  validation: {
    isValid: { type: Boolean, default: true },
    overlaps: { type: Array, default: [] },
    boundaryViolations: { type: Array, default: [] },
    warnings: { type: Array, default: [] },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
}, { strict: false });

module.exports = mongoose.models.FloorPlan || mongoose.model('FloorPlan', floorPlanSchema);
