const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Project = require('../models/Project');
const FloorPlan = require('../models/FloorPlan');
const VastuResult = require('../models/VastuResult');
const CostEstimate = require('../models/CostEstimate');
const ConstructionStage = require('../models/ConstructionStage');
const fallbackDb = require('../services/fallbackDb');
const { connectDB, getMongoStatus } = require('../config/db');

const { generateGeometricFloorPlan } = require('../services/geometryEngine');
const { evaluateVastuCompliance } = require('../services/vastuEngine');
const { calculateProjectBOQ } = require('../services/boqCalculator');
const { generateProjectStages } = require('../services/dependencyEngine');

async function seed() {
  console.log('[Seed] Starting database seeding...');
  await connectDB();

  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('Admin@12345', salt);
  const userPasswordHash = await bcrypt.hash('User@12345', salt);

  const adminUserData = {
    _id: '660000000000000000000001',
    name: 'Administrator',
    email: 'admin@housedesign.ai',
    password: adminPasswordHash,
    role: 'admin'
  };

  const demoUserData = {
    _id: '660000000000000000000002',
    name: 'Srikanth Reddy',
    email: 'user@housedesign.ai',
    password: userPasswordHash,
    role: 'user'
  };

  // Seed into Fallback JSON DB
  const existingAdmin = await fallbackDb.users.findOne({ email: 'admin@housedesign.ai' });
  if (!existingAdmin) await fallbackDb.users.create(adminUserData);

  const existingDemoUser = await fallbackDb.users.findOne({ email: 'user@housedesign.ai' });
  let seededUser = existingDemoUser;
  if (!existingDemoUser) seededUser = await fallbackDb.users.create(demoUserData);

  // Seed Demo House Project
  const sampleProjectData = {
    _id: '660000000000000000000101',
    user: seededUser._id || seededUser.id,
    name: 'Reddy Residence (Warangal Plot 42)',
    location: 'Hanamkonda, Warangal',
    pincode: '506001',
    budget: 3800000,
    description: 'Contemporary 3-BHK G+1 residential villa planned with strict Vastu compliance and optimal natural cross-ventilation.',
    plot: {
      length: 50,
      width: 30,
      area: 1500,
      shape: 'RECTANGULAR',
      facingDirection: 'East',
      roadAccess: '30ft Municipal Front Road',
      setbacks: { front: 5, rear: 3, left: 3, right: 3 }
    },
    accommodation: {
      floors: 2,
      bedrooms: 3,
      bathrooms: 3,
      livingRoom: true,
      diningRoom: true,
      kitchen: true,
      poojaRoom: true,
      utilityArea: true,
      parking: true,
      balcony: true,
      staircase: true,
      studyRoom: true,
      familyMembers: 4
    },
    preferences: {
      style: 'Contemporary',
      flooring: 'Glazed Vitrified 4x2 Tiles',
      kitchen: 'Modular with Granite Counter',
      interiorColours: 'Warm Ivory & Charcoal',
      furnitureStyle: 'Clean Contemporary',
      lighting: 'Recessed Warm LED with False Ceiling',
      ventilation: 'Cross-Ventilation Focused',
      energyEfficiency: 'Solar Ready with Thermal Glazing'
    },
    vastuPreferences: {
      enabled: true,
      entranceZone: 'NE',
      kitchenOrientation: 'SE',
      masterBedroomOrientation: 'SW',
      poojaOrientation: 'NE',
      staircasePlacement: 'S'
    },
    selectedPackage: 'MEDIUM'
  };

  const existingProject = await fallbackDb.projects.findById(sampleProjectData._id);
  if (!existingProject) {
    const proj = await fallbackDb.projects.create(sampleProjectData);
    const plan = generateGeometricFloorPlan(proj);
    const savedPlan = await fallbackDb.floorPlans.create({ projectId: proj._id, ...plan });
    await fallbackDb.projects.findByIdAndUpdate(proj._id, { activeFloorPlanId: savedPlan._id });

    const vastu = evaluateVastuCompliance(proj, savedPlan);
    await fallbackDb.vastuResults.create({ projectId: proj._id, ...vastu });

    const boq = calculateProjectBOQ(proj, savedPlan, 'MEDIUM');
    await fallbackDb.costEstimates.create({ projectId: proj._id, ...boq });

    const stages = generateProjectStages(proj._id, boq.totalEstimatedCost);
    for (const stg of stages) {
      await fallbackDb.constructionStages.create(stg);
    }
  }

  // If MongoDB is connected, seed directly into MongoDB Atlas Mongoose models
  if (getMongoStatus()) {
    try {
      // 1. Seed Users in MongoDB Atlas
      let atlasAdmin = await User.findOne({ email: 'admin@housedesign.ai' });
      if (!atlasAdmin) {
        atlasAdmin = await User.create({
          name: 'Administrator',
          email: 'admin@housedesign.ai',
          password: 'Admin@12345',
          role: 'admin'
        });
        console.log('[MongoDB Atlas] Seeded Admin User: admin@housedesign.ai');
      }

      let atlasUser = await User.findOne({ email: 'user@housedesign.ai' });
      if (!atlasUser) {
        atlasUser = await User.create({
          name: 'Srikanth Reddy',
          email: 'user@housedesign.ai',
          password: 'User@12345',
          role: 'user'
        });
        console.log('[MongoDB Atlas] Seeded Standard User: user@housedesign.ai');
      }

      // 2. Seed Project & Architectural Models in MongoDB Atlas
      const atlasExistingProject = await Project.findOne({ user: atlasUser._id });
      if (!atlasExistingProject) {
        const atlasProjectDoc = await Project.create({
          ...sampleProjectData,
          _id: new mongoose.Types.ObjectId(),
          user: atlasUser._id
        });

        const plan = generateGeometricFloorPlan(atlasProjectDoc);
        const savedPlan = await FloorPlan.create({
          projectId: atlasProjectDoc._id,
          totalBuiltUpArea: plan.totalBuiltUpArea,
          floors: plan.floors,
          svgLayout: plan.svgLayout,
          candidateAlternatives: plan.candidateAlternatives,
          validation: plan.validation
        });

        await Project.findByIdAndUpdate(atlasProjectDoc._id, { activeFloorPlanId: savedPlan._id });

        const vastu = evaluateVastuCompliance(atlasProjectDoc, savedPlan);
        await VastuResult.create({
          projectId: atlasProjectDoc._id,
          ...vastu
        });

        const boq = calculateProjectBOQ(atlasProjectDoc, savedPlan, 'MEDIUM');
        await CostEstimate.create({
          projectId: atlasProjectDoc._id,
          ...boq
        });

        const stages = generateProjectStages(atlasProjectDoc._id, boq.totalEstimatedCost);
        for (const stg of stages) {
          await ConstructionStage.create({
            ...stg,
            _id: new mongoose.Types.ObjectId(),
            projectId: atlasProjectDoc._id
          });
        }
        console.log(`[MongoDB Atlas] Seeded Project '${atlasProjectDoc.name}' with Floor Plans, Vastu, BOQ & 21 Stages!`);
      }
      console.log('[MongoDB Atlas] All Collections and Documents Successfully Synchronized in Atlas Cloud!');
    } catch (e) {
      console.warn('[MongoDB Atlas Seed Error]', e.message);
    }
  }

  console.log('[Seed] Database seeding completed successfully!');
  console.log('   Admin: admin@housedesign.ai / Admin@12345');
  console.log('   User:  user@housedesign.ai / User@12345');
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch(err => {
    console.error('Seed Error:', err);
    process.exit(1);
  });
}

module.exports = { seed };

