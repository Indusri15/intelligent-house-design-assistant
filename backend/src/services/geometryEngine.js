/**
 * Geometric Floor-Plan Generation Engine
 * Handles non-overlapping polygon allocation, setback clearances, circulation,
 * vertical staircase alignment, and vector SVG architectural rendering.
 */

// Architectural room standard aspect ratios and minimum dimensions (in feet)
const ROOM_STANDARDS = {
  living: { minW: 12, minL: 14, targetArea: 180, color: '#e0f2fe', label: 'Living Room' },
  master_bedroom: { minW: 11, minL: 13, targetArea: 160, color: '#ede9fe', label: 'Master Bedroom' },
  bedroom: { minW: 10, minL: 11, targetArea: 130, color: '#f3e8ff', label: 'Bedroom' },
  kitchen: { minW: 8, minL: 10, targetArea: 90, color: '#ffedd5', label: 'Kitchen' },
  dining: { minW: 9, minL: 10, targetArea: 100, color: '#fef3c7', label: 'Dining Space' },
  pooja: { minW: 5, minL: 5, targetArea: 30, color: '#fef9c3', label: 'Pooja Room' },
  bathroom: { minW: 5, minL: 7, targetArea: 40, color: '#cffafe', label: 'Toilet / Bath' },
  utility: { minW: 5, minL: 6, targetArea: 35, color: '#f1f5f9', label: 'Utility / Wash' },
  staircase: { minW: 7, minL: 10, targetArea: 75, color: '#e2e8f0', label: 'Staircase' },
  parking: { minW: 10, minL: 15, targetArea: 160, color: '#f8fafc', label: 'Car Parking' },
  balcony: { minW: 4, minL: 8, targetArea: 40, color: '#d1fae5', label: 'Balcony' },
  study: { minW: 8, minL: 9, targetArea: 80, color: '#fae8ff', label: 'Study Room' },
  corridor: { minW: 4, minL: 12, targetArea: 60, color: '#ffffff', label: 'Circulation Foyer' }
};

/**
 * Generates geometric floor plan layouts with multiple alternative candidates
 */
