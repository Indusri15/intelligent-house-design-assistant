const mongoose = require('mongoose');

const generatedDesignSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  designType: {
    type: String,
    enum: ['interior', 'exterior'],
    required: true,
  },
  roomType: {
    type: String,
    default: 'living_room',
  },
  title: {
    type: String,
    required: true,
  },
  style: {
    type: String,
    default: 'Contemporary',
  },
  budgetTier: {
    type: String,
    enum: ['BASIC', 'MEDIUM', 'RICH'],
    default: 'MEDIUM',
  },
  prompt: {
    type: String,
    default: '',
  },
  negativePrompt: {
    type: String,
    default: '',
  },
  settings: {
    wallColors: { type: [String], default: [] },
    flooring: { type: String, default: '' },
    ceiling: { type: String, default: '' },
    lighting: { type: String, default: '' },
    furniture: { type: String, default: '' },
    storage: { type: String, default: '' },
    dimensions: {
      length: { type: Number, default: 0 },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 10 },
      areaSqFt: { type: Number, default: 0 },
    },
    facadeMaterial: { type: String, default: '' },
    balconyRailing: { type: String, default: '' },
    entranceDoor: { type: String, default: '' },
    boundaryGate: { type: String, default: '' },
    landscaping: { type: String, default: '' },
    floors: { type: Number, default: 1 },
    customInstructions: { type: String, default: '' },
  },
  imageUrl: {
    type: String,
    required: true,
  },
  storagePath: {
    type: String,
    default: '',
  },
  alternatives: [
    {
      id: String,
      imageUrl: String,
      prompt: String,
      seed: Number,
    }
  ],
  isFavorite: {
    type: Boolean,
    default: false,
  },
  isFinal: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['completed', 'fallback', 'failed'],
    default: 'completed',
  },
  provider: {
    type: String,
    default: 'pollinations',
  },
  model: {
    type: String,
    default: 'flux',
  },
  sceneAnalysis: {
    lightingScore: Number,
    lightingCondition: String,
    extractedPalette: [String],
    detectedElements: [
      {
        label: String,
        confidence: Number,
        areaRatio: Number,
        material: String,
      }
    ],
    designRecommendations: [String],
  },
  costImpact: {
    estimatedCost: { type: Number, default: 0 },
    specifications: [
      {
        name: String,
        spec: String,
        qty: Number,
        unit: String,
        unitCost: Number,
        totalCost: Number,
      }
    ]
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.models.GeneratedDesign || mongoose.model('GeneratedDesign', generatedDesignSchema);
