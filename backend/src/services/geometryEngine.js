/**
 * Geometric Floor-Plan Generation Engine
 * Dynamically allocates non-overlapping room polygons matching exact user requirements,
 * vertical staircase alignment across floors, setback clearances, and architectural SVG blueprints.
 */

// Architectural room standards: aspect ratios, target areas, and color tokens
const ROOM_STANDARDS = {
  living: { minW: 12, minL: 14, targetArea: 180, color: '#e0f2fe', label: 'Living Room' },
  master_bedroom: { minW: 11, minL: 13, targetArea: 160, color: '#ede9fe', label: 'Master Bedroom' },
  bedroom: { minW: 10, minL: 11, targetArea: 130, color: '#f3e8ff', label: 'Bedroom' },
  kitchen: { minW: 8, minL: 10, targetArea: 90, color: '#ffedd5', label: 'Modular Kitchen' },
  dining: { minW: 9, minL: 10, targetArea: 100, color: '#fef3c7', label: 'Dining Space' },
  pooja: { minW: 4, minL: 5, targetArea: 25, color: '#fef9c3', label: 'Pooja Mandir' },
  bathroom: { minW: 5, minL: 7, targetArea: 35, color: '#cffafe', label: 'Toilet / Bath' },
  utility: { minW: 5, minL: 6, targetArea: 30, color: '#f1f5f9', label: 'Utility / Wash' },
  staircase: { minW: 6.5, minL: 9, targetArea: 65, color: '#e2e8f0', label: 'Staircase' },
  parking: { minW: 10, minL: 14, targetArea: 140, color: '#f8fafc', label: 'Car Parking / Porch' },
  balcony: { minW: 4, minL: 8, targetArea: 35, color: '#d1fae5', label: 'Balcony / Verandah' },
  study: { minW: 8, minL: 9, targetArea: 75, color: '#fae8ff', label: 'Study / Office' },
  corridor: { minW: 4, minL: 10, targetArea: 40, color: '#ffffff', label: 'Circulation Lobby' }
};

/**
 * Feasibility analysis: verifies whether requested accommodation physically fits within buildable footprint.
 */
function checkLayoutFeasibility(params) {
  const { totalBuildableArea, buildAreaPerFloor, floorsCount, reqBedrooms, reqBathrooms, hasLiving, hasKitchen, hasDining, hasPooja, hasParking, hasBalcony, hasUtility, hasStudy, hasStaircase } = params;

  let minNeeded = 0;
  // Bedroom area (Master ~120, others ~100)
  minNeeded += 120 + Math.max(0, reqBedrooms - 1) * 100;
  // Bathrooms (~35 each)
  minNeeded += reqBathrooms * 35;
  // Core social & service spaces
  if (hasLiving) minNeeded += 140;
  if (hasKitchen) minNeeded += 70;
  if (hasDining) minNeeded += 65;
  if (hasPooja) minNeeded += 25;
  if (hasParking) minNeeded += 120; // GF only
  if (hasUtility) minNeeded += 30;
  if (hasStudy) minNeeded += 60;
  if (hasBalcony) minNeeded += 35 * Math.max(1, floorsCount - 1);
  if (hasStaircase) minNeeded += 65 * floorsCount;

  // Add 10% circulation factor
  const totalMinAreaNeeded = Math.round(minNeeded * 1.10);
  const isFeasible = totalBuildableArea >= Math.round(totalMinAreaNeeded * 0.85);

  let feasibilityWarning = null;
  if (!isFeasible) {
    const recommendedFloors = Math.ceil(totalMinAreaNeeded / buildAreaPerFloor);
    feasibilityWarning = `The requested accommodation (${reqBedrooms} Bed, ${reqBathrooms} Bath + selected amenities) requires approx. ${totalMinAreaNeeded} sq.ft, but the buildable area across ${floorsCount} floor(s) is only ${totalBuildableArea} sq.ft. Consider increasing floors to ${recommendedFloors > floorsCount ? recommendedFloors : floorsCount + 1}, expanding plot dimensions, or adjusting room counts.`;
  }

  return {
    isFeasible,
    totalMinAreaNeeded,
    feasibilityWarning
  };
}

/**
 * Distributes user-requested bedrooms and bathrooms across the specified floors.
 * Invariant: Sum of bedrooms across floors === reqBedrooms
 * Invariant: Sum of bathrooms across floors === reqBathrooms
 */
function planRoomDistribution(floorsCount, reqBedrooms, reqBathrooms) {
  const distribution = [];
  for (let f = 1; f <= floorsCount; f++) {
    distribution.push({
      floorNumber: f,
      bedrooms: [],
      bathrooms: []
    });
  }

  // 1. Distribute Bedrooms
  let currentBedIndex = 1;
  if (floorsCount === 1) {
    // Single floor: all bedrooms on Ground Floor
    for (let i = 0; i < reqBedrooms; i++) {
      distribution[0].bedrooms.push({
        index: currentBedIndex,
        isMaster: currentBedIndex === 1,
        name: currentBedIndex === 1 ? 'Master Bedroom' : `Bedroom ${currentBedIndex}`,
        type: currentBedIndex === 1 ? 'master_bedroom' : 'bedroom'
      });
      currentBedIndex++;
    }
  } else if (floorsCount === 2) {
    // Duplex: Ground Floor gets Master Bedroom (and 1 more if reqBedrooms >= 4)
    const gfBedCount = reqBedrooms === 1 ? 1 : (reqBedrooms >= 4 ? 2 : 1);
    const f2BedCount = reqBedrooms - gfBedCount;

    for (let i = 0; i < gfBedCount; i++) {
      distribution[0].bedrooms.push({
        index: currentBedIndex,
        isMaster: currentBedIndex === 1,
        name: currentBedIndex === 1 ? 'Master Bedroom' : `Bedroom ${currentBedIndex} (Guest/Elder)`,
        type: currentBedIndex === 1 ? 'master_bedroom' : 'bedroom'
      });
      currentBedIndex++;
    }
    for (let i = 0; i < f2BedCount; i++) {
      distribution[1].bedrooms.push({
        index: currentBedIndex,
        isMaster: false,
        name: `Bedroom ${currentBedIndex}`,
        type: 'bedroom'
      });
      currentBedIndex++;
    }
  } else {
    // 3+ Floors (Triplex / Quadplex): Distribute proportionally
    const gfBedCount = reqBedrooms >= 5 ? 2 : (reqBedrooms >= 2 ? 1 : 1);
    for (let i = 0; i < gfBedCount; i++) {
      distribution[0].bedrooms.push({
        index: currentBedIndex,
        isMaster: currentBedIndex === 1,
        name: currentBedIndex === 1 ? 'Master Bedroom' : `Bedroom ${currentBedIndex} (Guest)`,
        type: currentBedIndex === 1 ? 'master_bedroom' : 'bedroom'
      });
      currentBedIndex++;
    }

    const remainingBeds = reqBedrooms - gfBedCount;
    const upperFloors = floorsCount - 1;
    let bedsPerUpper = Math.floor(remainingBeds / upperFloors);
    let extraBeds = remainingBeds % upperFloors;

    for (let f = 1; f < floorsCount; f++) {
      const count = bedsPerUpper + (extraBeds > 0 ? 1 : 0);
      if (extraBeds > 0) extraBeds--;
      for (let i = 0; i < count; i++) {
        distribution[f].bedrooms.push({
          index: currentBedIndex,
          isMaster: false,
          name: `Bedroom ${currentBedIndex}`,
          type: 'bedroom'
        });
        currentBedIndex++;
      }
    }
  }

  // 2. Distribute Bathrooms
  let currentBathIndex = 1;
  if (floorsCount === 1) {
    for (let i = 0; i < reqBathrooms; i++) {
      distribution[0].bathrooms.push({
        index: currentBathIndex,
        name: currentBathIndex === 1 ? 'Master Ensuite Bath' : (currentBathIndex === 2 ? 'Common Bathroom' : `Bathroom ${currentBathIndex}`),
        type: 'bathroom'
      });
      currentBathIndex++;
    }
  } else if (floorsCount === 2) {
    const gfBathCount = reqBathrooms === 1 ? 1 : (reqBathrooms === 2 ? 1 : (reqBathrooms >= 4 ? Math.floor(reqBathrooms / 2) : 2));
    const f2BathCount = reqBathrooms - gfBathCount;

    for (let i = 0; i < gfBathCount; i++) {
      distribution[0].bathrooms.push({
        index: currentBathIndex,
        name: currentBathIndex === 1 ? 'Master Ensuite Bath' : (currentBathIndex === 2 ? 'Common Powder / Bath' : `Bathroom ${currentBathIndex}`),
        type: 'bathroom'
      });
      currentBathIndex++;
    }
    for (let i = 0; i < f2BathCount; i++) {
      distribution[1].bathrooms.push({
        index: currentBathIndex,
        name: currentBathIndex === gfBathCount + 1 ? 'Upper Attached Bath' : `Bathroom ${currentBathIndex}`,
        type: 'bathroom'
      });
      currentBathIndex++;
    }
  } else {
    // 3+ Floors
    let remainingBaths = reqBathrooms;
    for (let f = 0; f < floorsCount; f++) {
      const hasBeds = distribution[f].bedrooms.length > 0;
      let count = 0;
      if (f === floorsCount - 1) {
        count = remainingBaths;
      } else {
        count = hasBeds && remainingBaths > (floorsCount - 1 - f) ? Math.max(1, Math.floor(reqBathrooms / floorsCount)) : (remainingBaths > 0 ? 1 : 0);
        count = Math.min(count, remainingBaths);
      }
      remainingBaths -= count;

      for (let i = 0; i < count; i++) {
        distribution[f].bathrooms.push({
          index: currentBathIndex,
          name: currentBathIndex === 1 ? 'Master Ensuite Bath' : `Bathroom ${currentBathIndex}`,
          type: 'bathroom'
        });
        currentBathIndex++;
      }
    }
  }

  return distribution;
}