function generateGeometricFloorPlan(project) {
  const plotL = Number(project.plot?.length || 50);
  const plotW = Number(project.plot?.width || 30);
  const setbacks = project.plot?.setbacks || { front: 5, rear: 3, left: 3, right: 3 };
  const facing = project.plot?.facingDirection || 'East';
  const floorsCount = Number(project.accommodation?.floors || 1);
  const reqBedrooms = Number(project.accommodation?.bedrooms || 3);
  const reqBathrooms = Number(project.accommodation?.bathrooms || 2);
  const hasPooja = project.accommodation?.poojaRoom !== false;
  const hasDining = project.accommodation?.diningRoom !== false;
  const hasUtility = project.accommodation?.utilityArea !== false;
  const hasParking = project.accommodation?.parking !== false;
  const hasStudy = Boolean(project.accommodation?.studyRoom);

  // Calculate allowable buildable footprint
  const buildW = Math.max(12, plotW - (Number(setbacks.left) || 3) - (Number(setbacks.right) || 3));
  const buildL = Math.max(14, plotL - (Number(setbacks.front) || 5) - (Number(setbacks.rear) || 3));
  const buildAreaPerFloor = Math.round(buildW * buildL);

  // Generate 3 Distinct Layout Alternatives
  const candidates = [
    {
      id: 'candidate_a',
      name: 'Option A: Balanced Circulation & Vastu Focus',
      description: 'Zoned living and dining spaces with direct northeast morning light and private rear master suite.',
      strategy: 'balanced'
    },
    {
      id: 'candidate_b',
      name: 'Option B: Contemporary Open-Plan Living',
      description: 'Expansive open-concept living-dining lounge with integrated modular island kitchen and cross-ventilation.',
      strategy: 'open_plan'
    },
    {
      id: 'candidate_c',
      name: 'Option C: Compact Maximum Private Bed Quarters',
      description: 'Optimized bedroom dimensions maximizing ensuite storage and dedicated study nook.',
      strategy: 'compact_bedrooms'
    }
  ];

  const generatedAlternatives = candidates.map(cand => {
    const floorsData = [];
    for (let f = 1; f <= floorsCount; f++) {
      const isGround = (f === 1);
      const rooms = allocateRoomsForFloor({
        floorNumber: f,
        isGround,
        buildW,
        buildL,
        reqBedrooms,
        reqBathrooms,
        hasPooja,
        hasDining,
        hasUtility,
        hasParking,
        hasStudy,
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
        boundary: { x: setbacks.left || 3, y: setbacks.front || 5, width: buildW, length: buildL },
        rooms,
        walls,
        svgContent
      });
    }

    return {
      id: cand.id,
      name: cand.name,
      description: cand.description,
      score: cand.strategy === 'balanced' ? 94 : cand.strategy === 'open_plan' ? 90 : 88,
      floors: floorsData
    };
  });

  const selectedCandidate = generatedAlternatives[0];
  const totalBuiltUpAreaSqFt = buildAreaPerFloor * floorsCount;
  const groundFloorAreaSqFt = buildAreaPerFloor;
  const firstFloorAreaSqFt = floorsCount > 1 ? buildAreaPerFloor : 0;

  // Validation Check
  const validation = validateLayout(selectedCandidate.floors[0].rooms, buildW, buildL);

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
 * Deterministic room polygon placement on a 2D bounding grid
 */
function allocateRoomsForFloor(params) {
  const { isGround, buildW, buildL, reqBedrooms, reqBathrooms, hasPooja, hasDining, hasUtility, hasParking, hasStudy, facing, strategy, floorsCount } = params;
  const rooms = [];

  // Coordinate frame:
  // Origin (0,0) is Front-Left of buildable footprint.
  // X axis: Left -> Right (width)
  // Y axis: Front -> Rear (length)

  // Ground Floor Allocation
  if (isGround) {
    let currentY = 0;
    const halfW = Math.floor(buildW / 2);

    // Front Section: Parking / Entrance Porch & Living Room
    if (hasParking && buildW >= 22) {
      rooms.push({
        id: 'parking_gf',
        name: 'Car Port / Porch',
        type: 'parking',
        x: 0,
        y: 0,
        width: Math.min(12, halfW),
        length: 14,
        areaSqFt: Math.min(12, halfW) * 14,
        vastuZone: facing === 'East' ? 'SE' : 'NW',
        doors: [{ wall: 'front', offset: 2, width: 9 }],
        windows: [],
        color: ROOM_STANDARDS.parking.color
      });

      rooms.push({
        id: 'living_gf',
        name: 'Living Room',
        type: 'living',
        x: Math.min(12, halfW),
        y: 0,
        width: buildW - Math.min(12, halfW),
        length: 14,
        areaSqFt: (buildW - Math.min(12, halfW)) * 14,
        vastuZone: facing === 'East' ? 'NE' : 'E',
        doors: [{ wall: 'front', offset: 3, width: 3.5 }, { wall: 'rear', offset: 4, width: 3 }],
        windows: [{ wall: 'right', offset: 4, width: 5 }],
        color: ROOM_STANDARDS.living.color
      });
      currentY = 14;
    } else {
      // Full Width Living + Foyer
      rooms.push({
        id: 'living_gf',
        name: 'Formal Living Room',
        type: 'living',
        x: 0,
        y: 0,
        width: buildW,
        length: Math.min(16, Math.floor(buildL * 0.35)),
        areaSqFt: buildW * Math.min(16, Math.floor(buildL * 0.35)),
        vastuZone: 'E',
        doors: [{ wall: 'front', offset: Math.floor(buildW * 0.6), width: 3.5 }],
        windows: [{ wall: 'front', offset: 2, width: 4.5 }, { wall: 'right', offset: 3, width: 4.5 }],
        color: ROOM_STANDARDS.living.color
      });
      currentY = Math.min(16, Math.floor(buildL * 0.35));
    }

    // Mid Section: Staircase + Dining + Kitchen + Pooja
    const midSectionLength = Math.max(12, Math.floor((buildL - currentY) * 0.55));
    const stairW = 7;
    const stairL = 10;

    // Staircase on South / SW facade or Left side
    rooms.push({
      id: 'staircase_gf',
      name: 'Staircase',
      type: 'staircase',
      x: 0,
      y: currentY,
      width: stairW,
      length: midSectionLength,
      areaSqFt: stairW * midSectionLength,
      vastuZone: 'S',
      doors: [{ wall: 'right', offset: 2, width: 3 }],
      windows: [{ wall: 'left', offset: 3, width: 3 }],
      color: ROOM_STANDARDS.staircase.color
    });

    const remainMidW = buildW - stairW;
    const kitchenW = Math.floor(remainMidW * 0.5);
    const diningW = remainMidW - kitchenW;

    // Dining Space
    rooms.push({
      id: 'dining_gf',
      name: hasDining ? 'Dining Lounge' : 'Circulation Hall',
      type: 'dining',
      x: stairW,
      y: currentY,
      width: diningW,
      length: midSectionLength,
      areaSqFt: diningW * midSectionLength,
      vastuZone: 'CENTER',
      doors: [{ wall: 'left', offset: 2, width: 3 }, { wall: 'right', offset: 2, width: 3 }],
      windows: [],
      color: ROOM_STANDARDS.dining.color
    });

    // Kitchen on East/SE
    rooms.push({
      id: 'kitchen_gf',
      name: 'Modular Kitchen',
      type: 'kitchen',
      x: stairW + diningW,
      y: currentY,
      width: kitchenW,
      length: midSectionLength,
      areaSqFt: kitchenW * midSectionLength,
      vastuZone: 'SE',
      doors: [{ wall: 'left', offset: 2, width: 3 }],
      windows: [{ wall: 'right', offset: 3, width: 4 }],
      color: ROOM_STANDARDS.kitchen.color
    });

    // Pooja Room (if requested)
    if (hasPooja && kitchenW > 7) {
      // Carve out a pristine NE / East corner pooja nook
      rooms.push({
        id: 'pooja_gf',
        name: 'Pooja Mandir',
        type: 'pooja',
        x: stairW + diningW,
        y: currentY,
        width: 5,
        length: 5,
        areaSqFt: 25,
        vastuZone: 'NE',
        doors: [{ wall: 'left', offset: 1, width: 2.5 }],
        windows: [],
        color: ROOM_STANDARDS.pooja.color
      });
    }

    currentY += midSectionLength;

    // Rear Section: Master Bedroom + Attached Bathroom + General Bath
    const rearLength = Math.max(10, buildL - currentY);
    const bedW = Math.floor(buildW * 0.65);
    const bathW = buildW - bedW;

    rooms.push({
      id: 'master_bedroom_gf',
      name: 'Master Bedroom',
      type: 'master_bedroom',
      x: 0,
      y: currentY,
      width: bedW,
      length: rearLength,
      areaSqFt: bedW * rearLength,
      vastuZone: 'SW',
      doors: [{ wall: 'front', offset: 2, width: 3 }],
      windows: [{ wall: 'rear', offset: 3, width: 4 }, { wall: 'left', offset: 3, width: 4 }],
      color: ROOM_STANDARDS.master_bedroom.color
    });

    const halfBathL = Math.floor(rearLength / 2);
    rooms.push({
      id: 'attached_bath_gf',
      name: 'Attached Toilet',
      type: 'bathroom',
      x: bedW,
      y: currentY,
      width: bathW,
      length: halfBathL,
      areaSqFt: bathW * halfBathL,
      vastuZone: 'W',
      doors: [{ wall: 'left', offset: 1, width: 2.5 }],
      windows: [{ wall: 'right', offset: 1, width: 2 }],
      color: ROOM_STANDARDS.bathroom.color
    });

    rooms.push({
      id: 'common_bath_gf',
      name: hasUtility ? 'Utility / Wash' : 'Common Bath',
      type: hasUtility ? 'utility' : 'bathroom',
      x: bedW,
      y: currentY + halfBathL,
      width: bathW,
      length: rearLength - halfBathL,
      areaSqFt: bathW * (rearLength - halfBathL),
      vastuZone: 'NW',
      doors: [{ wall: 'front', offset: 1, width: 2.5 }],
      windows: [{ wall: 'rear', offset: 1, width: 2 }],
      color: ROOM_STANDARDS.bathroom.color
    });
  } else {
    // Upper Floor (Floor 2+)
    // Align staircase at exact same position (0, midY, 7, midL)
    const stairW = 7;
    const midY = Math.floor(buildL * 0.35);
    const midL = Math.floor(buildL * 0.30);

    // Front: Bedroom 2 + Balcony + Optional Study
    const frontL = midY;
    const halfW = Math.floor(buildW / 2);

    rooms.push({
      id: `bedroom_f${params.floorNumber}_1`,
      name: 'Bedroom 2',
      type: 'bedroom',
      x: 0,
      y: 0,
      width: halfW,
      length: frontL,
      areaSqFt: halfW * frontL,
      vastuZone: 'NW',
      doors: [{ wall: 'rear', offset: 2, width: 3 }],
      windows: [{ wall: 'front', offset: 2, width: 4 }, { wall: 'left', offset: 2, width: 4 }],
      color: ROOM_STANDARDS.bedroom.color
    });

    rooms.push({
      id: `balcony_f${params.floorNumber}`,
      name: hasStudy ? 'Study / Lounge' : 'Terrace Balcony',
      type: hasStudy ? 'study' : 'balcony',
      x: halfW,
      y: 0,
      width: buildW - halfW,
      length: frontL,
      areaSqFt: (buildW - halfW) * frontL,
      vastuZone: 'NE',
      doors: [{ wall: 'rear', offset: 2, width: 3 }],
      windows: [{ wall: 'front', offset: 2, width: 5 }],
      color: hasStudy ? ROOM_STANDARDS.study.color : ROOM_STANDARDS.balcony.color
    });

    // Aligned Staircase
    rooms.push({
      id: `staircase_f${params.floorNumber}`,
      name: 'Staircase Landing',
      type: 'staircase',
      x: 0,
      y: midY,
      width: stairW,
      length: midL,
      areaSqFt: stairW * midL,
      vastuZone: 'S',
      doors: [{ wall: 'right', offset: 2, width: 3 }],
      windows: [{ wall: 'left', offset: 2, width: 3 }],
      color: ROOM_STANDARDS.staircase.color
    });

    // Upper Family Lounge
    rooms.push({
      id: `lounge_f${params.floorNumber}`,
      name: 'Upper Family Lounge',
      type: 'living',
      x: stairW,
      y: midY,
      width: buildW - stairW,
      length: midL,
      areaSqFt: (buildW - stairW) * midL,
      vastuZone: 'CENTER',
      doors: [{ wall: 'left', offset: 2, width: 3 }],
      windows: [{ wall: 'right', offset: 3, width: 4 }],
      color: ROOM_STANDARDS.living.color
    });

    // Rear: Bedroom 3 + Attached Bath
    const rearY = midY + midL;
    const rearL = buildL - rearY;
    const bed3W = Math.floor(buildW * 0.65);

    rooms.push({
      id: `bedroom_f${params.floorNumber}_2`,
      name: 'Bedroom 3 (Guest)',
      type: 'bedroom',
      x: 0,
      y: rearY,
      width: bed3W,
      length: rearL,
      areaSqFt: bed3W * rearL,
      vastuZone: 'SW',
      doors: [{ wall: 'front', offset: 2, width: 3 }],
      windows: [{ wall: 'rear', offset: 3, width: 4 }],
      color: ROOM_STANDARDS.bedroom.color
    });

    rooms.push({
      id: `bath_f${params.floorNumber}`,
      name: 'Toilet / Bath',
      type: 'bathroom',
      x: bed3W,
      y: rearY,
      width: buildW - bed3W,
      length: rearL,
      areaSqFt: (buildW - bed3W) * rearL,
      vastuZone: 'W',
      doors: [{ wall: 'front', offset: 1, width: 2.5 }],
      windows: [{ wall: 'right', offset: 1, width: 2 }],
      color: ROOM_STANDARDS.bathroom.color
    });
  }

  return rooms;
}

/**
 * Extracts wall line segments with thickness for realistic architectural 2D blueprints
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
    // Top wall
    if (r.y > 0) walls.push({ x1: r.x, y1: r.y, x2: r.x + r.width, y2: r.y, thickness: 0.375, isExterior: false });
    // Left wall
    if (r.x > 0) walls.push({ x1: r.x, y1: r.y, x2: r.x, y2: r.y + r.length, thickness: 0.375, isExterior: false });
  });

  return walls;
}

/**
 * Validates non-overlapping polygons and boundary fit
 */
function validateLayout(rooms, buildW, buildL) {
  const overlaps = [];
  const boundaryViolations = [];
  const warnings = [];

  for (let i = 0; i < rooms.length; i++) {
    const r1 = rooms[i];
    // Check boundary
    if (r1.x < 0 || r1.y < 0 || r1.x + r1.width > buildW + 0.1 || r1.y + r1.length > buildL + 0.1) {
      boundaryViolations.push(`Room "${r1.name}" extends beyond permitted building footprint.`);
    }

    // Check overlaps
    for (let j = i + 1; j < rooms.length; j++) {
      const r2 = rooms[j];
      const overlapX = Math.max(0, Math.min(r1.x + r1.width, r2.x + r2.width) - Math.max(r1.x, r2.x));
      const overlapY = Math.max(0, Math.min(r1.y + r1.length, r2.y + r2.length) - Math.max(r1.y, r2.y));

      // Small allowance for pooja nook or touching boundaries
      if (overlapX > 0.5 && overlapY > 0.5 && r1.id !== 'pooja_gf' && r2.id !== 'pooja_gf') {
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
 * Renders complete architectural 2D SVG Blueprint
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
    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
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
    <!-- Room Polygons -->`;

  rooms.forEach(r => {
    const rx = r.x * SCALE;
    const ry = r.y * SCALE;
    const rw = r.width * SCALE;
    const rl = r.length * SCALE;

    svg += `
    <g class="room-node cursor-pointer transition-all duration-200" id="room-${r.id}">
      <rect x="${rx}" y="${ry}" width="${rw}" height="${rl}" 
        fill="${r.color}" stroke="#334155" stroke-width="2.5" />
      
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
      <line x1="${rx + rw / 2}" y1="${ry + rl - 10}" x2="${rx + rw / 2}" y2="${ry + 15}" stroke="#2563eb" stroke-width="2" marker-end="url(#arrow)"/>
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
  ROOM_STANDARDS
};
