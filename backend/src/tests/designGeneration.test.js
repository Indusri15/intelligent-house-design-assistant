const assert = require('assert');
const imageGenService = require('../services/imageGenerationService');
const fallbackDb = require('../services/fallbackDb');
const { calculateProjectBOQ } = require('../services/boqCalculator');

async function testDesignGenerationSuite() {
  console.log('▶ Running AI Interior & Exterior Design Engine Tests...');

  const mockProject = {
    _id: 'proj_test_123',
    name: 'Warangal Luxury Villa',
    budget: 4500000,
    selectedPackage: 'MEDIUM',
    plot: { length: 50, width: 30, area: 1500 },
    accommodation: { floors: 2, bedrooms: 3, bathrooms: 2 },
    preferences: { style: 'Contemporary', flooring: 'Vitrified Tiles' }
  };

  const mockFloorPlan = {
    totalBuiltUpAreaSqFt: 2100,
    groundFloorAreaSqFt: 1050
  };

  // 1. Test Interior Prompt Formulation
  const interiorOptions = {
    roomType: 'living_room',
    style: 'Modern Luxury',
    budgetTier: 'RICH',
    wallColors: ['#F8FAFC', '#1E293B', '#D97706'],
    flooring: 'Italian Statuario Marble',
    ceiling: 'Gypsum Cove with Magnetic Track Lights',
    furniture: '6-Seater Fabric Sectional Sofa',
    storage: 'Floating TV Console',
    dimensions: { length: 18, width: 15, height: 10, areaSqFt: 270 },
    customInstructions: 'Provide brass screen partition towards dining area'
  };

  const interiorPrompt = imageGenService.buildInteriorPrompt(interiorOptions, mockProject);
  assert(interiorPrompt.includes('living room'), 'Prompt must contain the room type');
  assert(interiorPrompt.includes('Modern Luxury'), 'Prompt must contain design style');
  assert(interiorPrompt.includes('Italian Statuario Marble'), 'Prompt must contain flooring');
  assert(interiorPrompt.includes('18ft by 15ft'), 'Prompt must contain room dimensions');
  assert(interiorPrompt.includes('brass screen partition'), 'Prompt must contain custom instructions');
  console.log('  ✔ Interior prompt formulated with room, dimensions, materials, and custom instructions');

  // 2. Test Exterior Prompt Formulation
  const exteriorOptions = {
    style: 'Modern Indian house',
    elevationStyle: 'Modern Cubical Facade',
    exteriorColors: ['#F8FAFC', '#334155', '#D97706'],
    facadeMaterial: 'Teak Sandstone Cladding & WPC Louvers',
    balconyRailing: '12mm Toughened Glass with SS Profile',
    entranceDoor: 'Grand Teak Wood Double Door',
    boundaryGate: 'CNC Laser Cut Steel Gate with WPC Composite',
    lighting: 'Architectural Up-Down Spotlights',
    landscaping: 'Perimeter Planter Beds with Lawn Path',
    finishTier: 'RICH',
    floors: 2,
    customInstructions: 'Cantilever balcony projection over porch'
  };

  const exteriorPrompt = imageGenService.buildExteriorPrompt(exteriorOptions, mockProject);
  assert(exteriorPrompt.includes('Modern Indian house'), 'Exterior prompt must contain style');
  assert(exteriorPrompt.includes('2-story'), 'Exterior prompt must contain floor count');
  assert(exteriorPrompt.includes('Teak Sandstone Cladding'), 'Exterior prompt must contain facade materials');
  assert(exteriorPrompt.includes('Toughened Glass'), 'Exterior prompt must contain balcony railing');
  assert(exteriorPrompt.includes('Cantilever balcony projection'), 'Exterior prompt must contain custom instructions');
  console.log('  ✔ Exterior prompt formulated with floors, plot, facade, and architectural features');

  // 3. Test Material Quantity Scaling
  const costSpec = imageGenService.computeItemizedMaterials('interior', 'living_room', 'Modern', { areaSqFt: 300 });
  assert(costSpec.estimatedCost > 50000, 'Estimated cost should be realistic for a 300 sq.ft living room');
  assert(costSpec.materials.length > 0, 'Materials list should be populated');
  console.log(`  ✔ Material itemization calculated: ₹${costSpec.estimatedCost.toLocaleString('en-IN')} across ${costSpec.materials.length} specification items`);

  // 4. Test Design Image Generation & Persistence
  const genResult = await imageGenService.generateDesignImage(interiorPrompt, 'interior', {
    title: 'Modern Living Room',
    style: 'Modern',
    provider: 'pollinations'
  });
  assert(genResult.success, 'Generation result should succeed');
  assert(genResult.imageUrl.startsWith('/uploads/designs/'), 'Image URL should be relative path in /uploads/designs/');
  console.log(`  ✔ Generated visual saved: ${genResult.imageUrl} (Provider: ${genResult.provider}, Status: ${genResult.status})`);

  // 5. Test Fallback DB persistence for GeneratedDesign
  const savedDoc = await fallbackDb.generatedDesigns.create({
    projectId: mockProject._id,
    user: 'user_test_1',
    designType: 'interior',
    roomType: 'living_room',
    title: 'Modern Living Room Concept',
    style: 'Modern',
    imageUrl: genResult.imageUrl,
    isFavorite: false,
    isFinal: false,
    costImpact: costSpec
  });
  assert(savedDoc._id, 'Fallback DB should assign unique _id');
  const foundDocs = await fallbackDb.generatedDesigns.find({ projectId: mockProject._id });
  assert(foundDocs.length >= 1, 'Should find saved design by projectId');

  // Toggle favorite
  const updatedFav = await fallbackDb.generatedDesigns.findByIdAndUpdate(savedDoc._id, { isFavorite: true });
  assert.strictEqual(updatedFav.isFavorite, true, 'isFavorite flag should be updated to true');

  // Select as final
  const updatedFinal = await fallbackDb.generatedDesigns.findByIdAndUpdate(savedDoc._id, { isFinal: true });
  assert.strictEqual(updatedFinal.isFinal, true, 'isFinal flag should be updated to true');
  console.log('  ✔ Generated design persisted in database with favorite and final selection states');

  // 6. Test Design-Synchronized BOQ Recalculation
  const designSelection = {
    projectId: mockProject._id,
    exterior: {
      facadeMaterial: 'Natural Teak Sandstone Cladding',
      balconyRailing: '12mm Toughened Glass SS 304',
      gateDesign: 'Motorized CNC WPC Gate',
      landscaping: 'Lush Tropical Lawn with Courtyard'
    },
    interiorRooms: [
      {
        roomType: 'living_room',
        flooring: 'Italian Marble Statuario',
        estimatedCost: costSpec.estimatedCost,
        materials: costSpec.materials
      }
    ]
  };

  const boqWithDesign = calculateProjectBOQ(mockProject, mockFloorPlan, 'RICH', null, designSelection);
  assert(boqWithDesign.boqLineItems.some(item => item.code === 'BOQ-21'), 'BOQ must include BOQ-21 for Exterior Facade Cladding');
  assert(boqWithDesign.boqLineItems.some(item => item.code === 'BOQ-22'), 'BOQ must include BOQ-22 for Balcony Railing');
  assert(boqWithDesign.boqLineItems.some(item => item.itemName.includes('Italian Marble')), 'Flooring item should sync with Italian Marble design choice');
  console.log(`  ✔ BOQ Cost Engine successfully synchronized with design choices (Total: ₹${boqWithDesign.totalEstimatedCost.toLocaleString('en-IN')})`);

  console.log('✅ AI Design Generation Engine Tests Passed!\n');
}

module.exports = { testDesignGenerationSuite };
