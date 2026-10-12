const assert = require('assert');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/authMiddleware');
const { createProject } = require('../controllers/projectController');
const { generateFloorPlan } = require('../controllers/floorPlanController');
const fallbackDb = require('../services/fallbackDb');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secure_jwt_secret_key_house_design_major_project_2026';

// Helper to create mock Express req/res/next objects
function createMockHttp({ headers = {}, query = {}, body = {}, params = {}, user = null } = {}) {
  const req = {
    headers: { ...headers },
    query: { ...query },
    body: { ...body },
    params: { ...params },
    user
  };

  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };

  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  return { req, res, next, wasNextCalled: () => nextCalled };
}

async function runAuthWorkflowTests() {
  console.log('================================================================');
  console.log('  TEST SUITE: AUTHENTICATION, TOKEN EXPIRY & WIZARD WORKFLOW    ');
  console.log('================================================================\n');

  // Seed a test user in fallbackDb
  const testUser = await fallbackDb.users.create({
    name: 'Architect Rahul Sharma',
    email: 'rahul.architect@housedesign.ai',
    password: 'hashed_password_123',
    role: 'user'
  });

  const userId = testUser._id || testUser.id;

  // 1. Test Missing Token
  console.log('▶ TEST 1: Missing Authorization Token...');
  {
    const { req, res, next, wasNextCalled } = createMockHttp({ headers: {} });
    await protect(req, res, next);
    assert.strictEqual(res.statusCode, 401, 'Should return 401 when no token is present');
    assert.strictEqual(res.body?.code, 'NO_TOKEN', 'Error code must be NO_TOKEN');
    assert.strictEqual(wasNextCalled(), false, 'Next must not be called');
    console.log('  ✔ Handled missing token: 401 with code NO_TOKEN');
  }

  // 2. Test Literal "null", "undefined", and Whitespace Tokens
  console.log('▶ TEST 2: String "null", "undefined", and Whitespace Tokens...');
  {
    for (const badToken of ['Bearer null', 'Bearer undefined', 'Bearer    ', 'Bearer ']) {
      const { req, res, next, wasNextCalled } = createMockHttp({ headers: { authorization: badToken } });
      await protect(req, res, next);
      assert.strictEqual(res.statusCode, 401, `Should return 401 for ${badToken}`);
      assert.strictEqual(res.body?.code, 'NO_TOKEN', `Code must be NO_TOKEN for ${badToken}`);
      assert.strictEqual(wasNextCalled(), false);
    }
    console.log('  ✔ Handled malformed/empty token strings: Correctly rejected as NO_TOKEN');
  }

  // 3. Test Expired Token
  console.log('▶ TEST 3: Expired Token Rejection (Root Cause Reproduction)...');
  {
    // Generate token expired 1 hour ago
    const expiredToken = jwt.sign(
      { id: userId },
      JWT_SECRET,
      { expiresIn: '-1h' }
    );

    const { req, res, next, wasNextCalled } = createMockHttp({
      headers: { authorization: `Bearer ${expiredToken}` }
    });
    await protect(req, res, next);
    assert.strictEqual(res.statusCode, 401, 'Must return 401 for expired token');
    assert.strictEqual(res.body?.code, 'TOKEN_EXPIRED', 'Error code must be TOKEN_EXPIRED');
    assert.strictEqual(res.body?.message, 'Not authorized, token failed or expired', 'Error message must match standard');
    assert.strictEqual(wasNextCalled(), false);
    console.log(`  ✔ Successfully reproduced and verified 401 TOKEN_EXPIRED: "${res.body?.message}"`);
  }

  // 4. Test Malformed / Invalid Signature Token
  console.log('▶ TEST 4: Malformed Token Signature...');
  {
    const invalidToken = jwt.sign({ id: userId }, 'completely_wrong_secret_key');
    const { req, res, next, wasNextCalled } = createMockHttp({
      headers: { authorization: `Bearer ${invalidToken}` }
    });
    await protect(req, res, next);
    assert.strictEqual(res.statusCode, 401, 'Must return 401 for invalid signature');
    assert.strictEqual(res.body?.code, 'TOKEN_INVALID', 'Error code must be TOKEN_INVALID');
    assert.strictEqual(wasNextCalled(), false);
    console.log('  ✔ Handled invalid signature: 401 with code TOKEN_INVALID');
  }

  // 5. Test Valid Token Authentication
  console.log('▶ TEST 5: Valid Login Token Verification...');
  let validToken;
  {
    validToken = jwt.sign(
      { id: userId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { req, res, next, wasNextCalled } = createMockHttp({
      headers: { authorization: `Bearer ${validToken}` }
    });
    await protect(req, res, next);
    assert.strictEqual(wasNextCalled(), true, 'Next must be called for valid token');
    assert.ok(req.user, 'req.user must be populated');
    assert.strictEqual(req.user.email, 'rahul.architect@housedesign.ai');
    console.log(`  ✔ Valid token successfully authenticated user: ${req.user.name}`);
  }

  // 6. Test Protected Project Creation & Dynamic Floor Plan Generation with Wizard Values
  console.log('▶ TEST 6: Project Creation with Custom Wizard Requirements...');
  let createdProjectId;
  {
    // Custom non-default requirements entered in wizard
    const wizardPayload = {
      name: 'Custom Lakeside Villa',
      location: 'Hyderabad, Telangana',
      pincode: '500081',
      budget: 4500000,
      description: 'Modern 3-floor family residence with rooftop terrace, pooja room, and home office.',
      plot: {
        length: 60,
        width: 40,
        shape: 'RECTANGULAR',
        facingDirection: 'North',
        roadAccess: 'Front 40ft Main Road',
        setbacks: { front: 6, rear: 4, left: 4, right: 4 }
      },
      accommodation: {
        floors: 3,
        bedrooms: 4,
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
        otherRequirements: 'Solar panels and rainwater harvesting',
        familyMembers: 5
      },
      preferences: {
        style: 'Modern Minimalist',
        flooring: 'Italian Marble Finish Vitrified',
        kitchen: 'Island Open Modular Kitchen',
        interiorColours: 'Warm Gray, Teak & Brushed Brass',
        furnitureStyle: 'Contemporary Scandinavian',
        lighting: 'Warm Recessed LED Coves',
        ventilation: 'Cross-Ventilation Focused',
        energyEfficiency: 'Solar Ready'
      },
      vastuPreferences: {
        enabled: true,
        entranceZone: 'NE',
        kitchenOrientation: 'SE',
        masterBedroomOrientation: 'SW',
        poojaOrientation: 'NE',
        staircasePlacement: 'S'
      },
      selectedPackage: 'RICH'
    };

    const { req, res } = createMockHttp({
      body: wizardPayload,
      user: { _id: userId, role: 'user' }
    });

    await createProject(req, res);
    assert.strictEqual(res.statusCode, 201, 'Project creation must return 201 Created');
    assert.strictEqual(res.body?.success, true);
    assert.ok(res.body?.project, 'Must return created project object');

    const proj = res.body.project;
    createdProjectId = proj._id;

    // Verify wizard parameters are preserved exactly
    assert.strictEqual(proj.name, 'Custom Lakeside Villa');
    assert.strictEqual(proj.plot.length, 60);
    assert.strictEqual(proj.plot.width, 40);
    assert.strictEqual(proj.plot.area, 2400);
    assert.strictEqual(proj.plot.facingDirection, 'North');
    assert.strictEqual(proj.accommodation.floors, 3);
    assert.strictEqual(proj.accommodation.bedrooms, 4);
    assert.strictEqual(proj.accommodation.bathrooms, 3);
    assert.strictEqual(proj.accommodation.poojaRoom, true);
    assert.strictEqual(proj.accommodation.studyRoom, true);
    assert.strictEqual(proj.preferences.style, 'Modern Minimalist');
    assert.strictEqual(proj.selectedPackage, 'RICH');

    // Verify dynamically generated floor plan matching the 3 floors and 4 BHK
    const floorPlan = await fallbackDb.floorPlans.findById(proj.activeFloorPlanId);
    assert.ok(floorPlan, 'Active floor plan must be initialized and persisted in database');
    assert.strictEqual(floorPlan.floors.length, 3, 'Floor plan must have exactly 3 floors as requested');

    const allRooms = floorPlan.floors.flatMap(f => f.rooms);
    const bedrooms = allRooms.filter(r => r.type === 'bedroom' || r.type === 'master_bedroom');
    const bathrooms = allRooms.filter(r => r.type === 'bathroom');
    const poojaRooms = allRooms.filter(r => r.type === 'pooja');
    const studyRooms = allRooms.filter(r => r.type === 'study');

    assert.strictEqual(bedrooms.length, 4, `Must have exactly 4 bedrooms matching wizard input (got ${bedrooms.length})`);
    assert.strictEqual(bathrooms.length, 3, `Must have exactly 3 bathrooms matching wizard input (got ${bathrooms.length})`);
    assert.strictEqual(poojaRooms.length, 1, 'Must include requested Pooja Room');
    assert.strictEqual(studyRooms.length, 1, 'Must include requested Study / Home Office Room');

    console.log(`  ✔ Project created successfully with dynamic floor plans:`);
    const estimates = await fallbackDb.costEstimates.find({ projectId: proj._id });
    const boq = estimates[estimates.length - 1];
    assert.ok(boq, 'BOQ estimate must be saved in database');
    console.log(`    - Plot: ${proj.plot.width}x${proj.plot.length} (${proj.plot.area} sq.ft)`);
    console.log(`    - Floors: ${floorPlan.floors.length} | Bedrooms: ${bedrooms.length} | Bathrooms: ${bathrooms.length}`);
    console.log(`    - Selected Amenities: Pooja (${poojaRooms.length}), Study (${studyRooms.length})`);
    console.log(`    - BOQ Cost Estimate: ₹${boq.totalEstimatedCost.toLocaleString('en-IN')}`);
  }

  // 7. Test Floor-Plan Generation Re-invocation with Fresh Token
  console.log('▶ TEST 7: Floor-Plan Regeneration Endpoint Authorization & Dynamic Output...');
  {
    const { req, res } = createMockHttp({
      params: { projectId: createdProjectId },
      user: { _id: userId, role: 'user' }
    });

    await generateFloorPlan(req, res);
    assert.strictEqual(res.statusCode, 200, 'Regeneration must return 200 OK');
    assert.strictEqual(res.body?.success, true);
    assert.strictEqual(res.body?.floorPlan.floors.length, 3);
    console.log('  ✔ Regenerated floor plan with fresh token verified matching user requirements');
  }

  // 8. Test Floor-Plan Generation by Unauthorized Foreign User is Rejected
  console.log('▶ TEST 8: Unauthorized Foreign User Access Prevention...');
  {
    const foreignUser = await fallbackDb.users.create({
      name: 'Unrelated User',
      email: 'stranger@example.com',
      password: 'pass',
      role: 'user'
    });

    const { req, res } = createMockHttp({
      params: { projectId: createdProjectId },
      user: { _id: foreignUser._id, role: 'user' }
    });

    await generateFloorPlan(req, res);
    assert.strictEqual(res.statusCode, 403, 'Foreign user must receive 403 Forbidden');
    console.log('  ✔ Protected against unauthorized foreign user access: 403 Forbidden');
  }

  console.log('\n================================================================');
  console.log('  ALL 8/8 AUTHENTICATION & WIZARD WORKFLOW TESTS PASSED!        ');
  console.log('================================================================\n');
}

module.exports = { runAuthWorkflowTests };

if (require.main === module) {
  runAuthWorkflowTests().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  });
}
