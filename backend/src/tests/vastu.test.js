const assert = require('assert');
const { evaluateVastuCompliance } = require('../services/vastuEngine');
const { generateGeometricFloorPlan } = require('../services/geometryEngine');

function testVastuEngine() {
  console.log('▶ Running Vastu Shastra Engine Tests...');

  const sampleProject = {
    plot: { length: 50, width: 30, facingDirection: 'East' },
    vastuPreferences: { enabled: true, entranceZone: 'NE' },
    accommodation: { floors: 1, bedrooms: 2, bathrooms: 2, livingRoom: true, kitchen: true, poojaRoom: true }
  };

  const floorPlan = generateGeometricFloorPlan(sampleProject);
  const vastu = evaluateVastuCompliance(sampleProject, floorPlan);

  // Test 1: Overall Score range
  assert.ok(vastu.overallScore >= 0 && vastu.overallScore <= 100, 'Score must be between 0 and 100');
  console.log(`  ✔ Overall Vastu Score: ${vastu.overallScore}/100 (${vastu.grade})`);

  // Test 2: Evaluations presence
  assert.ok(vastu.evaluations.length > 0, 'Should evaluate multiple architectural rules');
  console.log(`  ✔ Evaluated ${vastu.evaluations.length} architectural room rules`);

  // Test 3: Entrance check
  const entranceEval = vastu.evaluations.find(e => e.roomType === 'entrance');
  assert.ok(entranceEval, 'Entrance rule must be evaluated');
  assert.strictEqual(entranceEval.status, 'OPTIMAL', 'NE entrance should be evaluated as OPTIMAL');
  console.log('  ✔ Entrance NE orientation correctly identified as OPTIMAL');

  console.log('✅ Vastu Engine Tests Passed!\n');
}

module.exports = { testVastuEngine };
