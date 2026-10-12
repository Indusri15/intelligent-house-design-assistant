/**
 * Construction Milestone & Dependency Tracking Engine
 * Standard 21 stages with topological dependency resolution.
 */

const DEFAULT_STAGES = [
  {
    order: 1,
    code: 'STG-01',
    name: 'Planning, Architecture & Municipal Approvals',
    category: 'Pre-Construction',
    dependencies: [],
    requiredMaterials: [
      { name: 'Architectural Blueprints & Sanction Drawings', quantity: '4 sets', status: 'Pending' },
      { name: 'Municipal Building Permit Approval', quantity: '1 document', status: 'Pending' }
    ]
  },
  {
    order: 2,
    code: 'STG-02',
    name: 'Site Survey, Boundary Demarcation & Soil Testing',
    category: 'Pre-Construction',
    dependencies: ['STG-01'],
    requiredMaterials: [
      { name: 'Total Station Survey Equipment', quantity: '1 set', status: 'Pending' },
      { name: 'Boundary Marker Pegs & Lime Powder', quantity: '5 bags', status: 'Pending' }
    ]
  },
  {
    order: 3,
    code: 'STG-03',
    name: 'Site Clearing, Leveling & Temporary Shed Setup',
    category: 'Pre-Construction',
    dependencies: ['STG-02'],
    requiredMaterials: [
      { name: 'JCB / Earthmover Excavator', quantity: '2 days', status: 'Pending' },
      { name: 'Temporary Water Supply & Power Meter', quantity: '1 connection', status: 'Pending' }
    ]
  },
  {
    order: 4,
    code: 'STG-04',
    name: 'Earthwork Soil Excavation for Footings',
    category: 'Substructure',
    dependencies: ['STG-03'],
    requiredMaterials: [
      { name: 'Excavation Shovels & Compactor', quantity: '1 unit', status: 'Pending' }
    ]
  },
  {
    order: 5,
    code: 'STG-05',
    name: 'PCC Bedding & Isolated Footing Concrete',
    category: 'Substructure',
    dependencies: ['STG-04'],
    requiredMaterials: [
      { name: 'OPC 53 Cement', quantity: '120 bags', status: 'Pending' },
      { name: 'Fe 550D TMT Rebars (12mm/16mm)', quantity: '1800 kg', status: 'Pending' },
      { name: '20mm Granite Aggregate', quantity: '450 cft', status: 'Pending' }
    ]
  },
  {
    order: 6,
    code: 'STG-06',
    name: 'Plinth Beam Casting & Backfilling',
    category: 'Substructure',
    dependencies: ['STG-05'],
    requiredMaterials: [
      { name: 'Cement & Sand Mortar', quantity: '60 bags', status: 'Pending' },
      { name: 'Anti-Termite Soil Chemical Treatment', quantity: '20 liters', status: 'Pending' }
    ]
  },
  {
    order: 7,
    code: 'STG-07',
    name: 'RCC Column Framing up to Lintel Level',
    category: 'Superstructure',
    dependencies: ['STG-06'],
    requiredMaterials: [
      { name: 'TMT Steel (16mm/20mm)', quantity: '1200 kg', status: 'Pending' },
      { name: 'Steel Column Shuttering Formwork', quantity: '1 set', status: 'Pending' }
    ]
  },
  {
    order: 8,
    code: 'STG-08',
    name: 'Brickwork / AAC Block Masonry (Ground Floor)',
    category: 'Superstructure',
    dependencies: ['STG-07'],
    requiredMaterials: [
      { name: 'Red Clay Bricks / AAC Blocks', quantity: '12000 nos', status: 'Pending' },
      { name: 'M-Sand for Masonry', quantity: '650 cft', status: 'Pending' },
      { name: 'PPC Cement', quantity: '90 bags', status: 'Pending' }
    ]
  },
  {
    order: 9,
    code: 'STG-09',
    name: 'Roof Slab Centering, Shuttering & Steel Reinforcement',
    category: 'Superstructure',
    dependencies: ['STG-08'],
    requiredMaterials: [
      { name: 'Steel Centering Sheets & Props', quantity: '1500 sq.ft', status: 'Pending' },
      { name: 'TMT Slab Rebars (8mm/10mm)', quantity: '1500 kg', status: 'Pending' },
      { name: 'Concealed Electrical PVC Fan Conduits', quantity: '300 ft', status: 'Pending' }
    ]
  },
  {
    order: 10,
    code: 'STG-10',
    name: 'Roof Slab Concrete Pouring & 21-Day Curing',
    category: 'Superstructure',
    dependencies: ['STG-09'],
    requiredMaterials: [
      { name: 'Ready Mix Concrete / M20 Design Mix', quantity: '35 m3', status: 'Pending' },
      { name: 'Curing Compound / Ponding Water Tanks', quantity: '1 unit', status: 'Pending' }
    ]
  },
  {
    order: 11,
    code: 'STG-11',
    name: 'Concealed Electrical & Plumbing Conduit Chipping',
    category: 'Services',
    dependencies: ['STG-10'],
    requiredMaterials: [
      { name: 'Heavy Duty PVC Conduits & Junction Boxes', quantity: '600 ft', status: 'Pending' },
      { name: 'Astral CPVC / UPVC Pipes & Fittings', quantity: '400 ft', status: 'Pending' }
    ]
  },
  {
    order: 12,
    code: 'STG-12',
    name: 'Door & Window Frame Fixing',
    category: 'Finishes',
    dependencies: ['STG-11'],
    requiredMaterials: [
      { name: 'Teak Wood Main Entrance Frame', quantity: '1 set', status: 'Pending' },
      { name: 'Hardwood Internal Door Frames', quantity: '8 sets', status: 'Pending' }
    ]
  },
  {
    order: 13,
    code: 'STG-13',
    name: 'Internal & External 2-Coat Cement Plastering',
    category: 'Finishes',
    dependencies: ['STG-12'],
    requiredMaterials: [
      { name: 'Fine Plaster Sand (Zone-IV)', quantity: '800 cft', status: 'Pending' },
      { name: 'Cement Bags', quantity: '130 bags', status: 'Pending' },
      { name: 'Chicken Wire Mesh for Joints', quantity: '2 rolls', status: 'Pending' }
    ]
  },
  {
    order: 14,
    code: 'STG-14',
    name: 'Terrace & Bathroom Waterproofing Treatment',
    category: 'Finishes',
    dependencies: ['STG-13'],
    requiredMaterials: [
      { name: 'Dr. Fixit Elastomeric Polymer Coating', quantity: '50 kg', status: 'Pending' },
      { name: 'Fiberglass Reinforcement Mesh', quantity: '1200 sq.ft', status: 'Pending' }
    ]
  },
  {
    order: 15,
    code: 'STG-15',
    name: 'Flooring, Vitrified Tiles & Skirting Laying',
    category: 'Finishes',
    dependencies: ['STG-14'],
    requiredMaterials: [
      { name: 'Glazed Vitrified Floor Tiles (4x2 / 2x2)', quantity: '1400 sq.ft', status: 'Pending' },
      { name: 'Tile Adhesive (Laticrete / Roff)', quantity: '35 bags', status: 'Pending' },
      { name: 'Epoxy Joint Grout', quantity: '10 kg', status: 'Pending' }
    ]
  },
  {
    order: 16,
    code: 'STG-16',
    name: 'Bathroom Wall Cladding & Sanitary Fixture Fitting',
    category: 'Finishes',
    dependencies: ['STG-15'],
    requiredMaterials: [
      { name: 'Ceramic Digital Wall Tiles', quantity: '450 sq.ft', status: 'Pending' },
      { name: 'Jaquar / Kohler CP Fittings & Wall-Hung WC', quantity: '2 sets', status: 'Pending' }
    ]
  },
  {
    order: 17,
    code: 'STG-17',
    name: 'Putty, Primer & Final Interior / Exterior Painting',
    category: 'Finishes',
    dependencies: ['STG-13'],
    requiredMaterials: [
      { name: 'Birla White Acrylic Wall Putty', quantity: '20 bags', status: 'Pending' },
      { name: 'Asian Paints Primer & Royale Emulsion', quantity: '80 liters', status: 'Pending' }
    ]
  },
  {
    order: 18,
    code: 'STG-18',
    name: 'Modular Kitchen Countertop & Wardrobe Installation',
    category: 'Finishes',
    dependencies: ['STG-15', 'STG-17'],
    requiredMaterials: [
      { name: 'Marine Ply Cabinets & Hardware', quantity: '1 set', status: 'Pending' },
      { name: 'Polished Black Granite Countertop', quantity: '45 sq.ft', status: 'Pending' },
      { name: 'Bedroom Wardrobes Modular Shutter Units', quantity: '3 sets', status: 'Pending' }
    ]
  },
  {
    order: 19,
    code: 'STG-19',
    name: 'Electrical Wire Pulling, Switches & Lighting Fixtures',
    category: 'Services',
    dependencies: ['STG-17'],
    requiredMaterials: [
      { name: 'Finolex FRLS Copper Wires', quantity: '12 coils', status: 'Pending' },
      { name: 'Modular Switch Plates & MCB Distribution Box', quantity: '1 set', status: 'Pending' },
      { name: 'Warm White LED Recessed Spotlights', quantity: '32 units', status: 'Pending' }
    ]
  },
  {
    order: 20,
    code: 'STG-20',
    name: 'UPVC Window Glazing, Railings & Boundary Gate',
    category: 'Finishes',
    dependencies: ['STG-17'],
    requiredMaterials: [
      { name: '3-Track UPVC Sliding Window Units', quantity: '8 units', status: 'Pending' },
      { name: 'Toughened Glass Balcony Railing', quantity: '25 rft', status: 'Pending' },
      { name: 'WPC CNC Laser Cut Main Entrance Gate', quantity: '1 unit', status: 'Pending' }
    ]
  },
  {
    order: 21,
    code: 'STG-21',
    name: 'Deep Cleaning, Snag List Audit & Key Handover',
    category: 'Handover',
    dependencies: ['STG-18', 'STG-19', 'STG-20'],
    requiredMaterials: [
      { name: 'Final Architectural Quality Certificate', quantity: '1 document', status: 'Pending' },
      { name: 'House Key Set & Operations Manual', quantity: '3 sets', status: 'Pending' }
    ]
  }
];

