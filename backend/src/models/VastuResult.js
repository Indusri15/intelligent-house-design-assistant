const mongoose = require('mongoose');

const vastuResultSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  overallScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  grade: {
    type: String,
    enum: ['EXCELLENT', 'VERY_GOOD', 'GOOD', 'NEEDS_ADJUSTMENT'],
    default: 'GOOD',
  },
  orientationSummary: {
    plotFacing: String,
    entranceDirection: String,
    kitchenDirection: String,
    masterBedroomDirection: String,
    poojaRoomDirection: String,
    waterSourceDirection: String,
  },
  evaluations: [
    {
      ruleId: String,
      roomType: String,
      roomName: String,
      allocatedZone: String,
      recommendedZones: [String],
      status: {
        type: String,
        enum: ['OPTIMAL', 'ACCEPTABLE', 'NON_COMPLIANT'],
      },
      score: Number,
      priority: String,
      explanation: String,
      suggestedRemedy: String,
    }
  ],
  generalRecommendations: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.models.VastuResult || mongoose.model('VastuResult', vastuResultSchema);
