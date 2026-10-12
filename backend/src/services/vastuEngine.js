const vastuRules = require('../data/vastuRulesCatalogue.json');

/**
 * Maps relative grid cell (col, row) to true cardinal Vastu Zone
 * based on the building's entrance facing direction.
 * In local coordinates: y=0 is Front, y=buildL is Rear; x=0 is Left, x=buildW is Right.
 */
function mapGridToVastuZone(col, row, facing) {
  if (col === 'center' && row === 'mid') {
    return 'CENTER';
  }

  const f = (facing || 'East').toLowerCase();

  // Grid orientation lookup matrix
  const matrices = {
    east: {
      'front-left': 'NE', 'front-center': 'E', 'front-right': 'SE',
      'mid-left': 'N',    'mid-center': 'CENTER', 'mid-right': 'S',
      'rear-left': 'NW',  'rear-center': 'W', 'rear-right': 'SW'
    },
    north: {
      'front-left': 'NW', 'front-center': 'N', 'front-right': 'NE',
      'mid-left': 'W',    'mid-center': 'CENTER', 'mid-right': 'E',
      'rear-left': 'SW',  'rear-center': 'S', 'rear-right': 'SE'
    },
    west: {
      'front-left': 'SW', 'front-center': 'W', 'front-right': 'NW',
      'mid-left': 'S',    'mid-center': 'CENTER', 'mid-right': 'N',
      'rear-left': 'SE',  'rear-center': 'E', 'rear-right': 'NE'
    },
    south: {
      'front-left': 'SE', 'front-center': 'S', 'front-right': 'SW',
      'mid-left': 'E',    'mid-center': 'CENTER', 'mid-right': 'W',
      'rear-left': 'NE',  'rear-center': 'N', 'rear-right': 'NW'
    }
  };

  const activeMatrix = matrices[f] || matrices.east;
  const key = `${row}-${col}`;
  return activeMatrix[key] || 'CENTER';
}

/**
 * Calculates the Vastu Zone of a room from its geometric coordinates.
 */
function calculateRoomVastuZone(room, buildW, buildL, facing) {
  // If the room already has an explicit vastuZone assigned from generator, respect it
  if (room.vastuZone && room.vastuZone !== 'NE' && room.vastuZone !== 'CENTER') {
    return room.vastuZone;
  }

  if (typeof room.x !== 'number' || typeof room.y !== 'number' || !buildW || !buildL) {
    return room.vastuZone || 'NE';
  }

  const cx = room.x + ((room.width || 10) / 2);
  const cy = room.y + ((room.length || 10) / 2);

  const normX = Math.max(0, Math.min(1, cx / buildW));
  const normY = Math.max(0, Math.min(1, cy / buildL));

  const col = normX < 0.35 ? 'left' : (normX > 0.65 ? 'right' : 'center');
  const row = normY < 0.35 ? 'front' : (normY > 0.65 ? 'rear' : 'mid');

  return mapGridToVastuZone(col, row, facing);
}

/**
 * Vastu Shastra Orientation & Geometric Compliance Analysis Engine
 * Evaluates all rooms across all floors against genuine cardinal orientation.
 */
