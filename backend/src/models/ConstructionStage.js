const mongoose = require('mongoose');

const constructionStageSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  stageOrder: {
    type: Number,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['Pre-Construction', 'Substructure', 'Superstructure', 'Services', 'Finishes', 'Handover'],
    required: true,
  },
  status: {
    type: String,
    enum: ['Not Started', 'Ready', 'In Progress', 'Blocked', 'Completed'],
    default: 'Not Started',
  },
  progressPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  plannedStart: String,
  plannedFinish: String,
  actualStart: String,
  actualFinish: String,
  assignedContractor: {
    type: String,
    default: 'Unassigned',
  },
  estimatedCost: {
    type: Number,
    default: 0,
  },
  actualCost: {
    type: Number,
    default: 0,
  },
  dependencies: {
    type: [String], // array of prerequisite stage codes
    default: [],
  },
  requiredMaterials: [
    { name: String, quantity: String, status: { type: String, default: 'Pending' } }
  ],
  notes: {
    type: String,
    default: '',
  },
  photos: [
    { url: String, caption: String, date: String }
  ],
  activityHistory: [
    {
      timestamp: { type: Date, default: Date.now },
      action: String,
      previousStatus: String,
      newStatus: String,
      updatedBy: String,
      note: String,
    }
  ],
  exceptionOverride: {
    isOverridden: { type: Boolean, default: false },
    reason: String,
    overriddenAt: Date,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.models.ConstructionStage || mongoose.model('ConstructionStage', constructionStageSchema);