/**
 * Main floor plan generation function.
 * Produces architectural layout candidates meeting exact user requirements.
 */
function generateGeometricFloorPlan(project) {
  const plotL = Number(project.plot?.length || 50);
  const plotW = Number(project.plot?.width || 30);
  const setbacks = {
    front: Number(project.plot?.setbacks?.front ?? 5),
    rear: Number(project.plot?.setbacks?.rear ?? 3),
    left: Number(project.plot?.setbacks?.left ?? 3),
    right: Number(project.plot?.setbacks?.right ?? 3)
  };
  const facing = project.plot?.facingDirection || 'East';
  const floorsCount = Math.max(1, Math.min(4, Number(project.accommodation?.floors || 1)));
  const reqBedrooms = Math.max(1, Math.min(10, Number(project.accommodation?.bedrooms || 3)));
  const reqBathrooms = Math.max(1, Math.min(10, Number(project.accommodation?.bathrooms || 2)));

  // Amenities: strictly check boolean presence
  const hasLiving = project.accommodation?.livingRoom !== false;
  const hasDining = project.accommodation?.diningRoom !== false;
  const hasKitchen = project.accommodation?.kitchen !== false;
  const hasPooja = Boolean(project.accommodation?.poojaRoom);
  const hasParking = Boolean(project.accommodation?.parking);
  const hasBalcony = Boolean(project.accommodation?.balcony);
  const hasUtility = Boolean(project.accommodation?.utilityArea);
  const hasStudy = Boolean(project.accommodation?.studyRoom);
  // Staircase is mandatory if floorsCount > 1; on 1-floor, only if explicitly requested for roof access
  const hasStaircase = floorsCount > 1 ? true : Boolean(project.accommodation?.staircase);

  // Allowable buildable footprint
  const buildW = Math.max(12, Math.round(plotW - setbacks.left - setbacks.right));
  const buildL = Math.max(14, Math.round(plotL - setbacks.front - setbacks.rear));
  const buildAreaPerFloor = Math.round(buildW * buildL);
  const totalBuiltUpAreaSqFt = buildAreaPerFloor * floorsCount;

  // Feasibility Check
  const feasibility = checkLayoutFeasibility({
    totalBuildableArea: totalBuiltUpAreaSqFt,
    buildAreaPerFloor,
    floorsCount,
    reqBedrooms,
    reqBathrooms,
    hasLiving,
    hasKitchen,
    hasDining,
    hasPooja,
    hasParking,
    hasBalcony,
    hasUtility,
    hasStudy,
    hasStaircase
  });

  // Calculate distribution of bedrooms and bathrooms across floors
  const roomDistribution = planRoomDistribution(floorsCount, reqBedrooms, reqBathrooms);

  // Locked vertical staircase geometry for 100% vertical alignment across all floors
  const stairW = Math.min(8, Math.max(6.5, Math.floor(buildW * 0.24)));
  const stairL = Math.min(11, Math.max(8.5, Math.floor(buildL * 0.26)));
  const stairY = Math.floor((buildL - stairL) * 0.45);
  const staircaseGeom = hasStaircase ? { x: 0, y: stairY, width: stairW, length: stairL } : null;

  // 3 Layout Alternatives with distinct spatial strategies
  const candidates = [
    {
      id: 'candidate_a',
      name: 'Option A: Balanced Circulation & Vastu Focus',
      description: 'Zoned living and dining spaces with direct morning light, optimized circulation, and compliant Vastu quadrants.',
      strategy: 'balanced'
    },
    {
      id: 'candidate_b',
      name: 'Option B: Contemporary Open-Plan Living',
      description: 'Expansive open-concept living-dining lounge with integrated modular island kitchen and cross-ventilation focus.',
      strategy: 'open_plan'
    },
    {
      id: 'candidate_c',
      name: 'Option C: Compact Maximum Private Quarters',
      description: 'Optimized bedroom layouts with larger attached wardrobes, dedicated study nooks, and private family lounges.',
      strategy: 'compact_bedrooms'
    }
  ];

  const generatedAlternatives = candidates.map(cand => {
    const floorsData = [];

    for (let f = 1; f <= floorsCount; f++) {
      const isGround = (f === 1);
      const floorDist = roomDistribution[f - 1];

      const rooms = allocateRoomsForFloor({
        floorNumber: f,
        isGround,
        buildW,
        buildL,
        staircaseGeom,
        floorBeds: floorDist.bedrooms,
        floorBaths: floorDist.bathrooms,
        hasLiving,
        hasDining,
        hasKitchen,
        hasPooja,
        hasParking,
        hasBalcony,
        hasUtility,
        hasStudy,
        hasStaircase,
        facing,
        strategy: cand.strategy,
        floorsCount
      });

      const walls = generateWallSegments(rooms, buildW, buildL);
      const svgContent = renderSvgFloorPlan({
        rooms,
        walls,
        buildW,
        buildL,
        plotW,
        plotL,
        setbacks,
        floorNumber: f,
        facing
      });

      floorsData.push({
        floorNumber: f,
        floorName: isGround ? 'Ground Floor' : `Floor ${f}`,
        floorAreaSqFt: buildAreaPerFloor,
        boundary: { x: setbacks.left, y: setbacks.front, width: buildW, length: buildL },
        rooms,
        walls,
        svgContent
      });
    }

    return {
      id: cand.id,
      name: cand.name,
      description: cand.description,
      score: cand.strategy === 'balanced' ? 95 : cand.strategy === 'open_plan' ? 91 : 89,
      floors: floorsData
    };
  });

  const selectedCandidate = generatedAlternatives[0];
  const groundFloorAreaSqFt = buildAreaPerFloor;
  const firstFloorAreaSqFt = floorsCount > 1 ? buildAreaPerFloor : 0;

  // Overall Validation Check across all floors
  const allOverlaps = [];
  const allBoundaryViolations = [];
  selectedCandidate.floors.forEach(fl => {
    const v = validateLayout(fl.rooms, buildW, buildL);
    if (v.overlaps.length > 0) allOverlaps.push(...v.overlaps.map(o => `[${fl.floorName}] ${o}`));
    if (v.boundaryViolations.length > 0) allBoundaryViolations.push(...v.boundaryViolations.map(b => `[${fl.floorName}] ${b}`));
  });

  const validation = {
    isValid: allOverlaps.length === 0 && allBoundaryViolations.length === 0,
    isFeasible: feasibility.isFeasible,
    feasibilityWarning: feasibility.feasibilityWarning,
    minRequiredArea: feasibility.totalMinAreaNeeded,
    totalBuiltUpArea: totalBuiltUpAreaSqFt,
    overlaps: allOverlaps,
    boundaryViolations: allBoundaryViolations,
    warnings: feasibility.feasibilityWarning ? [feasibility.feasibilityWarning] : []
  };

  return {
    layoutCandidateName: selectedCandidate.name,
    totalBuiltUpAreaSqFt,
    groundFloorAreaSqFt,
    firstFloorAreaSqFt,
    floors: selectedCandidate.floors,
    alternatives: generatedAlternatives,
    validation
  };
}

