const defaultRates = require('../data/defaultRates.json');

/**
 * Bill of Quantities (BOQ) and Construction Cost Estimation Calculator
 */
function calculateProjectBOQ(project, floorPlan, selectedPackage = 'MEDIUM', customRates = null, designSelection = null) {
  const rates = customRates || defaultRates;
  const mat = rates.materialRates;
  const lab = rates.labourRates;

  const floors = Math.max(1, Number(project.accommodation?.floors || 1));
  let totalBuiltUpAreaSqFt = Number(floorPlan?.totalBuiltUpAreaSqFt);
  if (!totalBuiltUpAreaSqFt || isNaN(totalBuiltUpAreaSqFt) || totalBuiltUpAreaSqFt <= 0) {
    if (project.plot?.width && project.plot?.length) {
      const sbFront = Number(project.plot?.setbacks?.front ?? 5);
      const sbRear = Number(project.plot?.setbacks?.rear ?? 3);
      const sbLeft = Number(project.plot?.setbacks?.left ?? 3);
      const sbRight = Number(project.plot?.setbacks?.right ?? 3);
      const bW = Math.max(12, Math.round(Number(project.plot.width) - sbLeft - sbRight));
      const bL = Math.max(14, Math.round(Number(project.plot.length) - sbFront - sbRear));
      totalBuiltUpAreaSqFt = bW * bL * floors;
    } else if (project.plot?.area) {
      totalBuiltUpAreaSqFt = Math.round(Number(project.plot.area) * 0.70 * floors);
    } else {
      totalBuiltUpAreaSqFt = 1500;
    }
  }

  const groundFloorArea = Number(floorPlan?.groundFloorAreaSqFt || Math.round(totalBuiltUpAreaSqFt / floors));
  const numBedrooms = Number(project.accommodation?.bedrooms || 3);
  const numBathrooms = Number(project.accommodation?.bathrooms || 2);
  const userBudget = Number(project.budget || 3500000);

  // Package Multipliers / Specifications
  const pkg = (selectedPackage || 'MEDIUM').toUpperCase();

  // Check if custom design selection is passed
  const customExterior = designSelection?.exterior || null;
  const customRooms = designSelection?.interiorRooms || [];

  // 1. Excavation (Volume in cft: Ground area foundation footing trenches, 5ft depth)
  const excavationCft = Math.round(groundFloorArea * 1.5);
  const excavationLabourCost = Math.round(excavationCft * lab.earthwork_excavation.rate);

  // 2. Concrete (PCC + RCC Footings, Plinth, Columns, Beams, Slabs)
  // Structural rule of thumb: ~0.038 m3/sq.ft = 1.34 cft concrete per sq.ft built-up area
  const concreteCft = Math.round(totalBuiltUpAreaSqFt * 1.35);
  const concreteLabourCost = Math.round(concreteCft * lab.pcc_rcc_concrete.rate);

  // 3. Cement (0.42 bags per sq.ft of built-up area for all structural + masonry + plastering)
  const cementQtyBags = Math.round(totalBuiltUpAreaSqFt * 0.42);
  const cementWastage = mat.cement_bag.wastage;
  const cementPurchasable = Math.ceil(cementQtyBags * (1 + cementWastage / 100));
  const cementMatCost = cementPurchasable * mat.cement_bag.rate;

  // 4. Steel Reinforcement (Fe 550D TMT: ~3.85 kg per sq.ft)
  const steelKg = Math.round(totalBuiltUpAreaSqFt * 3.85);
  const steelWastage = mat.steel_tmt.wastage;
  const steelPurchasable = Math.ceil(steelKg * (1 + steelWastage / 100));
  const steelMatCost = steelPurchasable * mat.steel_tmt.rate;
  const steelLabourCost = steelPurchasable * lab.steel_bar_bending.rate;

  // 5. Sand (M-Sand for concrete & masonry: ~1.8 cft per sq.ft)
  const sandCft = Math.round(totalBuiltUpAreaSqFt * 1.8);
  const sandPurchasable = Math.ceil(sandCft * (1 + mat.sand_msand.wastage / 100));
  const sandMatCost = sandPurchasable * mat.sand_msand.rate;

  // 6. Coarse Aggregate (20mm granite stone: ~1.35 cft per sq.ft)
  const aggCft = Math.round(totalBuiltUpAreaSqFt * 1.35);
  const aggPurchasable = Math.ceil(aggCft * (1 + mat.coarse_aggregate_20mm.wastage / 100));
  const aggMatCost = aggPurchasable * mat.coarse_aggregate_20mm.rate;

  // 7. Brickwork / AAC Masonry (Wall area = ~1.4 sq.ft of 9" brickwork equivalent per sq.ft built-up area)
  const masonryCft = Math.round(totalBuiltUpAreaSqFt * 1.15);
  let brickItemName = "Standard Red Clay Bricks";
  let brickUnit = "unit_1k";
  let brickRate = mat.red_clay_bricks.rate;
  let brickQty = Math.ceil((masonryCft * 13.5) / 1000); // 1000s of bricks
  let brickMatCost = brickQty * brickRate;
  if (pkg === 'RICH') {
    brickItemName = "AAC Lightweight Thermal Blocks";
    brickUnit = "cft";
    brickRate = mat.aac_blocks.rate;
    brickQty = masonryCft;
    brickMatCost = brickQty * brickRate;
  }
  const masonryLabourCost = Math.round(masonryCft * lab.brick_masonry.rate);

  // 8. Plastering (Internal + External: ~2.8 sq.ft plaster per sq.ft built-up area)
  const plasterSqFt = Math.round(totalBuiltUpAreaSqFt * 2.8);
  const plasterLabourCost = Math.round(plasterSqFt * lab.plastering_internal_external.rate);

  // 9. Flooring & Tiles
  const floorTileNetSqFt = Math.round(totalBuiltUpAreaSqFt * 0.82); // deducting wall thickness
  let tileRate = mat.vitrified_tiles_medium.rate;
  let tileName = "GVT Glazed Vitrified Tiles (4x2 ft)";
  let tileWastage = mat.vitrified_tiles_medium.wastage;
  if (pkg === 'BASIC') {
    tileRate = mat.vitrified_tiles_basic.rate;
    tileName = "Standard Vitrified Tiles (2x2 ft)";
    tileWastage = mat.vitrified_tiles_basic.wastage;
  } else if (pkg === 'RICH') {
    tileRate = mat.italian_marble_rich.rate;
    tileName = "Italian Marble / Large Slab Porcelain";
    tileWastage = mat.italian_marble_rich.wastage;
  }

  // Adjust tile if interior room specifies Italian Marble / Wooden planks
  const specifiedFlooring = customRooms.find(r => r.flooring)?.flooring || '';
  if (specifiedFlooring.toLowerCase().includes('marble')) {
    tileRate = mat.italian_marble_rich.rate;
    tileName = `Italian Marble (${specifiedFlooring})`;
  } else if (specifiedFlooring.toLowerCase().includes('wood')) {
    tileRate = 110;
    tileName = `Wooden Texture Planks (${specifiedFlooring})`;
  }

  const tilePurchasable = Math.ceil(floorTileNetSqFt * (1 + tileWastage / 100));
  const tileMatCost = tilePurchasable * tileRate;
  const tileLabourCost = Math.round(floorTileNetSqFt * lab.tile_fixing.rate);

  // 10. Bathroom Wall Tiles & Waterproofing
  const bathWallTileSqFt = numBathrooms * 160; // 7ft height wall tiles
  const bathWallTileMatCost = Math.round(bathWallTileSqFt * (1 + mat.ceramic_wall_tiles.wastage / 100) * mat.ceramic_wall_tiles.rate);
  const bathTileLabourCost = Math.round(bathWallTileSqFt * lab.tile_fixing.rate);
  const waterproofingSqFt = Math.round(groundFloorArea + (numBathrooms * 40));
  const waterproofingMatCost = Math.round(waterproofingSqFt * mat.waterproofing_membrane.rate);

  // 11. Doors & Windows
  const mainDoorCost = mat.main_door_teak.rate;
  const internalDoorsCount = numBedrooms + numBathrooms + 2;
  const internalDoorRate = (pkg === 'RICH') ? mat.internal_door_veneer.rate : mat.internal_door_flush.rate;
  const internalDoorsMatCost = internalDoorsCount * internalDoorRate;

  const windowAreaSqFt = Math.round(totalBuiltUpAreaSqFt * 0.12);
  const windowRate = (pkg === 'BASIC') ? mat.aluminum_windows_2track.rate : mat.upvc_windows_3track.rate;
  const windowsMatCost = windowAreaSqFt * windowRate;

  // 12. Electrical & Automation
  const electricalPoints = Math.round(totalBuiltUpAreaSqFt * 0.08); // 8 points per 100 sqft
  const electricalRate = (pkg === 'RICH') ? mat.smart_automation_point.rate : mat.electrical_modular_point.rate;
  const electricalMatCost = electricalPoints * electricalRate;
  const electricalLabourCost = electricalPoints * lab.electrical_labour_per_point.rate;

  // 13. Plumbing & Sanitaryware
  const plumbingMatCost = numBathrooms * mat.plumbing_sanitary_per_bath.rate;
  const plumbingLabourCost = numBathrooms * lab.plumbing_labour_per_bath.rate;

  // 14. Painting
  const paintSqFt = Math.round(totalBuiltUpAreaSqFt * 2.8);
  let intPaintRate = mat.interior_paint_medium.rate;
  if (pkg === 'BASIC') intPaintRate = mat.interior_paint_basic.rate;
  if (pkg === 'RICH') intPaintRate = mat.interior_paint_rich.rate;
  const interiorPaintMatCost = Math.round(paintSqFt * 0.75 * intPaintRate);
  const exteriorPaintMatCost = Math.round(paintSqFt * 0.25 * mat.exterior_paint.rate);
  const paintLabourCost = Math.round(paintSqFt * lab.painting_labour.rate);

  // 15. Modular Kitchen & Wardrobes & False Ceiling
  let kitchenCost = mat.modular_kitchen_medium.rate;
  if (pkg === 'BASIC') kitchenCost = mat.modular_kitchen_basic.rate;
  if (pkg === 'RICH') kitchenCost = mat.modular_kitchen_rich.rate;

  let wardrobeCost = numBedrooms * ((pkg === 'RICH') ? mat.wardrobes_per_bedroom_rich.rate : mat.wardrobes_per_bedroom_medium.rate);
  if (pkg === 'BASIC') wardrobeCost = Math.round(numBedrooms * 25000);

  let falseCeilingCost = 0;
  if (pkg !== 'BASIC') {
    const falseCeilingArea = (pkg === 'RICH') ? Math.round(totalBuiltUpAreaSqFt * 0.85) : Math.round(totalBuiltUpAreaSqFt * 0.45);
    falseCeilingCost = Math.round(falseCeilingArea * mat.false_ceiling_gypsum.rate);
  }

  // 16. Exterior Facade Cladding & Finishes
  let facadeCladdingCost = (pkg === 'RICH') ? 65000 : (pkg === 'MEDIUM' ? 38000 : 15000);
  let facadeCladdingName = customExterior?.facadeMaterial || "Stone Cladding & WPC Louvers";

  // 17. Balcony & Staircase Railing
  let balconyRailingCost = (pkg === 'RICH') ? 48000 : (pkg === 'MEDIUM' ? 28000 : 14000);
  let balconyRailingName = customExterior?.balconyRailing || "Toughened Glass with SS Profile";

  // 18. Boundary Wall & Main Gate
  let gateCost = (pkg === 'RICH') ? 85000 : (pkg === 'MEDIUM' ? 45000 : 25000);
  let gateName = customExterior?.gateDesign || "CNC Laser Cut WPC Composite";

  // 19. Landscaping & Site Finishes
  let landscapeCost = (pkg === 'RICH') ? 60000 : (pkg === 'MEDIUM' ? 30000 : 12000);
  let landscapeName = customExterior?.landscaping || "Perimeter Planter Beds with Lawn Path";

  // Compile Detailed Line Items
  const boqLineItems = [
    {
      category: "Site Preparation & Foundation",
      code: "BOQ-01",
      itemName: "Earthwork Soil Excavation",
      description: "Excavation for isolated column footings and foundation trenches in all types of soil up to 5ft depth",
      specification: "Manual & JCB mechanical excavation with disposal within 50m",
      unit: "cft",
      quantity: excavationCft,
      wastagePercentage: 0,
      purchasableQuantity: excavationCft,
      materialRate: 0,
      materialCost: 0,
      labourRate: lab.earthwork_excavation.rate,
      labourCost: excavationLabourCost,
      totalCost: excavationLabourCost,
      assumptions: "Soil bearing capacity 180 kN/m2"
    },
    {
      category: "Substructure & RCC",
      code: "BOQ-02",
      itemName: "PCC & RCC Concrete Works",
      description: "M20/M25 design mix concrete for footings, plinth beam, columns, lintels, and roof slabs",
      specification: "1:1.5:3 grade with mechanical mixer and needle vibrators",
      unit: "cft",
      quantity: concreteCft,
      wastagePercentage: 2,
      purchasableQuantity: Math.round(concreteCft * 1.02),
      materialRate: 0, // computed via cement/steel/sand/aggregate items
      materialCost: 0,
      labourRate: lab.pcc_rcc_concrete.rate,
      labourCost: concreteLabourCost,
      totalCost: concreteLabourCost,
      assumptions: "Includes shuttering, centering and de-shuttering"
    },
    {
      category: "Structural Materials",
      code: "BOQ-03",
      itemName: "OPC 53 Grade Cement",
      description: "High performance Portland cement for RCC framing, masonry mortar and plaster",
      specification: "IS:12269 certified fresh 50kg bags",
      unit: "bag",
      quantity: cementQtyBags,
      wastagePercentage: cementWastage,
      purchasableQuantity: cementPurchasable,
      materialRate: mat.cement_bag.rate,
      materialCost: cementMatCost,
      labourRate: 35,
      labourCost: cementPurchasable * 35,
      totalCost: cementMatCost + (cementPurchasable * 35),
      assumptions: "0.42 bags per sq.ft built-up area"
    },
    {
      category: "Structural Materials",
      code: "BOQ-04",
      itemName: "Fe 550D TMT Reinforcement Steel",
      description: "Thermo-mechanically treated high ductility steel rebars for foundation, columns, and slabs",
      specification: "IS:1786 primary producers (Tata / JSW / Jindal)",
      unit: "kg",
      quantity: steelKg,
      wastagePercentage: steelWastage,
      purchasableQuantity: steelPurchasable,
      materialRate: mat.steel_tmt.rate,
      materialCost: steelMatCost,
      labourRate: lab.steel_bar_bending.rate,
      labourCost: steelLabourCost,
      totalCost: steelMatCost + steelLabourCost,
      assumptions: "3.85 kg per sq.ft built-up area"
    },
    {
      category: "Structural Materials",
      code: "BOQ-05",
      itemName: "Manufactured Fine Sand (M-Sand)",
      description: "Washed graded manufactured sand for concrete and plastering mortar",
      specification: "Zone-II graded aggregate silt content < 3%",
      unit: "cft",
      quantity: sandCft,
      wastagePercentage: mat.sand_msand.wastage,
      purchasableQuantity: sandPurchasable,
      materialRate: mat.sand_msand.rate,
      materialCost: sandMatCost,
      labourRate: 0,
      labourCost: 0,
      totalCost: sandMatCost,
      assumptions: "1.8 cft per sq.ft"
    },
    {
      category: "Structural Materials",
      code: "BOQ-06",
      itemName: "Coarse Granite Aggregate (20mm)",
      description: "Hard broken blue granite metal for RCC concrete matrix",
      specification: "Angular machine-crushed 20mm & 10mm blend",
      unit: "cft",
      quantity: aggCft,
      wastagePercentage: mat.coarse_aggregate_20mm.wastage,
      purchasableQuantity: aggPurchasable,
      materialRate: mat.coarse_aggregate_20mm.rate,
      materialCost: aggMatCost,
      labourRate: 0,
      labourCost: 0,
      totalCost: aggMatCost,
      assumptions: "1.35 cft per sq.ft"
    },
    {
      category: "Masonry",
      code: "BOQ-07",
      itemName: brickItemName,
      description: "External 9 inch and internal 4.5 inch wall partitions in 1:6 cement mortar",
      specification: (pkg === 'RICH') ? "IS:2185 Grade 1 AAC Blocks" : "Table moulded kiln-burnt red clay bricks",
      unit: brickUnit,
      quantity: brickQty,
      wastagePercentage: (pkg === 'RICH') ? 3 : 5,
      purchasableQuantity: brickQty,
      materialRate: brickRate,
      materialCost: brickMatCost,
      labourRate: lab.brick_masonry.rate,
      labourCost: masonryLabourCost,
      totalCost: brickMatCost + masonryLabourCost,
      assumptions: "Wall height 10 ft with lintel bands"
    },
    {
      category: "Plastering & Waterproofing",
      code: "BOQ-08",
      itemName: "Cement Plastering (2 Coats)",
      description: "Smooth 12mm internal plaster and 20mm sponge-finish exterior sand-faced plaster",
      specification: "1:4 cement mortar with curing for 14 days",
      unit: "sq.ft",
      quantity: plasterSqFt,
      wastagePercentage: 0,
      purchasableQuantity: plasterSqFt,
      materialRate: 0, // Included in cement & sand items
      materialCost: 0,
      labourRate: lab.plastering_internal_external.rate,
      labourCost: plasterLabourCost,
      totalCost: plasterLabourCost,
      assumptions: "2.8 sq.ft surface per sq.ft built-up area"
    },
    {
      category: "Plastering & Waterproofing",
      code: "BOQ-09",
      itemName: "Roof & Wet Area Waterproofing",
      description: "Elastomeric liquid polymer coating on terrace slab and bathroom sunken floors",
      specification: "Dr. Fixit / Fosroc 2-coat membrane with fiber mesh",
      unit: "sq.ft",
      quantity: waterproofingSqFt,
      wastagePercentage: 5,
      purchasableQuantity: Math.round(waterproofingSqFt * 1.05),
      materialRate: mat.waterproofing_membrane.rate,
      materialCost: waterproofingMatCost,
      labourRate: 15,
      labourCost: Math.round(waterproofingSqFt * 15),
      totalCost: waterproofingMatCost + Math.round(waterproofingSqFt * 15),
      assumptions: "Terrace + bathroom sunken slabs"
    },
    {
      category: "Flooring & Finishes",
      code: "BOQ-10",
      itemName: tileName,
      description: "Living, dining, bedrooms and corridors main floor covering with spacer joint grouting",
      specification: `${tileName} laid on cement bedding`,
      unit: "sq.ft",
      quantity: floorTileNetSqFt,
      wastagePercentage: tileWastage,
      purchasableQuantity: tilePurchasable,
      materialRate: tileRate,
      materialCost: tileMatCost,
      labourRate: lab.tile_fixing.rate,
      labourCost: tileLabourCost,
      totalCost: tileMatCost + tileLabourCost,
      assumptions: "Includes epoxy grout and border skirting"
    },
    {
      category: "Flooring & Finishes",
      code: "BOQ-11",
      itemName: "Bathroom Ceramic Wall Cladding",
      description: "Full-height designer ceramic wall tiles in all bathrooms",
      specification: "Kajaria / Somany anti-skid floor and glazed digital wall tiles",
      unit: "sq.ft",
      quantity: bathWallTileSqFt,
      wastagePercentage: 6,
      purchasableQuantity: Math.round(bathWallTileSqFt * 1.06),
      materialRate: mat.ceramic_wall_tiles.rate,
      materialCost: bathWallTileMatCost,
      labourRate: lab.tile_fixing.rate,
      labourCost: bathTileLabourCost,
      totalCost: bathWallTileMatCost + bathTileLabourCost,
      assumptions: `${numBathrooms} bathrooms cladded up to 7ft`
    },
    {
      category: "Doors & Windows",
      code: "BOQ-12",
      itemName: "Teak Wood Main Entrance Door",
      description: "Grand carved solid Burma/Ghana Teak wood door with heavy brass mortise hardware",
      specification: "Frame 5x3 inch, Shutter 38mm thickness with PU polish",
      unit: "set",
      quantity: 1,
      wastagePercentage: 0,
      purchasableQuantity: 1,
      materialRate: mainDoorCost,
      materialCost: mainDoorCost,
      labourRate: 3500,
      labourCost: 3500,
      totalCost: mainDoorCost + 3500,
      assumptions: "Main Vastu entrance door"
    },
    {
      category: "Doors & Windows",
      code: "BOQ-13",
      itemName: "Internal Room & Bathroom Doors",
      description: "Waterproof flush/veneer doors with hardwood frames and stainless steel cylindrical locks",
      specification: (pkg === 'RICH') ? "Teak veneer pressed shutters" : "Solid core flush door with laminate",
      unit: "set",
      quantity: internalDoorsCount,
      wastagePercentage: 0,
      purchasableQuantity: internalDoorsCount,
      materialRate: internalDoorRate,
      materialCost: internalDoorsMatCost,
      labourRate: 1200,
      labourCost: internalDoorsCount * 1200,
      totalCost: internalDoorsMatCost + (internalDoorsCount * 1200),
      assumptions: `${internalDoorsCount} doors across bedrooms, baths & kitchen`
    },
    {
      category: "Doors & Windows",
      code: "BOQ-14",
      itemName: "External Windows & Ventilators",
      description: "High-grade 3-track sliding UPVC/Aluminum windows with SS mosquito mesh and 5mm clear glass",
      specification: (pkg === 'BASIC') ? "Powder coated aluminum" : "UPVC multi-chamber profile (Fenesta/Aparna)",
      unit: "sq.ft",
      quantity: windowAreaSqFt,
      wastagePercentage: 2,
      purchasableQuantity: windowAreaSqFt,
      materialRate: windowRate,
      materialCost: windowsMatCost,
      labourRate: 45,
      labourCost: Math.round(windowAreaSqFt * 45),
      totalCost: windowsMatCost + Math.round(windowAreaSqFt * 45),
      assumptions: "12% of built-up area fenestration"
    },
    {
      category: "Electrical & Services",
      code: "BOQ-15",
      itemName: "Electrical Conduit, Wiring & Modular Switches",
      description: "FRLS fire-resistant copper wiring, concealed PVC conduits, and modular switch plates",
      specification: (pkg === 'RICH') ? "Schneider / Legrand Smart WiFi nodes" : "Anchor Roma / Havells Modular",
      unit: "point",
      quantity: electricalPoints,
      wastagePercentage: 2,
      purchasableQuantity: electricalPoints,
      materialRate: electricalRate,
      materialCost: electricalMatCost,
      labourRate: lab.electrical_labour_per_point.rate,
      labourCost: electricalLabourCost,
      totalCost: electricalMatCost + electricalLabourCost,
      assumptions: "Points for AC, geyser, fans, lights, UPS & TV"
    },
    {
      category: "Plumbing & Sanitary",
      code: "BOQ-16",
      itemName: "Plumbing Lines & Premium Sanitaryware",
      description: "Concealed CPVC hot/cold water distribution, SWR drainage pipes, wall-hung WC and CP fittings",
      specification: "Astral pipes + Kohler/Jaquar faucets & ceramic fixtures",
      unit: "bath",
      quantity: numBathrooms,
      wastagePercentage: 3,
      purchasableQuantity: numBathrooms,
      materialRate: mat.plumbing_sanitary_per_bath.rate,
      materialCost: plumbingMatCost,
      labourRate: lab.plumbing_labour_per_bath.rate,
      labourCost: plumbingLabourCost,
      totalCost: plumbingMatCost + plumbingLabourCost,
      assumptions: `${numBathrooms} bathrooms + utility sink point`
    },
    {
      category: "Painting & Polish",
      code: "BOQ-17",
      itemName: "Interior & Exterior Painting",
      description: "Two coats of wall putty, anti-fungal primer, and two finish coats of premium acrylic emulsion",
      specification: "Asian Paints Royale / Apex Ultima weatherproof exterior",
      unit: "sq.ft",
      quantity: paintSqFt,
      wastagePercentage: 3,
      purchasableQuantity: paintSqFt,
      materialRate: 0,
      materialCost: interiorPaintMatCost + exteriorPaintMatCost,
      labourRate: lab.painting_labour.rate,
      labourCost: paintLabourCost,
      totalCost: interiorPaintMatCost + exteriorPaintMatCost + paintLabourCost,
      assumptions: "Complete interior + exterior facade"
    },
    {
      category: "Interiors & Millwork",
      code: "BOQ-18",
      itemName: "Modular Kitchen Unit",
      description: "BWP grade marine plywood cabinets, tandem soft-close drawers, and 18mm polished granite counter",
      specification: (pkg === 'RICH') ? "PU Lacquered acrylic shutters with quartz slab" : "Merino laminate finish with stainless steel baskets",
      unit: "lump_sum",
      quantity: 1,
      wastagePercentage: 0,
      purchasableQuantity: 1,
      materialRate: kitchenCost,
      materialCost: kitchenCost,
      labourRate: 0,
      labourCost: 0,
      totalCost: kitchenCost,
      assumptions: "Includes SS sink, pull-outs & cutlery trays"
    },
    {
      category: "Interiors & Millwork",
      code: "BOQ-19",
      itemName: "Bedroom Wardrobes & Storage",
      description: "Floor-to-ceiling built-in wardrobes with loft storage, hangers and internal drawers",
      specification: (pkg === 'RICH') ? "Walk-in glass profile with profile LED lighting" : "MDF / Commercial ply with laminate finish",
      unit: "lump_sum",
      quantity: 1,
      wastagePercentage: 0,
      purchasableQuantity: 1,
      materialRate: wardrobeCost,
      materialCost: wardrobeCost,
      labourRate: 0,
      labourCost: 0,
      totalCost: wardrobeCost,
      assumptions: `Storage for ${numBedrooms} bedrooms`
    },
    {
      category: "Interiors & Millwork",
      code: "BOQ-20",
      itemName: "Gypsum False Ceiling & Cove Lighting",
      description: "Saint-Gobain gypsum board false ceiling with perimeter ambient LED cove illumination",
      specification: "12.5mm gypsum sheets with GI perimeter framework",
      unit: "lump_sum",
      quantity: 1,
      wastagePercentage: 0,
      purchasableQuantity: 1,
      materialRate: falseCeilingCost,
      materialCost: falseCeilingCost,
      labourRate: 0,
      labourCost: 0,
      totalCost: falseCeilingCost,
      assumptions: (pkg === 'BASIC') ? "Not included in basic package" : "Living, dining and master bedroom coverage"
    },
    {
      category: "Exterior & Facade",
      code: "BOQ-21",
      itemName: `Exterior Facade: ${facadeCladdingName}`,
      description: "Exterior facade stone cladding, louvers, or architectural texture panels",
      specification: facadeCladdingName,
      unit: "lump_sum",
      quantity: 1,
      wastagePercentage: 0,
      purchasableQuantity: 1,
      materialRate: facadeCladdingCost,
      materialCost: facadeCladdingCost,
      labourRate: 0,
      labourCost: 0,
      totalCost: facadeCladdingCost,
      assumptions: "Derived from AI Exterior Studio selection"
    },
    {
      category: "Exterior & Facade",
      code: "BOQ-22",
      itemName: `Balcony & Railing: ${balconyRailingName}`,
      description: "Balcony safety barrier and staircase handrail profile",
      specification: balconyRailingName,
      unit: "lump_sum",
      quantity: 1,
      wastagePercentage: 0,
      purchasableQuantity: 1,
      materialRate: balconyRailingCost,
      materialCost: balconyRailingCost,
      labourRate: 0,
      labourCost: 0,
      totalCost: balconyRailingCost,
      assumptions: "Derived from AI Exterior Studio selection"
    },
    {
      category: "Exterior & Boundary",
      code: "BOQ-23",
      itemName: `Main Gate & Boundary: ${gateName}`,
      description: "Main entrance gate, boundary wall treatment, and access hardware",
      specification: gateName,
      unit: "lump_sum",
      quantity: 1,
      wastagePercentage: 0,
      purchasableQuantity: 1,
      materialRate: gateCost,
      materialCost: gateCost,
      labourRate: 0,
      labourCost: 0,
      totalCost: gateCost,
      assumptions: "Derived from AI Exterior Studio selection"
    },
    {
      category: "Site & Landscaping",
      code: "BOQ-24",
      itemName: `Landscaping: ${landscapeName}`,
      description: "Softscape garden lawn, perimeter planter beds, and paver walkways",
      specification: landscapeName,
      unit: "lump_sum",
      quantity: 1,
      wastagePercentage: 0,
      purchasableQuantity: 1,
      materialRate: landscapeCost,
      materialCost: landscapeCost,
      labourRate: 0,
      labourCost: 0,
      totalCost: landscapeCost,
      assumptions: "Derived from AI Exterior Studio selection"
    }
  ];

  // Aggregations
  let subtotalMaterial = 0;
  let subtotalLabour = 0;

  boqLineItems.forEach(item => {
    subtotalMaterial += item.materialCost || 0;
    subtotalLabour += item.labourCost || 0;
  });

  const contractorCost = Math.round((subtotalMaterial + subtotalLabour) * lab.contractor_supervision_percentage);
  const architectFee = Math.round((subtotalMaterial + subtotalLabour) * lab.architect_structural_fee_percentage);
  const contingency = Math.round((subtotalMaterial + subtotalLabour + contractorCost) * lab.contingency_percentage);
  const interiorCost = kitchenCost + wardrobeCost + falseCeilingCost;

  const totalEstimatedCost = subtotalMaterial + subtotalLabour + contractorCost + architectFee + contingency;
  const costPerSqFt = Math.round(totalEstimatedCost / totalBuiltUpAreaSqFt);
  const budgetDifference = userBudget - totalEstimatedCost;

  // Reconcile 3-Tier Package Pricing with Validated Line-Item Estimates
  // Invariant: The selected package totalCost and costPerSqFt match totalEstimatedCost and costPerSqFt exactly.
  const baseRate = costPerSqFt;
  const basicRate = pkg === 'BASIC' ? baseRate : Math.round(baseRate * 0.80);
  const medRate = pkg === 'MEDIUM' ? baseRate : Math.round(baseRate * (pkg === 'BASIC' ? 1.25 : 1.0));
  const richRate = pkg === 'RICH' ? baseRate : Math.round(baseRate * (pkg === 'BASIC' ? 1.62 : 1.32));

  const basicCostEst = pkg === 'BASIC' ? totalEstimatedCost : Math.round(totalBuiltUpAreaSqFt * basicRate);
  const medCostEst = pkg === 'MEDIUM' ? totalEstimatedCost : Math.round(totalBuiltUpAreaSqFt * medRate);
  const richCostEst = pkg === 'RICH' ? totalEstimatedCost : Math.round(totalBuiltUpAreaSqFt * richRate);

  const packages = {
    basic: {
      name: "BASIC PACKAGE",
      ratePerSqFt: basicRate,
      totalCost: basicCostEst,
      costPerSqFt: basicRate,
      diffFromBudget: userBudget - basicCostEst,
      materialsCost: Math.round(basicCostEst * 0.62),
      labourCost: Math.round(basicCostEst * 0.38),
      specs: [
        "OPC 53 Cement & Fe 500 TMT Steel",
        "Kiln-Burnt Red Clay Brickwork",
        "2x2 ft Vitrified Standard Tiles",
        "Aluminum 2-Track Windows",
        "Anchor Roma Modular Switches",
        "Asian Paints Tractor Emulsion (2 Coats)",
        "Basic Semi-Modular Kitchen Cabinets",
        "Flush Doors with Wood Frames"
      ]
    },
    medium: {
      name: "MEDIUM PACKAGE",
      ratePerSqFt: medRate,
      totalCost: medCostEst,
      costPerSqFt: medRate,
      diffFromBudget: userBudget - medCostEst,
      materialsCost: Math.round(medCostEst * 0.64),
      labourCost: Math.round(medCostEst * 0.36),
      specs: [
        "Fe 550D High-Ductility TMT Rebars",
        "4x2 ft Glazed Vitrified Tiles (GVT)",
        "UPVC 3-Track Sliding Windows with Mesh",
        "Solid Teak Wood Main Door (Carved)",
        "Havells / Legrand Modular Electricals",
        "Asian Paints Apcolite Premium Emulsion",
        "Acrylic Finish Modular Kitchen with Soft-Close",
        "Gypsum False Ceiling in Living & Dining",
        "Floor-to-Ceiling Wardrobes in all Bedrooms"
      ]
    },
    rich: {
      name: "RICH / LUXURY PACKAGE",
      ratePerSqFt: richRate,
      totalCost: richCostEst,
      costPerSqFt: richRate,
      diffFromBudget: userBudget - richCostEst,
      materialsCost: Math.round(richCostEst * 0.67),
      labourCost: Math.round(richCostEst * 0.33),
      specs: [
        "AAC Thermal Insulation Lightweight Blocks",
        "Italian Marble / Large Slab Porcelain Flooring",
        "Sound-Proof Thermal UPVC System Windows",
        "Solid Burma Teak Entrance + Veneer Internal Doors",
        "Smart Home WiFi Automation Switch Nodes",
        "Asian Paints Royale Aspira / PU Sheen Finish",
        "Imported Quartz Counter Modular Island Kitchen",
        "Designer Walk-in Glass Profile Wardrobes",
        "Complete Home False Ceiling with Magnetic Track Lights"
      ]
    }
  };

  // Realistic cost-saving scenarios when budget exceeds limit
  const costSavingRecommendations = [
    {
      strategy: "Footprint Optimization",
      title: "Optimize Built-Up Footprint by 10-12%",
      potentialSaving: Math.round(totalBuiltUpAreaSqFt * 0.12 * costPerSqFt),
      description: "Trimming secondary circulation lobbies or oversized balconies reduces structural concrete, masonry, plaster, and floor tiles proportionally."
    },
    {
      strategy: "Finishes Value Engineering",
      title: "Value Engineering on Finishes & Joinery",
      potentialSaving: Math.round(totalBuiltUpAreaSqFt * 250),
      description: "Selecting standard vitrified tiles (2x2 ft) and aluminum powder-coated window frames instead of luxury large-format slabs provides major upfront savings."
    },
    {
      strategy: "Phased Interior Execution",
      title: "Phase Interior Millwork Post-Occupancy",
      potentialSaving: interiorCost,
      description: "Executing premium false ceilings, custom wardrobes, and designer wall cladding in Phase 2 defers upfront capital expenditure."
    }
  ];

  return {
    selectedPackage: pkg,
    totalBuiltUpAreaSqFt,
    groundFloorAreaSqFt: groundFloorArea,
    totalEstimatedCost,
    costPerSqFt,
    userBudget,
    budgetDifference,
    summary: {
      materialCost: subtotalMaterial,
      labourCost: subtotalLabour,
      contractorCost,
      interiorCost,
      otherExpenses: architectFee,
      contingency
    },
    boqLineItems,
    packages,
    costSavingRecommendations,
    disclaimer: "Preliminary architectural estimate based on geometric quantities and standard Schedules of Rates. Subject to final site soil investigation, engineering review, and localized contractor bidding."
  };
}

module.exports = { calculateProjectBOQ };
