const mongoose = require('mongoose');

const rateSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  name: { type: String, required: true },
  unit: { type: String, required: true },
  rate: { type: Number, required: true },
  wastage: { type: Number, default: 0 },
  region: { type: String, default: 'Warangal / Telangana' },
  updatedBy: { type: String, default: 'System Admin' },
  updatedAt: { type: Date, default: Date.now }
});

const aiJobSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  jobType: { type: String, enum: ['LAYOUT_GENERATION', 'IMAGE_SEGMENTATION', 'SITE_ANALYSIS', 'REPORT_PDF'], required: true },
  status: { type: String, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'PENDING' },
  progress: { type: Number, default: 0 },
  result: { type: mongoose.Schema.Types.Mixed, default: null },
  error: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  completedAt: Date
});

const MaterialRate = mongoose.models.MaterialRate || mongoose.model('MaterialRate', rateSchema);
const LabourRate = mongoose.models.LabourRate || mongoose.model('LabourRate', rateSchema);
const AiJob = mongoose.models.AiJob || mongoose.model('AiJob', aiJobSchema);

module.exports = { MaterialRate, LabourRate, AiJob };