function generateProjectStages(projectId, totalEstimatedCost = 3500000) {
  return DEFAULT_STAGES.map((stg, idx) => {
    // Proportional cost distribution normalized to exactly 1.00 (100%)
    const costWeights = [0.02, 0.01, 0.02, 0.03, 0.07, 0.06, 0.07, 0.09, 0.07, 0.08, 0.05, 0.03, 0.07, 0.03, 0.07, 0.04, 0.05, 0.07, 0.04, 0.02, 0.01];
    const estimatedCost = Math.round(totalEstimatedCost * (costWeights[idx] || 0.04));

    return {
      projectId,
      stageOrder: stg.order,
      code: stg.code,
      name: stg.name,
      category: stg.category,
      status: idx === 0 ? 'In Progress' : 'Not Started',
      progressPercentage: idx === 0 ? 30 : 0,
      plannedStart: `Month ${Math.floor(idx * 0.4) + 1}`,
      plannedFinish: `Month ${Math.floor(idx * 0.4) + 2}`,
      actualStart: idx === 0 ? new Date().toISOString().split('T')[0] : null,
      actualFinish: null,
      assignedContractor: idx < 6 ? 'Civil Foundation Contractor' : idx < 11 ? 'Structural Concrete Team' : idx < 17 ? 'Finishing & Tile Masonry Team' : 'Interior & MEP Team',
      estimatedCost,
      actualCost: idx === 0 ? Math.round(estimatedCost * 0.25) : 0,
      dependencies: stg.dependencies,
      requiredMaterials: stg.requiredMaterials,
      notes: idx === 0 ? 'Architectural drawings drafted; municipal review in progress.' : '',
      photos: [],
      activityHistory: [
        {
          timestamp: new Date(),
          action: 'Stage Initialized',
          previousStatus: 'None',
          newStatus: idx === 0 ? 'In Progress' : 'Not Started',
          updatedBy: 'System',
          note: 'Initial schedule created.'
        }
      ]
    };
  });
}

