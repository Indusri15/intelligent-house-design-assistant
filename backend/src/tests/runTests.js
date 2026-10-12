const { testGeometryEngine } = require('./geometry.test');
const { runDynamicFloorPlanTests } = require('./floorPlanDynamicRequirements.test');
const { testVastuEngine } = require('./vastu.test');
const { testBoqEngine } = require('./boq.test');
const { testDependencyEngine } = require('./dependency.test');
const { testDesignGenerationSuite } = require('./designGeneration.test');
const { runAuthWorkflowTests } = require('./authWorkflow.test');

console.log('========================================================');
console.log('  Running Automated Test Suites for House Design Core   ');
console.log('========================================================\n');

async function runAllTests() {
  try {
    testGeometryEngine();
    runDynamicFloorPlanTests();
    testVastuEngine();
    testBoqEngine();
    testDependencyEngine();
    await testDesignGenerationSuite();
    await runAuthWorkflowTests();

    console.log('🎉 ALL BACKEND UNIT & INTEGRATION TESTS COMPLETED SUCCESSFULLY! 🎉');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error);
    process.exit(1);
  }
}

runAllTests();
