const assert = require('assert');
const { generateGeometricFloorPlan, validateLayout } = require('../services/geometryEngine');

console.log('================================================================');
console.log('  TEST SUITE: DYNAMIC FLOOR PLAN GENERATION & ROOM ALLOCATION   ');
console.log('================================================================\n');

function runDynamicFloorPlanTests() {
  let passedTests = 0;

  // -------------------------------------------------------------------------
  // TEST 1: Single Floor, 1 BHK, 1 Bath (Compact Studio / Tiny Home)
  // Optional rooms: No parking, no pooja, no study, no staircase
  // -------------------------------------------------------------------------
  console.log('▶ TEST 1: Single Floor, 1 BHK, 1 Bath (Deselected Optional Rooms)...');
  const project1 = {
    name: '1 BHK Single Story',
    plot: { length: 35, width: 25, setbacks: { front: 4, rear: 2, left: 2, right: 2 } },
    accommodation: {
      floors: 1,
      bedrooms: 1,
      bathrooms: 1,
      livingRoom: true,
      diningRoom: true,
      kitchen: true,
      poojaRoom: false,
      parking: false,
      utilityArea: false,
      studyRoom: false,
      staircase: false
    }
  };

  const plan1 = generateGeometricFloorPlan(project1);
  assert.strictEqual(plan1.floors.length, 1, 'Must generate exactly 1 floor');
  const gfRooms1 = plan1.floors[0].rooms;
  const bedrooms1 = gfRooms1.filter(r => r.type === 'master_bedroom' || r.type === 'bedroom');
  const bathrooms1 = gfRooms1.filter(r => r.type === 'bathroom');
  const pooja1 = gfRooms1.filter(r => r.type === 'pooja');
  const parking1 = gfRooms1.filter(r => r.type === 'parking');
  const staircase1 = gfRooms1.filter(r => r.type === 'staircase');

  assert.strictEqual(bedrooms1.length, 1, 'Must generate exactly 1 bedroom');
  assert.strictEqual(bathrooms1.length, 1, 'Must generate exactly 1 bathroom');
  assert.strictEqual(pooja1.length, 0, 'Must NOT generate unselected pooja room');
  assert.strictEqual(parking1.length, 0, 'Must NOT generate unselected parking');
  assert.strictEqual(staircase1.length, 0, 'Must NOT generate staircase when floors=1 and staircase=false');

  const v1 = validateLayout(gfRooms1, plan1.floors[0].boundary.width, plan1.floors[0].boundary.length);
  assert.strictEqual(v1.isValid, true, `Layout must have 0 overlaps. Violations: ${v1.overlaps.concat(v1.boundaryViolations).join(', ')}`);
  console.log(`  ✔ Exact room counts: 1 Bed, 1 Bath. Optional rooms omitted as requested. 0 overlaps.`);
  passedTests++;

  // -------------------------------------------------------------------------
  // TEST 2: Single Floor, 3 BHK, 2 Bath (Single-story Family Villa)
  // CRITICAL FIX: Ground Floor must generate ALL 3 requested bedrooms!
  // -------------------------------------------------------------------------
  console.log('\n▶ TEST 2: Single Floor, 3 BHK, 2 Bath (All 3 Bedrooms on Ground Floor)...');
  const project2 = {
    name: '3 BHK Ground Floor Villa',
    plot: { length: 55, width: 35, setbacks: { front: 5, rear: 3, left: 3, right: 3 } },
    accommodation: {
      floors: 1,
      bedrooms: 3,
      bathrooms: 2,
      livingRoom: true,
      diningRoom: true,
      kitchen: true,
      poojaRoom: true,
      parking: true,
      utilityArea: true,
      staircase: true // roof access
    }
  };

  const plan2 = generateGeometricFloorPlan(project2);
  assert.strictEqual(plan2.floors.length, 1, 'Must generate exactly 1 floor');
  const gfRooms2 = plan2.floors[0].rooms;
  const bedrooms2 = gfRooms2.filter(r => r.type === 'master_bedroom' || r.type === 'bedroom');
  const bathrooms2 = gfRooms2.filter(r => r.type === 'bathroom');
  const pooja2 = gfRooms2.filter(r => r.type === 'pooja');
  const parking2 = gfRooms2.filter(r => r.type === 'parking');

  assert.strictEqual(bedrooms2.length, 3, `Must generate all 3 bedrooms on Ground floor (Found: ${bedrooms2.length})`);
  assert.strictEqual(bathrooms2.length, 2, `Must generate all 2 bathrooms on Ground floor (Found: ${bathrooms2.length})`);
  assert.strictEqual(pooja2.length, 1, 'Pooja room must be present when selected');
  assert.strictEqual(parking2.length, 1, 'Parking must be present when selected');

  // Verify bedroom names
  const bedNames2 = bedrooms2.map(b => b.name);
  assert.ok(bedNames2.includes('Master Bedroom'), 'Must include Master Bedroom');
  assert.ok(bedNames2.some(n => n.includes('Bedroom 2')), 'Must include Bedroom 2');
  assert.ok(bedNames2.some(n => n.includes('Bedroom 3')), 'Must include Bedroom 3');

  const v2 = validateLayout(gfRooms2, plan2.floors[0].boundary.width, plan2.floors[0].boundary.length);
  assert.strictEqual(v2.isValid, true, `Layout must have 0 overlaps. Violations: ${v2.overlaps.concat(v2.boundaryViolations).join(', ')}`);
  console.log(`  ✔ Successfully allocated all 3 Bedrooms (${bedNames2.join(', ')}) & 2 Bathrooms on single floor. 0 overlaps.`);
  passedTests++;

  // -------------------------------------------------------------------------
  // TEST 3: G+1 Duplex, 4 BHK, 3 Bath with Staircase Alignment
  // -------------------------------------------------------------------------
  console.log('\n▶ TEST 3: G+1 Duplex, 4 BHK, 3 Bath (Vertical Staircase Alignment)...');
  const project3 = {
    name: '4 BHK Duplex House',
    plot: { length: 50, width: 30, setbacks: { front: 5, rear: 3, left: 3, right: 3 } },
    accommodation: {
      floors: 2,
      bedrooms: 4,
      bathrooms: 3,
      livingRoom: true,
      diningRoom: true,
      kitchen: true,
      poojaRoom: true,
      parking: true,
      balcony: true,
      utilityArea: true,
      studyRoom: true,
      staircase: true
    }
  };

  const plan3 = generateGeometricFloorPlan(project3);
  assert.strictEqual(plan3.floors.length, 2, 'Must generate exactly 2 floors');

  // Total bedroom & bathroom count across both floors
  let totalBeds3 = 0;
  let totalBaths3 = 0;
  plan3.floors.forEach(fl => {
    totalBeds3 += fl.rooms.filter(r => r.type === 'master_bedroom' || r.type === 'bedroom').length;
    totalBaths3 += fl.rooms.filter(r => r.type === 'bathroom').length;
  });

  assert.strictEqual(totalBeds3, 4, `Total bedrooms across floors must equal 4 (Found: ${totalBeds3})`);
  assert.strictEqual(totalBaths3, 3, `Total bathrooms across floors must equal 3 (Found: ${totalBaths3})`);

  // Verify Staircase vertical alignment between Ground Floor and Floor 2
  const stairGF = plan3.floors[0].rooms.find(r => r.type === 'staircase');
  const stairF2 = plan3.floors[1].rooms.find(r => r.type === 'staircase');
  assert.ok(stairGF, 'Staircase must exist on Ground Floor');
  assert.ok(stairF2, 'Staircase must exist on Floor 2');

  assert.strictEqual(stairGF.x, stairF2.x, 'Staircase X coordinate must be aligned vertically');
  assert.strictEqual(stairGF.y, stairF2.y, 'Staircase Y coordinate must be aligned vertically');
  assert.strictEqual(stairGF.width, stairF2.width, 'Staircase width must match across floors');
  assert.strictEqual(stairGF.length, stairF2.length, 'Staircase length must match across floors');

  // Verify non-overlap on both floors
  const v3_gf = validateLayout(plan3.floors[0].rooms, plan3.floors[0].boundary.width, plan3.floors[0].boundary.length);
  const v3_f2 = validateLayout(plan3.floors[1].rooms, plan3.floors[1].boundary.width, plan3.floors[1].boundary.length);
  assert.strictEqual(v3_gf.isValid, true, 'GF layout must be valid');
  assert.strictEqual(v3_f2.isValid, true, 'F2 layout must be valid');

  console.log(`  ✔ 4 BHK properly distributed (GF: ${plan3.floors[0].rooms.filter(r => r.type.includes('bed')).length}, F2: ${plan3.floors[1].rooms.filter(r => r.type.includes('bed')).length}).`);
  console.log(`  ✔ Staircase vertically locked at (${stairGF.x}, ${stairGF.y}, ${stairGF.width}x${stairGF.length}) across all floors.`);
  passedTests++;

  // -------------------------------------------------------------------------
  // TEST 4: G+2 Triplex, 5 BHK, 4 Bath (3 Floors Allocation)
  // -------------------------------------------------------------------------
  console.log('\n▶ TEST 4: G+2 Triplex, 5 BHK, 4 Bath (Distribution Across 3 Floors)...');
  const project4 = {
    name: '5 BHK Luxury Triplex',
    plot: { length: 60, width: 40, setbacks: { front: 6, rear: 4, left: 3, right: 3 } },
    accommodation: {
      floors: 3,
      bedrooms: 5,
      bathrooms: 4,
      livingRoom: true,
      diningRoom: true,
      kitchen: true,
      poojaRoom: true,
      parking: true,
      balcony: true,
      utilityArea: true,
      studyRoom: true,
      staircase: true
    }
  };

  const plan4 = generateGeometricFloorPlan(project4);
  assert.strictEqual(plan4.floors.length, 3, 'Must generate exactly 3 floors');

  let totalBeds4 = 0;
  let totalBaths4 = 0;
  const bedNamesAll = [];

  plan4.floors.forEach((fl, i) => {
    const beds = fl.rooms.filter(r => r.type === 'master_bedroom' || r.type === 'bedroom');
    const baths = fl.rooms.filter(r => r.type === 'bathroom');
    totalBeds4 += beds.length;
    totalBaths4 += baths.length;
    beds.forEach(b => bedNamesAll.push(b.name));
    console.log(`    - ${fl.floorName}: ${beds.length} Bed(s), ${baths.length} Bath(s), Total ${fl.rooms.length} spaces`);
  });

  assert.strictEqual(totalBeds4, 5, `Total bedrooms across 3 floors must equal 5 (Found: ${totalBeds4})`);
  assert.strictEqual(totalBaths4, 4, `Total bathrooms across 3 floors must equal 4 (Found: ${totalBaths4})`);

  // Verify no duplicate bedroom names
  const uniqueBedNames = new Set(bedNamesAll);
  assert.strictEqual(uniqueBedNames.size, 5, `All 5 bedrooms must have unique names (Found: ${Array.from(uniqueBedNames).join(', ')})`);

  // Verify staircase alignment across all 3 floors
  const stairs = plan4.floors.map(fl => fl.rooms.find(r => r.type === 'staircase'));
  assert.strictEqual(stairs.length, 3, 'Staircase must exist on all 3 floors');
  assert.strictEqual(stairs[0].x, stairs[1].x);
  assert.strictEqual(stairs[1].x, stairs[2].x);
  assert.strictEqual(stairs[0].y, stairs[1].y);
  assert.strictEqual(stairs[1].y, stairs[2].y);

  console.log(`  ✔ Exact 5 BHK & 4 Bath allocation across 3 floors. All bedrooms unique. 3-floor staircase locked.`);
  passedTests++;

  // -------------------------------------------------------------------------
  // TEST 5: Spatial Infeasibility Detection (Requirement 5)
  // Tiny 15x15 plot with 5 BHK -> Must honestly report infeasibility warning!
  // -------------------------------------------------------------------------
  console.log('\n▶ TEST 5: Spatial Infeasibility Detection (Tiny Plot with Overcrowded Request)...');
  const infeasibleProject = {
    name: 'Impossible 5 BHK Tiny Plot',
    plot: { length: 18, width: 16, setbacks: { front: 3, rear: 2, left: 2, right: 2 } },
    accommodation: {
      floors: 1,
      bedrooms: 5,
      bathrooms: 4,
      livingRoom: true,
      diningRoom: true,
      kitchen: true,
      parking: true
    }
  };

  const infeasiblePlan = generateGeometricFloorPlan(infeasibleProject);
  assert.strictEqual(infeasiblePlan.validation.isFeasible, false, 'Engine must flag isFeasible: false for impossible footprint');
  assert.ok(infeasiblePlan.validation.feasibilityWarning, 'Must provide an explicit feasibility warning');
  console.log(`  ✔ Feasibility conflict detected correctly:`);
  console.log(`    "${infeasiblePlan.validation.feasibilityWarning}"`);
  passedTests++;

  // -------------------------------------------------------------------------
  // TEST 6: Editing Project Requirements & Regeneration (Requirement 1 & 6)
  // -------------------------------------------------------------------------
  console.log('\n▶ TEST 6: Editing Project Requirements & Floor Plan Regeneration...');
  const initialProject = {
    name: 'Evolving Home',
    plot: { length: 45, width: 30, setbacks: { front: 5, rear: 3, left: 3, right: 3 } },
    accommodation: {
      floors: 1,
      bedrooms: 2,
      bathrooms: 1,
      livingRoom: true,
      diningRoom: false,
      kitchen: true,
      poojaRoom: false,
      parking: false
    }
  };

  const initialPlan = generateGeometricFloorPlan(initialProject);
  assert.strictEqual(initialPlan.floors.length, 1);
  const initialBeds = initialPlan.floors[0].rooms.filter(r => r.type.includes('bed')).length;
  assert.strictEqual(initialBeds, 2, 'Initial plan must have 2 bedrooms');

  // User edits requirements to 4 BHK Duplex with Parking and Pooja
  const updatedProject = {
    ...initialProject,
    accommodation: {
      floors: 2,
      bedrooms: 4,
      bathrooms: 3,
      livingRoom: true,
      diningRoom: true,
      kitchen: true,
      poojaRoom: true,
      parking: true
    }
  };

  const regeneratedPlan = generateGeometricFloorPlan(updatedProject);
  assert.strictEqual(regeneratedPlan.floors.length, 2, 'Regenerated plan must have 2 floors');
  let regBeds = 0;
  let regBaths = 0;
  regeneratedPlan.floors.forEach(fl => {
    regBeds += fl.rooms.filter(r => r.type.includes('bed')).length;
    regBaths += fl.rooms.filter(r => r.type === 'bathroom').length;
  });
  assert.strictEqual(regBeds, 4, `Regenerated plan must reflect 4 bedrooms (Found: ${regBeds})`);
  assert.strictEqual(regBaths, 3, `Regenerated plan must reflect 3 bathrooms (Found: ${regBaths})`);
  assert.ok(regeneratedPlan.floors[0].rooms.some(r => r.type === 'parking'), 'Regenerated plan must now include parking');
  assert.ok(regeneratedPlan.floors[0].rooms.some(r => r.type === 'pooja'), 'Regenerated plan must now include pooja');

  console.log(`  ✔ Dynamic regeneration verified: Changed from 1 Floor / 2 Beds -> 2 Floors / 4 Beds.`);
  passedTests++;

  // -------------------------------------------------------------------------
  // TEST 7: Mathematical SVG Blueprint Rendering & Dimension Lines
  // -------------------------------------------------------------------------
  console.log('\n▶ TEST 7: SVG Blueprint Vector Output & Floor Separation...');
  assert.ok(regeneratedPlan.floors[0].svgContent.includes('<svg'), 'Floor 1 must contain valid SVG markup');
  assert.ok(regeneratedPlan.floors[1].svgContent.includes('<svg'), 'Floor 2 must contain valid SVG markup');
  assert.ok(regeneratedPlan.floors[0].svgContent.includes('Master Bedroom'), 'Floor 1 SVG must render Master Bedroom');
  assert.ok(regeneratedPlan.floors[1].svgContent.includes('Bedroom 3'), 'Floor 2 SVG must render Bedroom 3');
  assert.ok(regeneratedPlan.floors[0].svgContent.includes('PLOT BOUNDARY'), 'SVG must include plot boundary');
  console.log(`  ✔ Vector SVG contains separate blueprint drawings per floor with precise annotations.`);
  passedTests++;

  console.log(`\n================================================================`);
  console.log(`  ALL ${passedTests}/${passedTests} DYNAMIC REQUIREMENTS TESTS PASSED WITH 100% SUCCESS!`);
  console.log(`================================================================\n`);
}

if (require.main === module) {
  runDynamicFloorPlanTests();
}

module.exports = { runDynamicFloorPlanTests };
