const assert = require('assert');
const {
  generateProjectStages,
  evaluateStageEligibility,
  computeProjectProgressMetrics
} = require('../services/dependencyEngine');

function testDependencyEngine() {
  console.log('▶ Running Construction Dependency & Progress Tests...');

  const stages = generateProjectStages('test_proj_1', 3500000);

  // Test 1: Stage count
  assert.strictEqual(stages.length, 21, 'Must generate exactly 21 standardized construction stages');
  console.log(`  ✔ Generated ${stages.length} standardized construction milestones`);

  // Test 2: Dependency eligibility for stage 1 (Pre-construction has 0 deps)
  const stg1Eligibility = evaluateStageEligibility(stages[0], stages);
  assert.strictEqual(stg1Eligibility.eligible, true, 'Stage 1 should be eligible immediately');
  console.log('  ✔ Stage 1 (Planning & Approvals) is eligible with 0 prerequisite blockers');

  // Test 3: Blocked stage eligibility (e.g. Roof concrete before slab formwork)
  const roofConcreteStage = stages.find(s => s.code === 'STG-10');
  const roofEligibility = evaluateStageEligibility(roofConcreteStage, stages);
  assert.strictEqual(roofEligibility.eligible, false, 'Roof concrete pouring must be blocked when prerequisite slab centering is incomplete');
  console.log(`  ✔ Stage 10 (Roof Slab Pouring) blocked correctly by prerequisite: ${roofEligibility.blockingStages.join(', ')}`);

  // Test 4: Overall metrics computation
  const metrics = computeProjectProgressMetrics(stages);
  assert.ok(metrics.overallPercentage >= 0, 'Overall progress metric must compute valid percentage');
  console.log(`  ✔ Metrics: ${metrics.completedCount}/${metrics.totalStages} Completed, Overall ${metrics.overallPercentage}%`);

  console.log('✅ Dependency Engine Tests Passed!\n');
}

module.exports = { testDependencyEngine };