/**
 * Validates whether a stage can be started or completed based on prerequisite status
 */
function evaluateStageEligibility(targetStage, allStages) {
  if (!targetStage.dependencies || targetStage.dependencies.length === 0) {
    return { eligible: true, blockingStages: [] };
  }

  const blockingStages = [];
  targetStage.dependencies.forEach(depCode => {
    const depStage = allStages.find(s => s.code === depCode);
    if (!depStage || depStage.status !== 'Completed') {
      blockingStages.push(depStage ? depStage.name : depCode);
    }
  });

  return {
    eligible: blockingStages.length === 0,
    blockingStages
  };
}

/**
 * Computes overall project progress percentage and next recommended task
 */
function computeProjectProgressMetrics(stages) {
  if (!stages || stages.length === 0) {
    return { overallPercentage: 0, nextTask: null, completedCount: 0, totalStages: 0 };
  }

  let totalWeightedProgress = 0;
  let completedCount = 0;
  let nextTask = null;

  stages.forEach(stg => {
    totalWeightedProgress += (stg.progressPercentage || 0);
    if (stg.status === 'Completed') completedCount++;
    if (!nextTask && (stg.status === 'In Progress' || stg.status === 'Ready' || (stg.status === 'Not Started' && evaluateStageEligibility(stg, stages).eligible))) {
      nextTask = stg;
    }
  });

  const overallPercentage = Math.round(totalWeightedProgress / stages.length);

  return {
    overallPercentage,
    completedCount,
    totalStages: stages.length,
    nextTask: nextTask ? { code: nextTask.code, name: nextTask.name, category: nextTask.category, requiredMaterials: nextTask.requiredMaterials } : null
  };
}

module.exports = {
  DEFAULT_STAGES,
  generateProjectStages,
  evaluateStageEligibility,
  computeProjectProgressMetrics
};