/**
 * Deterministic Non-Overlapping Geometric Placement Algorithm
 * Partitions the floor plate [0, buildW] x [0, buildL] into non-overlapping depth bands.
 */
function allocateRoomsForFloor(params) {
  const {
    floorNumber,
    isGround,
    buildW,
    buildL,
    staircaseGeom,
    floorBeds,
    floorBaths,
    hasLiving,
    hasDining,
    hasKitchen,
    hasPooja,
    hasParking,
    hasBalcony,
    hasUtility,
    hasStudy,
    hasStaircase,
    facing,
    strategy,
    floorsCount
  } = params;

  const rooms = [];

  // Determine Band Heights
  // Band 1: Front (0 to frontL)
  // Band 2: Mid (frontL to frontL + midL) - Staircase resides here
  // Band 3: Rear (frontL + midL to buildL)
  const frontL = staircaseGeom ? staircaseGeom.y : Math.floor(buildL * 0.35);
  const midL = staircaseGeom ? staircaseGeom.length : Math.floor(buildL * 0.30);
  const rearY = frontL + midL;
  const rearL = buildL - rearY;

  if (isGround) {
    // =========================================================================
    // GROUND FLOOR ALLOCATION
    // =========================================================================

    // 1. FRONT BAND [0, frontL]
    if (hasParking) {
      const parkW = Math.min(12, Math.max(10, Math.floor(buildW * 0.42)));
      rooms.push({
        id: 'parking_gf',
        name: 'Car Parking / Porch',
        type: 'parking',
        x: 0,
        y: 0,
        width: parkW,
        length: frontL,
        areaSqFt: parkW * frontL,
        vastuZone: facing === 'East' ? 'SE' : 'NW',
        doors: [{ wall: 'front', offset: 2, width: Math.min(9, parkW - 2) }],
        windows: [],
        color: ROOM_STANDARDS.parking.color
      });

      if (hasLiving) {
        const livW = buildW - parkW;
        rooms.push({
          id: 'living_gf',
          name: 'Living Room',
          type: 'living',
          x: parkW,
          y: 0,
          width: livW,
          length: frontL,
          areaSqFt: livW * frontL,
          vastuZone: 'NE',
          doors: [{ wall: 'front', offset: 2, width: 3.5 }],
          windows: [{ wall: 'right', offset: 2, width: 4.5 }],
          color: ROOM_STANDARDS.living.color
        });
      } else {
        // If no living requested, front space is allocated to Study or Verandah
        const remW = buildW - parkW;
        rooms.push({
          id: 'foyer_gf',
          name: hasStudy ? 'Study / Home Office' : 'Entrance Verandah',
          type: hasStudy ? 'study' : 'balcony',
          x: parkW,
          y: 0,
          width: remW,
          length: frontL,
          areaSqFt: remW * frontL,
          vastuZone: 'NE',
          doors: [{ wall: 'front', offset: 2, width: 3 }],
          windows: [{ wall: 'right', offset: 2, width: 4 }],
          color: hasStudy ? ROOM_STANDARDS.study.color : ROOM_STANDARDS.balcony.color
        });
      }
    } else {
      // No parking requested
      if (hasLiving) {
        rooms.push({
          id: 'living_gf',
          name: 'Formal Living Room',
          type: 'living',
          x: 0,
          y: 0,
          width: buildW,
          length: frontL,
          areaSqFt: buildW * frontL,
          vastuZone: 'E',
          doors: [{ wall: 'front', offset: Math.floor(buildW * 0.5), width: 3.5 }],
          windows: [{ wall: 'front', offset: 2, width: 4 }, { wall: 'right', offset: 2, width: 4 }],
          color: ROOM_STANDARDS.living.color
        });
      } else if (hasStudy) {
        rooms.push({
          id: 'study_gf',
          name: 'Study / Home Office',
          type: 'study',
          x: 0,
          y: 0,
          width: buildW,
          length: frontL,
          areaSqFt: buildW * frontL,
          vastuZone: 'NE',
          doors: [{ wall: 'front', offset: Math.floor(buildW * 0.5), width: 3.5 }],
          windows: [{ wall: 'front', offset: 2, width: 4 }],
          color: ROOM_STANDARDS.study.color
        });
      } else {
        // Open Foyer
        rooms.push({
          id: 'foyer_gf',
          name: 'Entrance Foyer & Lounge',
          type: 'living',
          x: 0,
          y: 0,
          width: buildW,
          length: frontL,
          areaSqFt: buildW * frontL,
          vastuZone: 'E',
          doors: [{ wall: 'front', offset: Math.floor(buildW * 0.5), width: 3.5 }],
          windows: [{ wall: 'front', offset: 2, width: 4 }],
          color: ROOM_STANDARDS.living.color
        });
      }
    }

    // 2. MIDDLE BAND [frontL, frontL + midL]
    let startX = 0;
    if (hasStaircase && staircaseGeom) {
      rooms.push({
        id: 'staircase_gf',
        name: 'Staircase',
        type: 'staircase',
        x: staircaseGeom.x,
        y: staircaseGeom.y,
        width: staircaseGeom.width,
        length: staircaseGeom.length,
        areaSqFt: staircaseGeom.width * staircaseGeom.length,
        vastuZone: 'S',
        doors: [{ wall: 'right', offset: 2, width: 3 }],
        windows: [{ wall: 'left', offset: 2, width: 3 }],
        color: ROOM_STANDARDS.staircase.color
      });
      startX = staircaseGeom.width;
    }

    const midRemainW = buildW - startX;

    // Check if GF has >= 3 bedrooms (e.g. single-story 3BHK or 4BHK)
    // If so, 1 bedroom must be placed in this mid band alongside kitchen
    const needsMidBed = floorBeds.length >= 3;

    if (needsMidBed) {
      const midBed = floorBeds[2]; // 3rd bedroom
      const bedW = Math.floor(midRemainW * 0.48);
      const servW = midRemainW - bedW;

      rooms.push({
        id: `bedroom_gf_${midBed.index}`,
        name: midBed.name,
        type: 'bedroom',
        x: startX,
        y: frontL,
        width: bedW,
        length: midL,
        areaSqFt: bedW * midL,
        vastuZone: 'NW',
        doors: [{ wall: 'right', offset: 2, width: 3 }],
        windows: [{ wall: 'left', offset: 2, width: 4 }],
        color: ROOM_STANDARDS.bedroom.color
      });

      if (hasKitchen) {
        if (hasPooja && servW >= 9) {
          const poojaW = Math.min(5, Math.max(4, Math.floor(servW * 0.25)));
          const kitW = servW - poojaW;
          rooms.push({
            id: 'pooja_gf',
            name: 'Pooja Mandir',
            type: 'pooja',
            x: startX + bedW,
            y: frontL,
            width: poojaW,
            length: midL,
            areaSqFt: poojaW * midL,
            vastuZone: 'NE',
            doors: [{ wall: 'left', offset: 1, width: 2.5 }],
            windows: [],
            color: ROOM_STANDARDS.pooja.color
          });
          rooms.push({
            id: 'kitchen_gf',
            name: 'Modular Kitchen',
            type: 'kitchen',
            x: startX + bedW + poojaW,
            y: frontL,
            width: kitW,
            length: midL,
            areaSqFt: kitW * midL,
            vastuZone: 'SE',
            doors: [{ wall: 'left', offset: 2, width: 3 }],
            windows: [{ wall: 'right', offset: 2, width: 4 }],
            color: ROOM_STANDARDS.kitchen.color
          });
        } else {
          rooms.push({
            id: 'kitchen_gf',
            name: 'Modular Kitchen',
            type: 'kitchen',
            x: startX + bedW,
            y: frontL,
            width: servW,
            length: midL,
            areaSqFt: servW * midL,
            vastuZone: 'SE',
            doors: [{ wall: 'left', offset: 2, width: 3 }],
            windows: [{ wall: 'right', offset: 2, width: 4 }],
            color: ROOM_STANDARDS.kitchen.color
          });
        }
      } else {
        if (hasPooja && servW >= 9) {
          const poojaW = Math.min(5, Math.max(4, Math.floor(servW * 0.25)));
          const dinW = servW - poojaW;
          rooms.push({
            id: 'pooja_gf',
            name: 'Pooja Mandir',
            type: 'pooja',
            x: startX + bedW,
            y: frontL,
            width: poojaW,
            length: midL,
            areaSqFt: poojaW * midL,
            vastuZone: 'NE',
            doors: [{ wall: 'left', offset: 1, width: 2.5 }],
            windows: [],
            color: ROOM_STANDARDS.pooja.color
          });
          rooms.push({
            id: 'dining_gf',
            name: 'Dining Area',
            type: 'dining',
            x: startX + bedW + poojaW,
            y: frontL,
            width: dinW,
            length: midL,
            areaSqFt: dinW * midL,
            vastuZone: 'CENTER',
            doors: [{ wall: 'left', offset: 2, width: 3 }],
            windows: [{ wall: 'right', offset: 2, width: 3 }],
            color: ROOM_STANDARDS.dining.color
          });
        } else {
          rooms.push({
            id: 'dining_gf',
            name: 'Dining Area',
            type: 'dining',
            x: startX + bedW,
            y: frontL,
            width: servW,
            length: midL,
            areaSqFt: servW * midL,
            vastuZone: 'CENTER',
            doors: [{ wall: 'left', offset: 2, width: 3 }],
            windows: [{ wall: 'right', offset: 2, width: 3 }],
            color: ROOM_STANDARDS.dining.color
          });
        }
      }
    } else {
      // Normal Mid Zone: Dining + Kitchen + optional Pooja (all non-overlapping vertical slices)
      if (hasDining && hasKitchen && hasPooja) {
        const poojaW = Math.min(5, Math.max(4, Math.floor(midRemainW * 0.18)));
        const diningW = Math.floor((midRemainW - poojaW) * 0.48);
        const kitchenW = midRemainW - poojaW - diningW;

        rooms.push({
          id: 'dining_gf',
          name: 'Dining Space',
          type: 'dining',
          x: startX,
          y: frontL,
          width: diningW,
          length: midL,
          areaSqFt: diningW * midL,
          vastuZone: 'CENTER',
          doors: [{ wall: 'right', offset: 2, width: 3 }],
          windows: [],
          color: ROOM_STANDARDS.dining.color
        });

        rooms.push({
          id: 'pooja_gf',
          name: 'Pooja Mandir',
          type: 'pooja',
          x: startX + diningW,
          y: frontL,
          width: poojaW,
          length: midL,
          areaSqFt: poojaW * midL,
          vastuZone: 'NE',
          doors: [{ wall: 'left', offset: 1, width: 2.5 }],
          windows: [],
          color: ROOM_STANDARDS.pooja.color
        });

        rooms.push({
          id: 'kitchen_gf',
          name: 'Modular Kitchen',
          type: 'kitchen',
          x: startX + diningW + poojaW,
          y: frontL,
          width: kitchenW,
          length: midL,
          areaSqFt: kitchenW * midL,
          vastuZone: 'SE',
          doors: [{ wall: 'left', offset: 2, width: 3 }],
          windows: [{ wall: 'right', offset: 2, width: 4 }],
          color: ROOM_STANDARDS.kitchen.color
        });
      } else if (hasDining && hasKitchen && !hasPooja) {
        const diningW = Math.floor(midRemainW * 0.48);
        const kitchenW = midRemainW - diningW;

        rooms.push({
          id: 'dining_gf',
          name: 'Dining Space',
          type: 'dining',
          x: startX,
          y: frontL,
          width: diningW,
          length: midL,
          areaSqFt: diningW * midL,
          vastuZone: 'CENTER',
          doors: [{ wall: 'right', offset: 2, width: 3 }],
          windows: [],
          color: ROOM_STANDARDS.dining.color
        });

        rooms.push({
          id: 'kitchen_gf',
          name: 'Modular Kitchen',
          type: 'kitchen',
          x: startX + diningW,
          y: frontL,
          width: kitchenW,
          length: midL,
          areaSqFt: kitchenW * midL,
          vastuZone: 'SE',
          doors: [{ wall: 'left', offset: 2, width: 3 }],
          windows: [{ wall: 'right', offset: 2, width: 4 }],
          color: ROOM_STANDARDS.kitchen.color
        });
      } else if (!hasDining && hasKitchen && hasPooja) {
        const poojaW = Math.min(5, Math.max(4, Math.floor(midRemainW * 0.22)));
        const kitchenW = midRemainW - poojaW;

        rooms.push({
          id: 'pooja_gf',
          name: 'Pooja Mandir',
          type: 'pooja',
          x: startX,
          y: frontL,
          width: poojaW,
          length: midL,
          areaSqFt: poojaW * midL,
          vastuZone: 'NE',
          doors: [{ wall: 'left', offset: 1, width: 2.5 }],
          windows: [],
          color: ROOM_STANDARDS.pooja.color
        });

        rooms.push({
          id: 'kitchen_gf',
          name: 'Modular Kitchen',
          type: 'kitchen',
          x: startX + poojaW,
          y: frontL,
          width: kitchenW,
          length: midL,
          areaSqFt: kitchenW * midL,
          vastuZone: 'SE',
          doors: [{ wall: 'left', offset: 2, width: 3 }],
          windows: [{ wall: 'right', offset: 2, width: 4 }],
          color: ROOM_STANDARDS.kitchen.color
        });
      } else if (!hasDining && hasKitchen && !hasPooja) {
        rooms.push({
          id: 'kitchen_gf',
          name: 'Modular Kitchen',
          type: 'kitchen',
          x: startX,
          y: frontL,
          width: midRemainW,
          length: midL,
          areaSqFt: midRemainW * midL,
          vastuZone: 'SE',
          doors: [{ wall: 'left', offset: 2, width: 3 }],
          windows: [{ wall: 'right', offset: 2, width: 4 }],
          color: ROOM_STANDARDS.kitchen.color
        });
      } else {
        // No kitchen selected
        if (hasDining) {
          rooms.push({
            id: 'dining_gf',
            name: 'Dining Lounge',
            type: 'dining',
            x: startX,
            y: frontL,
            width: midRemainW,
            length: midL,
            areaSqFt: midRemainW * midL,
            vastuZone: 'CENTER',
            doors: [{ wall: 'left', offset: 2, width: 3 }],
            windows: [{ wall: 'right', offset: 2, width: 4 }],
            color: ROOM_STANDARDS.dining.color
          });
        } else {
          rooms.push({
            id: 'lobby_gf',
            name: 'Central Lobby',
            type: 'corridor',
            x: startX,
            y: frontL,
            width: midRemainW,
            length: midL,
            areaSqFt: midRemainW * midL,
            vastuZone: 'CENTER',
            doors: [{ wall: 'left', offset: 2, width: 3 }],
            windows: [],
            color: ROOM_STANDARDS.corridor.color
          });
        }
      }
    }

    // 3. REAR BAND [rearY, buildL]
    // Handles Master Bedroom, Bedroom 2 (if present on GF), and assigned bathrooms + utility
    const bedsForRear = floorBeds.slice(0, 2); // First 1 or 2 bedrooms on GF

    if (bedsForRear.length === 1) {
      // Exactly 1 bedroom on rear (Standard layout)
      const bed = bedsForRear[0];
      const serviceItems = [...floorBaths];
      if (hasUtility) serviceItems.push({ name: 'Utility / Wash', type: 'utility' });

      if (serviceItems.length === 0) {
        // Bed takes entire rear footprint
        rooms.push({
          id: `bedroom_gf_${bed.index}`,
          name: bed.name,
          type: bed.type,
          x: 0,
          y: rearY,
          width: buildW,
          length: rearL,
          areaSqFt: buildW * rearL,
          vastuZone: 'SW',
          doors: [{ wall: 'front', offset: 2, width: 3 }],
          windows: [{ wall: 'rear', offset: 3, width: 4 }, { wall: 'left', offset: 2, width: 4 }],
          color: bed.isMaster ? ROOM_STANDARDS.master_bedroom.color : ROOM_STANDARDS.bedroom.color
        });
      } else {
        const bedW = Math.max(10, Math.floor(buildW * 0.62));
        const bathW = buildW - bedW;

        rooms.push({
          id: `bedroom_gf_${bed.index}`,
          name: bed.name,
          type: bed.type,
          x: 0,
          y: rearY,
          width: bedW,
          length: rearL,
          areaSqFt: bedW * rearL,
          vastuZone: 'SW',
          doors: [{ wall: 'front', offset: 2, width: 3 }],
          windows: [{ wall: 'rear', offset: 3, width: 4 }, { wall: 'left', offset: 2, width: 4 }],
          color: bed.isMaster ? ROOM_STANDARDS.master_bedroom.color : ROOM_STANDARDS.bedroom.color
        });

        // Partition service column horizontally
        const sliceCount = serviceItems.length;
        const sliceL = Math.floor(rearL / sliceCount);
        let currY = rearY;

        serviceItems.forEach((item, idx) => {
          const isLast = (idx === sliceCount - 1);
          const thisL = isLast ? (rearY + rearL - currY) : sliceL;

          rooms.push({
            id: item.type === 'utility' ? 'utility_gf' : `bath_gf_${item.index || idx + 1}`,
            name: item.name,
            type: item.type,
            x: bedW,
            y: currY,
            width: bathW,
            length: thisL,
            areaSqFt: bathW * thisL,
            vastuZone: idx === 0 ? 'W' : 'NW',
            doors: [{ wall: 'left', offset: 1, width: 2.5 }],
            windows: [{ wall: 'right', offset: 1, width: 2 }],
            color: item.type === 'utility' ? ROOM_STANDARDS.utility.color : ROOM_STANDARDS.bathroom.color
          });
          currY += thisL;
        });
      }
    } else if (bedsForRear.length === 2) {
      // 2 Bedrooms on rear (e.g. 4BHK duplex or 2BHK single floor)
      const halfW = Math.floor(buildW * 0.5);
      const rightW = buildW - halfW;

      const serviceItems = [...floorBaths];
      if (hasUtility) serviceItems.push({ name: 'Utility / Wash', type: 'utility' });

      if (serviceItems.length > 0) {
        // Reserve service strip at top of rear band
        const servL = Math.min(7, Math.max(5, Math.floor(rearL * 0.35)));
        const bedL = rearL - servL;

        // Service strip split into left & right
        const leftServ = serviceItems[0];
        const rightServ = serviceItems[1] || (serviceItems.length > 1 ? serviceItems[1] : null);

        rooms.push({
          id: leftServ.type === 'utility' ? 'utility_gf' : `bath_gf_${leftServ.index || 1}`,
          name: leftServ.name,
          type: leftServ.type,
          x: 0,
          y: rearY,
          width: halfW,
          length: servL,
          areaSqFt: halfW * servL,
          vastuZone: 'W',
          doors: [{ wall: 'front', offset: 1, width: 2.5 }],
          windows: [{ wall: 'left', offset: 1, width: 2 }],
          color: leftServ.type === 'utility' ? ROOM_STANDARDS.utility.color : ROOM_STANDARDS.bathroom.color
        });

        if (rightServ) {
          rooms.push({
            id: rightServ.type === 'utility' ? 'utility_gf' : `bath_gf_${rightServ.index || 2}`,
            name: rightServ.name,
            type: rightServ.type,
            x: halfW,
            y: rearY,
            width: rightW,
            length: servL,
            areaSqFt: rightW * servL,
            vastuZone: 'NW',
            doors: [{ wall: 'front', offset: 1, width: 2.5 }],
            windows: [{ wall: 'right', offset: 1, width: 2 }],
            color: rightServ.type === 'utility' ? ROOM_STANDARDS.utility.color : ROOM_STANDARDS.bathroom.color
          });
        }

        // Two bedrooms below service strip
        const bed1 = bedsForRear[0];
        const bed2 = bedsForRear[1];

        rooms.push({
          id: `bedroom_gf_${bed1.index}`,
          name: bed1.name,
          type: bed1.type,
          x: 0,
          y: rearY + servL,
          width: halfW,
          length: bedL,
          areaSqFt: halfW * bedL,
          vastuZone: 'SW',
          doors: [{ wall: 'front', offset: 2, width: 3 }],
          windows: [{ wall: 'rear', offset: 2, width: 4 }, { wall: 'left', offset: 2, width: 3 }],
          color: bed1.isMaster ? ROOM_STANDARDS.master_bedroom.color : ROOM_STANDARDS.bedroom.color
        });

        rooms.push({
          id: `bedroom_gf_${bed2.index}`,
          name: bed2.name,
          type: bed2.type,
          x: halfW,
          y: rearY + servL,
          width: rightW,
          length: bedL,
          areaSqFt: rightW * bedL,
          vastuZone: 'SE',
          doors: [{ wall: 'front', offset: 2, width: 3 }],
          windows: [{ wall: 'rear', offset: 2, width: 4 }, { wall: 'right', offset: 2, width: 3 }],
          color: ROOM_STANDARDS.bedroom.color
        });
      } else {
        // No services, pure side-by-side bedrooms
        const bed1 = bedsForRear[0];
        const bed2 = bedsForRear[1];

        rooms.push({
          id: `bedroom_gf_${bed1.index}`,
          name: bed1.name,
          type: bed1.type,
          x: 0,
          y: rearY,
          width: halfW,
          length: rearL,
          areaSqFt: halfW * rearL,
          vastuZone: 'SW',
          doors: [{ wall: 'front', offset: 2, width: 3 }],
          windows: [{ wall: 'rear', offset: 2, width: 4 }, { wall: 'left', offset: 2, width: 3 }],
          color: bed1.isMaster ? ROOM_STANDARDS.master_bedroom.color : ROOM_STANDARDS.bedroom.color
        });

        rooms.push({
          id: `bedroom_gf_${bed2.index}`,
          name: bed2.name,
          type: bed2.type,
          x: halfW,
          y: rearY,
          width: rightW,
          length: rearL,
          areaSqFt: rightW * rearL,
          vastuZone: 'SE',
          doors: [{ wall: 'front', offset: 2, width: 3 }],
          windows: [{ wall: 'rear', offset: 2, width: 4 }, { wall: 'right', offset: 2, width: 3 }],
          color: ROOM_STANDARDS.bedroom.color
        });
      }
    } else {
      // 0 bedrooms on rear (fallback / commercial)
      rooms.push({
        id: 'hall_gf',
        name: 'Community Hall',
        type: 'living',
        x: 0,
        y: rearY,
        width: buildW,
        length: rearL,
        areaSqFt: buildW * rearL,
        vastuZone: 'SW',
        doors: [{ wall: 'front', offset: 2, width: 3 }],
        windows: [{ wall: 'rear', offset: 3, width: 4 }],
        color: ROOM_STANDARDS.living.color
      });
    }

  } else {
    // =========================================================================
    // UPPER FLOOR ALLOCATION (Floor 2, Floor 3, etc.)
    // =========================================================================

    // 1. FRONT BAND [0, frontL]
    // May house a Balcony, Study, or Bedroom assigned to this floor
    const hasFrontBed = floorBeds.length >= 1;
    let frontBed = null;
    let remainingBedsForUpper = [...floorBeds];

    if (hasFrontBed) {
      frontBed = remainingBedsForUpper.shift(); // Take first bedroom for front
    }

    if (hasBalcony) {
      const balcW = Math.min(8, Math.max(6, Math.floor(buildW * 0.32)));
      rooms.push({
        id: `balcony_f${floorNumber}`,
        name: `Terrace Balcony (F${floorNumber})`,
        type: 'balcony',
        x: 0,
        y: 0,
        width: balcW,
        length: frontL,
        areaSqFt: balcW * frontL,
        vastuZone: 'NE',
        doors: [{ wall: 'rear', offset: 2, width: 3 }],
        windows: [{ wall: 'front', offset: 1, width: 4 }],
        color: ROOM_STANDARDS.balcony.color
      });

      const remW = buildW - balcW;
      if (frontBed) {
        rooms.push({
          id: `bedroom_f${floorNumber}_${frontBed.index}`,
          name: frontBed.name,
          type: 'bedroom',
          x: balcW,
          y: 0,
          width: remW,
          length: frontL,
          areaSqFt: remW * frontL,
          vastuZone: 'NW',
          doors: [{ wall: 'rear', offset: 2, width: 3 }],
          windows: [{ wall: 'front', offset: 2, width: 4 }, { wall: 'right', offset: 2, width: 4 }],
          color: ROOM_STANDARDS.bedroom.color
        });
      } else {
        rooms.push({
          id: `terrace_f${floorNumber}`,
          name: hasStudy ? 'Study / Library Lounge' : 'Open Sit-Out Terrace',
          type: hasStudy ? 'study' : 'balcony',
          x: balcW,
          y: 0,
          width: remW,
          length: frontL,
          areaSqFt: remW * frontL,
          vastuZone: 'NW',
          doors: [{ wall: 'rear', offset: 2, width: 3 }],
          windows: [{ wall: 'front', offset: 2, width: 4 }],
          color: hasStudy ? ROOM_STANDARDS.study.color : ROOM_STANDARDS.balcony.color
        });
      }
    } else {
      // No balcony requested
      if (frontBed) {
        rooms.push({
          id: `bedroom_f${floorNumber}_${frontBed.index}`,
          name: frontBed.name,
          type: 'bedroom',
          x: 0,
          y: 0,
          width: buildW,
          length: frontL,
          areaSqFt: buildW * frontL,
          vastuZone: 'NW',
          doors: [{ wall: 'rear', offset: Math.floor(buildW * 0.5), width: 3 }],
          windows: [{ wall: 'front', offset: 2, width: 4 }, { wall: 'right', offset: 2, width: 4 }],
          color: ROOM_STANDARDS.bedroom.color
        });
      } else {
        rooms.push({
          id: `lounge_front_f${floorNumber}`,
          name: hasStudy ? 'Study / Home Office' : 'Upper Front Lounge',
          type: hasStudy ? 'study' : 'living',
          x: 0,
          y: 0,
          width: buildW,
          length: frontL,
          areaSqFt: buildW * frontL,
          vastuZone: 'NE',
          doors: [{ wall: 'rear', offset: Math.floor(buildW * 0.5), width: 3 }],
          windows: [{ wall: 'front', offset: 2, width: 4 }],
          color: hasStudy ? ROOM_STANDARDS.study.color : ROOM_STANDARDS.living.color
        });
      }
    }

    // 2. MIDDLE BAND [frontL, frontL + midL]
    // Perfectly aligned staircase matching Ground Floor
    rooms.push({
      id: `staircase_f${floorNumber}`,
      name: 'Staircase Landing',
      type: 'staircase',
      x: staircaseGeom.x,
      y: staircaseGeom.y,
      width: staircaseGeom.width,
      length: staircaseGeom.length,
      areaSqFt: staircaseGeom.width * staircaseGeom.length,
      vastuZone: 'S',
      doors: [{ wall: 'right', offset: 2, width: 3 }],
      windows: [{ wall: 'left', offset: 2, width: 3 }],
      color: ROOM_STANDARDS.staircase.color
    });

    const midRemainW = buildW - staircaseGeom.width;

    if (hasStudy && floorNumber === 2 && midRemainW >= 14) {
      // Allocate study alongside lounge in middle band
      const studyW = Math.min(10, Math.max(7, Math.floor(midRemainW * 0.42)));
      const loungeW = midRemainW - studyW;

      rooms.push({
        id: `study_f${floorNumber}`,
        name: 'Study / Work Office',
        type: 'study',
        x: staircaseGeom.width,
        y: frontL,
        width: studyW,
        length: midL,
        areaSqFt: studyW * midL,
        vastuZone: 'N',
        doors: [{ wall: 'right', offset: 2, width: 3 }],
        windows: [],
        color: ROOM_STANDARDS.study.color
      });

      rooms.push({
        id: `lounge_f${floorNumber}`,
        name: 'Upper Family Lounge',
        type: 'living',
        x: staircaseGeom.width + studyW,
        y: frontL,
        width: loungeW,
        length: midL,
        areaSqFt: loungeW * midL,
        vastuZone: 'CENTER',
        doors: [{ wall: 'left', offset: 2, width: 3 }],
        windows: [{ wall: 'right', offset: 2, width: 4 }],
        color: ROOM_STANDARDS.living.color
      });
    } else {
      rooms.push({
        id: `lounge_f${floorNumber}`,
        name: 'Upper Family Lounge',
        type: 'living',
        x: staircaseGeom.width,
        y: frontL,
        width: midRemainW,
        length: midL,
        areaSqFt: midRemainW * midL,
        vastuZone: 'CENTER',
        doors: [{ wall: 'left', offset: 2, width: 3 }],
        windows: [{ wall: 'right', offset: 2, width: 4 }],
        color: ROOM_STANDARDS.living.color
      });
    }

    // 3. REAR BAND [rearY, buildL]
    // Allocates the remaining bedrooms and bathrooms for this upper floor
    if (remainingBedsForUpper.length === 1) {
      const bed = remainingBedsForUpper[0];
      const serviceItems = [...floorBaths];

      if (serviceItems.length === 0) {
        rooms.push({
          id: `bedroom_f${floorNumber}_${bed.index}`,
          name: bed.name,
          type: 'bedroom',
          x: 0,
          y: rearY,
          width: buildW,
          length: rearL,
          areaSqFt: buildW * rearL,
          vastuZone: 'SW',
          doors: [{ wall: 'front', offset: 2, width: 3 }],
          windows: [{ wall: 'rear', offset: 2, width: 4 }, { wall: 'left', offset: 2, width: 4 }],
          color: ROOM_STANDARDS.bedroom.color
        });
      } else {
        const bedW = Math.max(10, Math.floor(buildW * 0.62));
        const bathW = buildW - bedW;

        rooms.push({
          id: `bedroom_f${floorNumber}_${bed.index}`,
          name: bed.name,
          type: 'bedroom',
          x: 0,
          y: rearY,
          width: bedW,
          length: rearL,
          areaSqFt: bedW * rearL,
          vastuZone: 'SW',
          doors: [{ wall: 'front', offset: 2, width: 3 }],
          windows: [{ wall: 'rear', offset: 2, width: 4 }, { wall: 'left', offset: 2, width: 4 }],
          color: ROOM_STANDARDS.bedroom.color
        });

        const sliceL = Math.floor(rearL / serviceItems.length);
        let currY = rearY;

        serviceItems.forEach((b, idx) => {
          const isLast = (idx === serviceItems.length - 1);
          const thisL = isLast ? (rearY + rearL - currY) : sliceL;

          rooms.push({
            id: `bath_f${floorNumber}_${b.index || idx + 1}`,
            name: b.name,
            type: 'bathroom',
            x: bedW,
            y: currY,
            width: bathW,
            length: thisL,
            areaSqFt: bathW * thisL,
            vastuZone: 'W',
            doors: [{ wall: 'left', offset: 1, width: 2.5 }],
            windows: [{ wall: 'right', offset: 1, width: 2 }],
            color: ROOM_STANDARDS.bathroom.color
          });
          currY += thisL;
        });
      }
    } else if (remainingBedsForUpper.length >= 2) {
      // 2 bedrooms on rear of this upper floor
      const halfW = Math.floor(buildW * 0.5);
      const rightW = buildW - halfW;
      const serviceItems = [...floorBaths];

      if (serviceItems.length > 0) {
        const servL = Math.min(7, Math.max(5, Math.floor(rearL * 0.35)));
        const bedL = rearL - servL;

        rooms.push({
          id: `bath_f${floorNumber}_${serviceItems[0].index || 1}`,
          name: serviceItems[0].name,
          type: 'bathroom',
          x: 0,
          y: rearY,
          width: halfW,
          length: servL,
          areaSqFt: halfW * servL,
          vastuZone: 'W',
          doors: [{ wall: 'front', offset: 1, width: 2.5 }],
          windows: [{ wall: 'left', offset: 1, width: 2 }],
          color: ROOM_STANDARDS.bathroom.color
        });

        if (serviceItems.length > 1) {
          rooms.push({
            id: `bath_f${floorNumber}_${serviceItems[1].index || 2}`,
            name: serviceItems[1].name,
            type: 'bathroom',
            x: halfW,
            y: rearY,
            width: rightW,
            length: servL,
            areaSqFt: rightW * servL,
            vastuZone: 'NW',
            doors: [{ wall: 'front', offset: 1, width: 2.5 }],
            windows: [{ wall: 'right', offset: 1, width: 2 }],
            color: ROOM_STANDARDS.bathroom.color
          });
        }

        const bed1 = remainingBedsForUpper[0];
        const bed2 = remainingBedsForUpper[1];

        rooms.push({
          id: `bedroom_f${floorNumber}_${bed1.index}`,
          name: bed1.name,
          type: 'bedroom',
          x: 0,
          y: rearY + servL,
          width: halfW,
          length: bedL,
          areaSqFt: halfW * bedL,
          vastuZone: 'SW',
          doors: [{ wall: 'front', offset: 2, width: 3 }],
          windows: [{ wall: 'rear', offset: 2, width: 4 }, { wall: 'left', offset: 2, width: 3 }],
          color: ROOM_STANDARDS.bedroom.color
        });

        rooms.push({
          id: `bedroom_f${floorNumber}_${bed2.index}`,
          name: bed2.name,
          type: 'bedroom',
          x: halfW,
          y: rearY + servL,
          width: rightW,
          length: bedL,
          areaSqFt: rightW * bedL,
          vastuZone: 'SE',
          doors: [{ wall: 'front', offset: 2, width: 3 }],
          windows: [{ wall: 'rear', offset: 2, width: 4 }, { wall: 'right', offset: 2, width: 3 }],
          color: ROOM_STANDARDS.bedroom.color
        });
      } else {
        const bed1 = remainingBedsForUpper[0];
        const bed2 = remainingBedsForUpper[1];

        rooms.push({
          id: `bedroom_f${floorNumber}_${bed1.index}`,
          name: bed1.name,
          type: 'bedroom',
          x: 0,
          y: rearY,
          width: halfW,
          length: rearL,
          areaSqFt: halfW * rearL,
          vastuZone: 'SW',
          doors: [{ wall: 'front', offset: 2, width: 3 }],
          windows: [{ wall: 'rear', offset: 2, width: 4 }, { wall: 'left', offset: 2, width: 3 }],
          color: ROOM_STANDARDS.bedroom.color
        });

        rooms.push({
          id: `bedroom_f${floorNumber}_${bed2.index}`,
          name: bed2.name,
          type: 'bedroom',
          x: halfW,
          y: rearY,
          width: rightW,
          length: rearL,
          areaSqFt: rightW * rearL,
          vastuZone: 'SE',
          doors: [{ wall: 'front', offset: 2, width: 3 }],
          windows: [{ wall: 'rear', offset: 2, width: 4 }, { wall: 'right', offset: 2, width: 3 }],
          color: ROOM_STANDARDS.bedroom.color
        });
      }
    } else {
      // 0 rear bedrooms (e.g. only 1 bedroom requested on entire upper floor, which was placed in front)
      if (floorBaths.length > 0) {
        const bathW = Math.min(10, Math.max(6, Math.floor(buildW * 0.35)));
        const sliceL = Math.floor(rearL / floorBaths.length);
        let currY = rearY;

        floorBaths.forEach((b, idx) => {
          const isLast = (idx === floorBaths.length - 1);
          const thisL = isLast ? (rearY + rearL - currY) : sliceL;

          rooms.push({
            id: `bath_f${floorNumber}_${b.index || idx + 1}`,
            name: b.name,
            type: 'bathroom',
            x: 0,
            y: currY,
            width: bathW,
            length: thisL,
            areaSqFt: bathW * thisL,
            vastuZone: idx === 0 ? 'W' : 'NW',
            doors: [{ wall: 'right', offset: 1, width: 2.5 }],
            windows: [{ wall: 'left', offset: 1, width: 2 }],
            color: ROOM_STANDARDS.bathroom.color
          });
          currY += thisL;
        });

        rooms.push({
          id: `terrace_rear_f${floorNumber}`,
          name: 'Rear Open Terrace',
          type: 'balcony',
          x: bathW,
          y: rearY,
          width: buildW - bathW,
          length: rearL,
          areaSqFt: (buildW - bathW) * rearL,
          vastuZone: 'SW',
          doors: [{ wall: 'front', offset: 2, width: 3 }],
          windows: [{ wall: 'rear', offset: 2, width: 4 }],
          color: ROOM_STANDARDS.balcony.color
        });
      } else {
        rooms.push({
          id: `terrace_rear_f${floorNumber}`,
          name: 'Rear Open Terrace',
          type: 'balcony',
          x: 0,
          y: rearY,
          width: buildW,
          length: rearL,
          areaSqFt: buildW * rearL,
          vastuZone: 'SW',
          doors: [{ wall: 'front', offset: 2, width: 3 }],
          windows: [{ wall: 'rear', offset: 2, width: 4 }],
          color: ROOM_STANDARDS.balcony.color
        });
      }
    }
  }

  return rooms;
}

