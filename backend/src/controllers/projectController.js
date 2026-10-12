const Project = require('../models/Project');
const FloorPlan = require('../models/FloorPlan');
const VastuResult = require('../models/VastuResult');
const CostEstimate = require('../models/CostEstimate');
const ConstructionStage = require('../models/ConstructionStage');
const DesignSelection = require('../models/DesignSelection');
const fallbackDb = require('../services/fallbackDb');
const { getMongoStatus } = require('../config/db');

const { generateGeometricFloorPlan } = require('../services/geometryEngine');
const { evaluateVastuCompliance } = require('../services/vastuEngine');
const { calculateProjectBOQ } = require('../services/boqCalculator');
const { generateProjectStages } = require('../services/dependencyEngine');

// @desc Create new project & initialize all engines
// @route POST /api/projects
exports.createProject = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const {
      name,
      location,
      pincode,
      budget,
      description,
      plot,
      accommodation,
      preferences,
      vastuPreferences,
      selectedPackage,
      siteImageUrl
    } = req.body;

    if (!name || !location || !budget || !plot?.length || !plot?.width) {
      return res.status(400).json({ success: false, message: 'Please provide all mandatory project fields' });
    }

    const calculatedArea = Number(plot.length) * Number(plot.width);
    const plotData = {
      length: Number(plot.length),
      width: Number(plot.width),
      area: calculatedArea,
      shape: plot.shape || 'RECTANGULAR',
      facingDirection: plot.facingDirection || 'East',
      roadAccess: plot.roadAccess || 'Front road 30ft',
      setbacks: {
        front: Number(plot.setbacks?.front) || 5,
        rear: Number(plot.setbacks?.rear) || 3,
        left: Number(plot.setbacks?.left) || 3,
        right: Number(plot.setbacks?.right) || 3,
      }
    };

    const projectPayload = {
      user: userId,
      name,
      location,
      pincode: pincode || '506001',
      budget: Number(budget),
      description: description || '',
      plot: plotData,
      accommodation: accommodation || {},
      preferences: preferences || {},
      vastuPreferences: vastuPreferences || {},
      selectedPackage: selectedPackage || 'MEDIUM',
      siteImageUrl: siteImageUrl || null,
    };

    let newProject;
    if (getMongoStatus()) {
      newProject = await Project.create(projectPayload);
    } else {
      newProject = await fallbackDb.projects.create(projectPayload);
    }

    const projectId = newProject._id;

    // 1. Generate Floor Plan
    const floorPlanResult = generateGeometricFloorPlan(newProject);
    let savedFloorPlan;
    if (getMongoStatus()) {
      savedFloorPlan = await FloorPlan.create({
        projectId,
        ...floorPlanResult
      });
      newProject = await Project.findByIdAndUpdate(projectId, { activeFloorPlanId: savedFloorPlan._id }, { new: true });
    } else {
      savedFloorPlan = await fallbackDb.floorPlans.create({
        projectId,
        ...floorPlanResult
      });
      newProject = await fallbackDb.projects.findByIdAndUpdate(projectId, { activeFloorPlanId: savedFloorPlan._id });
    }

    // 2. Evaluate Vastu
    const vastuResult = evaluateVastuCompliance(newProject, savedFloorPlan);
    if (getMongoStatus()) {
      await VastuResult.create({ projectId, ...vastuResult });
    } else {
      await fallbackDb.vastuResults.create({ projectId, ...vastuResult });
    }

    // 3. Compute BOQ & Cost Estimate
    const boqResult = calculateProjectBOQ(newProject, savedFloorPlan, newProject.selectedPackage);
    if (getMongoStatus()) {
      await CostEstimate.create({ projectId, ...boqResult });
    } else {
      await fallbackDb.costEstimates.create({ projectId, ...boqResult });
    }

    // 4. Initialize 21 Construction Stages
    const stages = generateProjectStages(projectId, boqResult.totalEstimatedCost);
    if (getMongoStatus()) {
      await ConstructionStage.insertMany(stages);
    } else {
      for (const stg of stages) {
        await fallbackDb.constructionStages.create(stg);
      }
    }

    // 5. Initialize Design Selections
    const initialDesign = {
      projectId,
      exterior: {
        frontElevationStyle: preferences?.style === 'Traditional Indian' ? 'Heritage Courtyard Elevation' : 'Modern Cubical Facade',
        facadeMaterial: 'Stone Cladding & WPC Louvers',
        exteriorColors: ['#f8fafc', '#334155', '#d97706'],
        balconyRailing: 'Toughened Glass with SS Profile',
        boundaryWallStyle: 'Horizontal Groove Textured Plaster',
        gateDesign: 'CNC Laser Cut WPC Composite',
        lighting: 'Warm Architectural Up-Down Spotlights',
        landscaping: 'Perimeter Planter Beds with Lawn Path'
      },
      interiorRooms: savedFloorPlan.floors[0]?.rooms?.map(r => ({
        roomId: r.id,
        roomName: r.name,
        roomType: r.type,
        flooring: preferences?.flooring || 'Vitrified Tiles',
        wallTreatment: 'Smooth Putty with 2-Coat Emulsion',
        wallColors: ['#f8fafc', '#e2e8f0'],
        ceilingType: 'Saint-Gobain Gypsum with LED Cove',
        lightingFixtures: 'Warm White Recessed Spotlights',
        furnitureLayout: 'Standard Ergonomic Arrangement',
        storageWardrobes: r.type.includes('bedroom') ? 'Floor-to-Ceiling Wardrobes' : 'Wall Shelving',
        estimatedCost: Math.round(r.areaSqFt * 120),
        materials: [
          { name: `${r.name} Floor Covering`, spec: 'Vitrified Tiles', qty: r.areaSqFt, unit: 'sq.ft', unitCost: 75, totalCost: Math.round(r.areaSqFt * 75) }
        ]
      })) || []
    };

    if (getMongoStatus()) {
      await DesignSelection.create(initialDesign);
    } else {
      await fallbackDb.designSelections.create(initialDesign);
    }

    res.status(201).json({
      success: true,
      message: 'Project created and initialized successfully with floor plans, BOQ, Vastu analysis, and timeline!',
      project: newProject,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get all projects for logged-in user
// @route GET /api/projects
exports.getProjects = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    let projects;
    if (getMongoStatus()) {
      projects = await Project.find({ user: userId }).sort({ createdAt: -1 });
    } else {
      projects = await fallbackDb.projects.find({ user: userId });
      projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.status(200).json({ success: true, count: projects.length, projects });
  } catch (error) {
    next(error);
  }
};

// @desc Get single project details
// @route GET /api/projects/:id
exports.getProjectById = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    let project;
    if (getMongoStatus()) {
      project = await Project.findById(id);
    } else {
      project = await fallbackDb.projects.findById(id);
    }

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Resource ownership check (allow if owner or admin)
    if (project.user.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized: You do not own this project' });
    }

    res.status(200).json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

// @desc Update project
// @route PUT /api/projects/:id
exports.updateProject = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    let project;
    if (getMongoStatus()) {
      project = await Project.findById(id);
    } else {
      project = await fallbackDb.projects.findById(id);
    }

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.user.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized: You do not own this project' });
    }

    // Recalculate plot area if plot length or width updated
    if (req.body.plot && req.body.plot.length && req.body.plot.width) {
      req.body.plot.area = Number(req.body.plot.length) * Number(req.body.plot.width);
    }

    req.body.updatedAt = new Date();

    let updated;
    if (getMongoStatus()) {
      updated = await Project.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    } else {
      updated = await fallbackDb.projects.findByIdAndUpdate(id, req.body);
    }

    // If auto-regenerate was requested, synthesize new floor plan, Vastu and BOQ
    let regeneratedBundle = null;
    if (req.query.regenerate === 'true') {
      const planResult = generateGeometricFloorPlan(updated);
      let plan;
      if (getMongoStatus()) {
        plan = await FloorPlan.create({ projectId: id, ...planResult });
        await Project.findByIdAndUpdate(id, { activeFloorPlanId: plan._id });
      } else {
        plan = await fallbackDb.floorPlans.create({ projectId: id, ...planResult });
        await fallbackDb.projects.findByIdAndUpdate(id, { activeFloorPlanId: plan._id });
      }

      const vastu = evaluateVastuCompliance(updated, plan);
      const boq = calculateProjectBOQ(updated, plan, updated.selectedPackage);

      if (getMongoStatus()) {
        await VastuResult.findOneAndUpdate({ projectId: id }, vastu, { upsert: true });
        await CostEstimate.findOneAndUpdate({ projectId: id }, boq, { upsert: true });
      } else {
        await fallbackDb.vastuResults.create({ projectId: id, ...vastu });
        await fallbackDb.costEstimates.create({ projectId: id, ...boq });
      }

      regeneratedBundle = { floorPlan: plan, vastu, boq };
    }

    res.status(200).json({
      success: true,
      message: 'Project requirements updated successfully',
      project: updated,
      regenerated: regeneratedBundle
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete project and cascade records
// @route DELETE /api/projects/:id
exports.deleteProject = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    let project;
    if (getMongoStatus()) {
      project = await Project.findById(id);
      if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
      if (project.user.toString() !== userId.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      await Project.findByIdAndDelete(id);
      await FloorPlan.deleteMany({ projectId: id });
      await VastuResult.deleteMany({ projectId: id });
      await CostEstimate.deleteMany({ projectId: id });
      await ConstructionStage.deleteMany({ projectId: id });
      await DesignSelection.deleteMany({ projectId: id });
    } else {
      project = await fallbackDb.projects.findById(id);
      if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
      if (project.user.toString() !== userId.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      await fallbackDb.projects.findByIdAndDelete(id);
      await fallbackDb.floorPlans.deleteMany({ projectId: id });
      await fallbackDb.vastuResults.deleteMany({ projectId: id });
      await fallbackDb.costEstimates.deleteMany({ projectId: id });
      await fallbackDb.constructionStages.deleteMany({ projectId: id });
      await fallbackDb.designSelections.deleteMany({ projectId: id });
    }

    res.status(200).json({ success: true, message: 'Project and all associated records deleted successfully' });
  } catch (error) {
    next(error);
  }
};
