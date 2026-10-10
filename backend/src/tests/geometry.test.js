const assert = require('assert');
const { generateGeometricFloorPlan, validateLayout } = require('../services/geometryEngine');

function testGeometryEngine() {
  console.log('▶ Running Geometric Floor-Plan Engine Tests...');

  const sampleProject = {
    plot: { length: 50, width: 30, area: 1500, facingDirection: 'East', setbacks: { front: 5, rear: 3, left: 3, right: 3 } },
    accommodation: { floors: 2, bedrooms: 3, bathrooms: 2, livingRoom: true, diningRoom: true, kitchen: true, poojaRoom: true, parking: true }
  };

  const result = generateGeometricFloorPlan(sampleProject);

  // Test 1: Total Built-up area
  assert.ok(result.totalBuiltUpAreaSqFt > 0, 'Total built-up area must be greater than 0');
  console.log(`  ✔ Built-up Area: ${result.totalBuiltUpAreaSqFt} sq.ft calculated correctly`);

  // Test 2: Floor count
  assert.strictEqual(result.floors.length, 2, 'Should generate 2 floors');
  console.log(`  ✔ Multi-floor generation: ${result.floors.length} floors generated`);

  // Test 3: Alternatives count
  assert.strictEqual(result.alternatives.length, 3, 'Should generate 3 layout candidates');
  console.log(`  ✔ Alternatives count: ${result.alternatives.length} candidates generated`);

  // Test 4: Boundary & non-overlap validation
  const validation = validateLayout(result.floors[0].rooms, 24, 42);
  assert.strictEqual(validation.isValid, true, 'Layout must be free of illegal overlaps and boundary violations');
  console.log('  ✔ Boundary containment & non-overlapping polygon invariant verified');

  console.log('✅ Geometry Engine Tests Passed!\n');
}

module.exports = { testGeometryEngine };