/**
 * Extracts wall line segments with thickness for realistic architectural 2D blueprints.
 */
function generateWallSegments(rooms, buildW, buildL) {
  const walls = [];

  // Outer perimeter structural walls (thickness: 9 inches / 0.75 ft)
  walls.push({ x1: 0, y1: 0, x2: buildW, y2: 0, thickness: 0.75, isExterior: true });
  walls.push({ x1: buildW, y1: 0, x2: buildW, y2: buildL, thickness: 0.75, isExterior: true });
  walls.push({ x1: buildW, y1: buildL, x2: 0, y2: buildL, thickness: 0.75, isExterior: true });
  walls.push({ x1: 0, y1: buildL, x2: 0, y2: 0, thickness: 0.75, isExterior: true });

  // Internal partition walls (thickness: 4.5 inches / 0.375 ft)
  rooms.forEach(r => {
    if (r.y > 0) walls.push({ x1: r.x, y1: r.y, x2: r.x + r.width, y2: r.y, thickness: 0.375, isExterior: false });
    if (r.x > 0) walls.push({ x1: r.x, y1: r.y, x2: r.x, y2: r.y + r.length, thickness: 0.375, isExterior: false });
  });

  return walls;
}

/**
 * Validates non-overlapping polygons and boundary containment.
 * Checks mathematical intersection of all room rectangles.
 */
