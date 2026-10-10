const assert = require('assert');
const { calculateProjectBOQ } = require('../services/boqCalculator');

function testBoqEngine() {
  console.log('▶ Running Bill of Quantities (BOQ) & Cost Estimation Tests...');

  const sampleProject = {
    budget: 3500000,
    accommodation: { floors: 1, bedrooms: 3, bathrooms: 2 }
  };

  const sampleFloorPlan = {
    totalBuiltUpAreaSqFt: 1500,
    groundFloorAreaSqFt: 1500
  };

  const boq = calculateProjectBOQ(sampleProject, sampleFloorPlan, 'MEDIUM');

  // Test 1: Total cost calculation
  assert.ok(boq.totalEstimatedCost > 0, 'Total cost must be greater than 0');
  console.log(`  ✔ Total Estimated Cost: ₹${boq.totalEstimatedCost.toLocaleString('en-IN')} (₹${boq.costPerSqFt}/sq.ft)`);

  // Test 2: Steel structural quantity benchmark (~3.8 kg/sq.ft -> ~5700 kg)
  const steelItem = boq.boqLineItems.find(i => i.code === 'BOQ-04');
  assert.ok(steelItem, 'Steel reinforcement line item must exist');
  assert.ok(steelItem.quantity >= 5000 && steelItem.quantity <= 7000, 'Steel quantity should align with structural code');
  console.log(`  ✔ Steel Reinforcement: ${steelItem.quantity} kg (${steelItem.purchasableQuantity} kg with 4% wastage)`);

  // Test 3: Cement bag benchmark (~0.42 bags/sqft -> ~630 bags)
  const cementItem = boq.boqLineItems.find(i => i.code === 'BOQ-03');
  assert.ok(cementItem, 'Cement line item must exist');
  assert.ok(cementItem.quantity >= 550 && cementItem.quantity <= 750, 'Cement quantity must match standard coverage');
  console.log(`  ✔ Cement: ${cementItem.quantity} bags (${cementItem.purchasableQuantity} bags purchasable)`);

  // Test 4: Package tier hierarchy (Basic < Medium < Rich)
  assert.ok(boq.packages.basic.totalCost < boq.packages.medium.totalCost, 'Basic package cost must be less than Medium');
  assert.ok(boq.packages.medium.totalCost < boq.packages.rich.totalCost, 'Medium package cost must be less than Rich');
  console.log(`  ✔ 3-Tier Hierarchy: Basic (₹${boq.packages.basic.costPerSqFt}) < Medium (₹${boq.packages.medium.costPerSqFt}) < Rich (₹${boq.packages.rich.costPerSqFt})`);

  console.log('✅ BOQ Engine Tests Passed!\n');
}

module.exports = { testBoqEngine };
