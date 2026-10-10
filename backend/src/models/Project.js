const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Please provide a project name'],
    trim: true,
  },
  location: {
    type: String,
    required: [true, 'Please provide construction location'],
    trim: true,
  },
  pincode: {
    type: String,
    required: [true, 'Please provide PIN code'],
    trim: true,
  },
  budget: {
    type: Number,
    required: [true, 'Please provide estimated budget in INR'],
    min: [100000, 'Budget must be at least ₹1,00,000'],
  },
  description: {
    type: String,
    default: '',
  },
  plot: {
    length: { type: Number, required: true, min: 10 },
    width: { type: Number, required: true, min: 10 },
    area: { type: Number, required: true },
    shape: { type: String, enum: ['RECTANGULAR', 'SQUARE', 'IRREGULAR'], default: 'RECTANGULAR' },
    facingDirection: { type: String, enum: ['North', 'East', 'South', 'West'], default: 'East' },
    roadAccess: { type: String, default: 'Front road 30ft' },
    setbacks: {
      front: { type: Number, default: 5 },
      rear: { type: Number, default: 3 },
      left: { type: Number, default: 3 },
      right: { type: Number, default: 3 },
    }
  },
  accommodation: {
    floors: { type: Number, default: 1, min: 1, max: 4 },
    bedrooms: { type: Number, default: 3, min: 1 },
    bathrooms: { type: Number, default: 2, min: 1 },
    livingRoom: { type: Boolean, default: true },
    diningRoom: { type: Boolean, default: true },
    kitchen: { type: Boolean, default: true },
    poojaRoom: { type: Boolean, default: true },
    utilityArea: { type: Boolean, default: true },
    parking: { type: Boolean, default: true },
    balcony: { type: Boolean, default: true },
    staircase: { type: Boolean, default: true },
    studyRoom: { type: Boolean, default: false },
    otherRequirements: { type: String, default: '' },
    familyMembers: { type: Number, default: 4 },
  },
  preferences: {
    style: { type: String, enum: ['Modern Minimalist', 'Contemporary', 'Traditional Indian', 'Modern Luxury', 'Custom style'], default: 'Contemporary' },
    flooring: { type: String, default: 'Vitrified Tiles' },
    kitchen: { type: String, default: 'Modular with Granite Counter' },
    interiorColours: { type: String, default: 'Warm Neutrals & Off-White' },
    furnitureStyle: { type: String, default: 'Clean Contemporary' },
    lighting: { type: String, default: 'Recessed Warm LED with False Ceiling' },
    ventilation: { type: String, default: 'Cross-Ventilation Focused' },
    energyEfficiency: { type: String, default: 'Solar Ready with Thermal Glazing' },
  },
  vastuPreferences: {
    enabled: { type: Boolean, default: true },
    entranceZone: { type: String, default: 'NE' },
    kitchenOrientation: { type: String, default: 'SE' },
    masterBedroomOrientation: { type: String, default: 'SW' },
    poojaOrientation: { type: String, default: 'NE' },
    staircasePlacement: { type: String, default: 'S' },
  },
  selectedPackage: {
    type: String,
    enum: ['BASIC', 'MEDIUM', 'RICH'],
    default: 'MEDIUM',
  },
  activeFloorPlanId: {
    type: String,
    default: null,
  },
  siteImageUrl: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.models.Project || mongoose.model('Project', projectSchema);