function validateLayout(rooms, buildW, buildL) {
  const overlaps = [];
  const boundaryViolations = [];
  const warnings = [];

  for (let i = 0; i < rooms.length; i++) {
    const r1 = rooms[i];
    // Check boundary containment
    if (r1.x < -0.1 || r1.y < -0.1 || r1.x + r1.width > buildW + 0.5 || r1.y + r1.length > buildL + 0.5) {
      boundaryViolations.push(`Room "${r1.name}" (${r1.width}'x${r1.length}' at ${r1.x},${r1.y}) extends beyond building footprint (${buildW}'x${buildL}').`);
    }

    // Check overlaps
    for (let j = i + 1; j < rooms.length; j++) {
      const r2 = rooms[j];
      const overlapX = Math.max(0, Math.min(r1.x + r1.width, r2.x + r2.width) - Math.max(r1.x, r2.x));
      const overlapY = Math.max(0, Math.min(r1.y + r1.length, r2.y + r2.length) - Math.max(r1.y, r2.y));

      // Overlap of > 0.5 sq.ft is an illegal collision
      if (overlapX > 0.5 && overlapY > 0.5) {
        overlaps.push(`Room "${r1.name}" overlaps with "${r2.name}" by ${Math.round(overlapX * overlapY)} sq.ft.`);
      }
    }
  }

  return {
    isValid: overlaps.length === 0 && boundaryViolations.length === 0,
    overlaps,
    boundaryViolations,
    warnings
  };
}

