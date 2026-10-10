const vastuRules = require('../data/vastuRulesCatalogue.json');

/**
 * Vastu Shastra Orientation & Compliance Analysis Engine
 */
function evaluateVastuCompliance(project, floorPlan) {
  const facing = project.plot?.facingDirection || 'East';
  const groundFloor = floorPlan?.floors?.[0] || {};
  const rooms = groundFloor.rooms || [];

  const evaluations = [];
  let totalScore = 0;
  let ruleCount = 0;

  vastuRules.rules.forEach(rule => {
    // Find room matching this rule
    let matchedRoom = null;
    if (rule.roomType === 'entrance') {
      // Entrance inferred from facing or front door
      matchedRoom = { name: 'Main Entrance', vastuZone: project.vastuPreferences?.entranceZone || (facing === 'East' ? 'NE' : facing === 'North' ? 'N' : 'E') };
    } else {
      matchedRoom = rooms.find(r => r.type === rule.roomType || (rule.roomType === 'bathroom' && r.type === 'bathroom'));
    }

    if (matchedRoom) {
      ruleCount++;
      const allocatedZone = matchedRoom.vastuZone || 'NE';
      let status = 'NON_COMPLIANT';
      let score = 30;

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

      totalScore += score;

      const suggestedRemedy = rule.remedies?.[allocatedZone] || 
        (status === 'NON_COMPLIANT' ? `Consider repositioning ${rule.displayName} to ${rule.bestZones.join(' or ')} zone for optimal spatial alignment.` : 'Placement satisfies core guidelines.');

      evaluations.push({
        ruleId: rule.id,
        roomType: rule.roomType,
        roomName: matchedRoom.name || rule.displayName,
        allocatedZone,
        recommendedZones: rule.bestZones,
        status,
        score,
        priority: rule.priority,
        explanation: rule.explanation,
        suggestedRemedy
      });
    }
  });

  const overallScore = ruleCount > 0 ? Math.round(totalScore / ruleCount) : 85;
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
    orientationSummary: {
      plotFacing: facing,
      entranceDirection: project.vastuPreferences?.entranceZone || 'NE',
      kitchenDirection: 'SE',
      masterBedroomDirection: 'SW',
      poojaRoomDirection: 'NE',
      waterSourceDirection: 'NE'
    },
    evaluations,
    generalRecommendations
  };
}

module.exports = { evaluateVastuCompliance };