function evaluateVastuCompliance(project, floorPlan) {
  const facing = project.plot?.facingDirection || 'East';
  
  // Collect rooms across all floors
  const floors = floorPlan?.floors || [];
  const allRooms = [];
  let buildW = 0;
  let buildL = 0;

  floors.forEach(fl => {
    if (fl.boundary?.width) buildW = Math.max(buildW, Number(fl.boundary.width));
    if (fl.boundary?.length) buildL = Math.max(buildL, Number(fl.boundary.length));
    (fl.rooms || []).forEach(r => {
      allRooms.push({ ...r, floorName: fl.floorName || 'Ground Floor' });
      if (typeof r.x === 'number' && typeof r.width === 'number') {
        buildW = Math.max(buildW, r.x + r.width);
      }
      if (typeof r.y === 'number' && typeof r.length === 'number') {
        buildL = Math.max(buildL, r.y + r.length);
      }
    });
  });

  if (buildW <= 0) buildW = Number(project.plot?.width || 30) - 6;
  if (buildL <= 0) buildL = Number(project.plot?.length || 50) - 8;

  const evaluations = [];
  let totalWeightedScore = 0;
  let totalWeight = 0;

  // Track room zones for dynamic orientation summary
  const detectedSummary = {
    plotFacing: facing,
    entranceDirection: project.vastuPreferences?.entranceZone || (facing === 'East' ? 'NE' : facing === 'North' ? 'N' : facing === 'West' ? 'W' : 'SE'),
    kitchenDirection: null,
    masterBedroomDirection: null,
    poojaRoomDirection: null,
    waterSourceDirection: 'NE'
  };

  vastuRules.rules.forEach(rule => {
    let matchedRooms = [];

    if (rule.roomType === 'entrance') {
      const entranceZone = project.vastuPreferences?.entranceZone || 
        (facing === 'East' ? 'NE' : facing === 'North' ? 'N' : facing === 'West' ? 'W' : 'SE');
      matchedRooms = [{ name: 'Main Entrance (Simha Dwara)', vastuZone: entranceZone, floorName: 'Ground Floor' }];
    } else {
      matchedRooms = allRooms.filter(r => r.type === rule.roomType);
      // Fallback matching by name if type didn't catch it
      if (matchedRooms.length === 0) {
        matchedRooms = allRooms.filter(r => (r.name || '').toLowerCase().includes(rule.roomType.replace(/_/g, ' ')));
      }
    }

    matchedRooms.forEach(room => {
      const allocatedZone = calculateRoomVastuZone(room, buildW, buildL, facing);
      
      // Update dynamic orientation summary
      if (rule.roomType === 'kitchen' && !detectedSummary.kitchenDirection) {
        detectedSummary.kitchenDirection = allocatedZone;
      } else if (rule.roomType === 'master_bedroom' && !detectedSummary.masterBedroomDirection) {
        detectedSummary.masterBedroomDirection = allocatedZone;
      } else if (rule.roomType === 'pooja' && !detectedSummary.poojaRoomDirection) {
        detectedSummary.poojaRoomDirection = allocatedZone;
      }

      let status = 'NON_COMPLIANT';
      let score = 35;

      if (rule.bestZones.includes(allocatedZone)) {
        status = 'OPTIMAL';
        score = 100;
      } else if (rule.neutralZones && rule.neutralZones.includes(allocatedZone)) {
        status = 'ACCEPTABLE';
        score = 75;
      } else {
        status = 'NON_COMPLIANT';
        score = 35;
      }

      const weight = rule.priority === 'HIGH' ? 1.5 : (rule.priority === 'MEDIUM' ? 1.0 : 0.7);
      totalWeightedScore += score * weight;
      totalWeight += weight;

      const suggestedRemedy = rule.remedies?.[allocatedZone] || 
        (status === 'NON_COMPLIANT' 
          ? `Consider repositioning ${rule.displayName} toward ${rule.bestZones.join(' or ')} zone, or ensure enhanced cross-ventilation and calming neutral wall hues.`
          : 'Placement satisfies core architectural cross-ventilation and solar orientation principles.');

      evaluations.push({
        ruleId: rule.id,
        roomType: rule.roomType,
        roomName: `${room.name || rule.displayName} (${room.floorName})`,
        allocatedZone,
        recommendedZones: rule.bestZones,
        neutralZones: rule.neutralZones || [],
        status,
        score,
        priority: rule.priority,
        explanation: rule.explanation,
        suggestedRemedy
      });
    });
  });

  // Fill in any undetected orientation summary items
  if (!detectedSummary.kitchenDirection) detectedSummary.kitchenDirection = 'SE';
  if (!detectedSummary.masterBedroomDirection) detectedSummary.masterBedroomDirection = 'SW';
  if (!detectedSummary.poojaRoomDirection) detectedSummary.poojaRoomDirection = 'NE';

  const overallScore = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 82;
  
  let grade = 'GOOD';
  if (overallScore >= 90) grade = 'EXCELLENT';
  else if (overallScore >= 78) grade = 'VERY_GOOD';
  else if (overallScore >= 65) grade = 'GOOD';
  else grade = 'NEEDS_ADJUSTMENT';

  const generalRecommendations = [
    'Ensure center (Brahmasthan) remains free of heavy load-bearing structural columns and plumbing shafts.',
    'Keep North-East zone clutter-free and well-illuminated to promote positive natural morning light.',
    'Heavy furniture and master bed headboard should face South or West to align with geomagnetic fields.',
    'Direct ventilation from East and North supports thermal comfort and indoor air quality.'
  ];

  return {
    overallScore,
    grade,
    orientationSummary: detectedSummary,
    evaluations,
    generalRecommendations,
    disclaimer: 'Vastu Shastra provides spatial planning principles for cross-ventilation, thermal comfort, and solar orientation. It is an architectural guideline and does not replace certified structural engineering.'
  };
}

module.exports = { 
  evaluateVastuCompliance,
  calculateRoomVastuZone,
  mapGridToVastuZone 
};