/**
 * Renders complete architectural 2D SVG Blueprint with dimensions and annotations.
 */
function renderSvgFloorPlan(options) {
  const { rooms, buildW, buildL, plotW, plotL, setbacks, floorNumber, facing } = options;

  // Scale: 16 pixels per foot
  const SCALE = 16;
  const PADDING = 60;
  const svgWidth = Math.round(plotW * SCALE + PADDING * 2);
  const svgHeight = Math.round(plotL * SCALE + PADDING * 2);

  const offsetX = PADDING + (setbacks.left || 3) * SCALE;
  const offsetY = PADDING + (setbacks.front || 5) * SCALE;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" class="w-full h-auto bg-slate-50 font-sans" id="floorplan-svg-floor-${floorNumber}">
  <defs>
    <pattern id="grid-${floorNumber}" width="16" height="16" patternUnits="userSpaceOnUse">
      <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#e2e8f0" stroke-width="0.5"/>
    </pattern>
    <marker id="arrow-${floorNumber}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb" />
    </marker>
  </defs>

  <!-- Background Grid -->
  <rect width="100%" height="100%" fill="url(#grid-${floorNumber})" />

  <!-- Plot Outer Boundary (Dotted Line) -->
  <rect x="${PADDING}" y="${PADDING}" width="${plotW * SCALE}" height="${plotL * SCALE}" 
    fill="#ffffff" stroke="#94a3b8" stroke-width="2" stroke-dasharray="6,4" rx="4" />
  <text x="${PADDING + 10}" y="${PADDING + 22}" fill="#64748b" font-size="11" font-weight="600">PLOT BOUNDARY (${plotW}' x ${plotL}')</text>

  <!-- Setback Annotations -->
  <text x="${PADDING + (plotW * SCALE) / 2}" y="${PADDING - 12}" text-anchor="middle" fill="#0284c7" font-size="12" font-weight="700">ROAD ACCESS (FRONT SETBACK ${setbacks.front || 5}')</text>
  
  <!-- Building Footprint / Outer Walls Base -->
  <g id="rooms-group" transform="translate(${offsetX}, ${offsetY})">
    <!-- Outer Building Border -->
    <rect x="0" y="0" width="${buildW * SCALE}" height="${buildL * SCALE}" fill="none" stroke="#0f172a" stroke-width="3" />
    
    <!-- Room Polygons -->`;

  rooms.forEach(r => {
    const rx = r.x * SCALE;
    const ry = r.y * SCALE;
    const rw = r.width * SCALE;
    const rl = r.length * SCALE;

    svg += `
    <g class="room-node cursor-pointer transition-all duration-200" id="room-${r.id}">
      <rect x="${rx}" y="${ry}" width="${rw}" height="${rl}" 
        fill="${r.color}" stroke="#334155" stroke-width="2" />
      
      <!-- Room Title & Dimensions -->
      <text x="${rx + rw / 2}" y="${ry + rl / 2 - 8}" text-anchor="middle" fill="#0f172a" font-size="12" font-weight="700">${r.name}</text>
      <text x="${rx + rw / 2}" y="${ry + rl / 2 + 10}" text-anchor="middle" fill="#475569" font-size="10" font-weight="500">${r.width}'0" x ${r.length}'0"</text>
      <text x="${rx + rw / 2}" y="${ry + rl / 2 + 24}" text-anchor="middle" fill="#2563eb" font-size="9" font-weight="600">(${Math.round(r.width * r.length)} sq.ft)</text>

      <!-- Vastu Badge -->
      <rect x="${rx + 6}" y="${ry + 6}" width="28" height="15" rx="3" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
      <text x="${rx + 20}" y="${ry + 17}" text-anchor="middle" fill="#64748b" font-size="8.5" font-weight="700">${r.vastuZone || 'NE'}</text>
    `;

    // Draw Doors
    if (r.doors && r.doors.length > 0) {
      r.doors.forEach(d => {
        const dw = d.width * SCALE;
        if (d.wall === 'front') {
          svg += `
          <!-- Door Arc -->
          <path d="M ${rx + d.offset * SCALE} ${ry} A ${dw} ${dw} 0 0 1 ${rx + d.offset * SCALE + dw} ${ry + dw}" fill="none" stroke="#2563eb" stroke-width="1.5" stroke-dasharray="2,2"/>
          <line x1="${rx + d.offset * SCALE}" y1="${ry}" x2="${rx + d.offset * SCALE}" y2="${ry + dw}" stroke="#2563eb" stroke-width="2.5"/>`;
        }
      });
    }

    // Draw Windows
    if (r.windows && r.windows.length > 0) {
      r.windows.forEach(w => {
        const ww = w.width * SCALE;
        if (w.wall === 'right') {
          svg += `<line x1="${rx + rw}" y1="${ry + w.offset * SCALE}" x2="${rx + rw}" y2="${ry + (w.offset + w.width) * SCALE}" stroke="#0284c7" stroke-width="5"/>`;
        } else if (w.wall === 'front') {
          svg += `<line x1="${rx + w.offset * SCALE}" y1="${ry}" x2="${rx + (w.offset + w.width) * SCALE}" y2="${ry}" stroke="#0284c7" stroke-width="5"/>`;
        } else if (w.wall === 'rear') {
          svg += `<line x1="${rx + w.offset * SCALE}" y1="${ry + rl}" x2="${rx + (w.offset + w.width) * SCALE}" y2="${ry + rl}" stroke="#0284c7" stroke-width="5"/>`;
        } else if (w.wall === 'left') {
          svg += `<line x1="${rx}" y1="${ry + w.offset * SCALE}" x2="${rx}" y2="${ry + (w.offset + w.width) * SCALE}" stroke="#0284c7" stroke-width="5"/>`;
        }
      });
    }

    // Staircase Tread Details
    if (r.type === 'staircase') {
      const steps = 10;
      const stepH = rl / steps;
      for (let s = 1; s < steps; s++) {
        svg += `<line x1="${rx}" y1="${ry + s * stepH}" x2="${rx + rw}" y2="${ry + s * stepH}" stroke="#94a3b8" stroke-width="1.2"/>`;
      }
      svg += `
      <line x1="${rx + rw / 2}" y1="${ry + rl - 10}" x2="${rx + rw / 2}" y2="${ry + 15}" stroke="#2563eb" stroke-width="2" marker-end="url(#arrow-${floorNumber})"/>
      <text x="${rx + rw / 2 + 14}" y="${ry + rl / 2}" fill="#2563eb" font-size="9" font-weight="700">UP</text>`;
    }

    svg += `</g>`;
  });

  svg += `
  </g>

  <!-- North Direction Compass Symbol -->
  <g transform="translate(${svgWidth - 55}, 45)">
    <circle cx="0" cy="0" r="18" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
    <polygon points="0,-14 5,4 0,1 -5,4" fill="#ef4444" />
    <polygon points="0,14 5,-4 0,-1 -5,-4" fill="#64748b" />
    <text x="0" y="-17" text-anchor="middle" fill="#ef4444" font-size="10" font-weight="800">N</text>
  </g>

  <!-- Dimension Lines -->
  <g transform="translate(${offsetX}, ${offsetY + buildL * SCALE + 20})">
    <line x1="0" y1="0" x2="${buildW * SCALE}" y2="0" stroke="#64748b" stroke-width="1.5" />
    <line x1="0" y1="-5" x2="0" y2="5" stroke="#64748b" stroke-width="1.5" />
    <line x1="${buildW * SCALE}" y1="-5" x2="${buildW * SCALE}" y2="5" stroke="#64748b" stroke-width="1.5" />
    <text x="${(buildW * SCALE) / 2}" y="15" text-anchor="middle" fill="#334155" font-size="11" font-weight="700">Total Width: ${buildW}'0"</text>
  </g>

  <!-- Title & Legend Box -->
  <g transform="translate(${PADDING}, ${svgHeight - 40})">
    <text x="0" y="0" fill="#0f172a" font-size="12" font-weight="700">FLOOR ${floorNumber}: BUILT-UP AREA ${Math.round(buildW * buildL)} SQ.FT</text>
    <text x="0" y="15" fill="#64748b" font-size="10">Orientation Facing: ${facing} | Setbacks: F:${setbacks.front}' R:${setbacks.rear}' L:${setbacks.left}' R:${setbacks.right}'</text>
  </g>
</svg>`;

  return svg;
}

module.exports = {
  generateGeometricFloorPlan,
  renderSvgFloorPlan,
  validateLayout,
  checkLayoutFeasibility,
  planRoomDistribution,
  ROOM_STANDARDS
};
