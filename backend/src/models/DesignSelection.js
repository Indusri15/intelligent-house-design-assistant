const mongoose = require('mongoose');

const designSelectionSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  exterior: {
    frontElevationStyle: { type: String, default: 'Modern Cubical Facade' },
    facadeMaterial: { type: String, default: 'Stone Cladding & Louvers' },
    exteriorColors: { type: [String], default: ['#f8fafc', '#334155', '#d97706'] },
    balconyRailing: { type: String, default: 'Toughened Glass with SS Profile' },
    boundaryWallStyle: { type: String, default: 'Horizontal Groove Textured Plaster' },
    gateDesign: { type: String, default: 'CNC Laser Cut WPC Composite' },
    lighting: { type: String, default: 'Warm Architectural Up-Down Spotlights' },
    landscaping: { type: String, default: 'Perimeter Planter Beds with Lawn Path' },
  },
  interiorRooms: [
    {
      roomId: String,
      roomName: String,
      roomType: String,
      flooring: String,
      wallTreatment: String,
      wallColors: [String],
      ceilingType: String,
      lightingFixtures: String,
      furnitureLayout: String,
      storageWardrobes: String,
      materials: [
        { name: String, spec: String, qty: Number, unit: String, unitCost: Number, totalCost: Number }
      ],
      estimatedCost: Number,
      imageUrl: String,
    }
  ],
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.models.DesignSelection || mongoose.model('DesignSelection', designSelectionSchema);
