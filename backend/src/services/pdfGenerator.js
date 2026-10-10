const PDFDocument = require('pdfkit-table');

/**
 * Generates a comprehensive architectural and BOQ PDF Report
 */
async function generateProjectPdf(data, res) {
  const { project, floorPlan, vastu, boq, stages, expenses } = data;

  const doc = new PDFDocument({
    margin: 40,
    size: 'A4',
    bufferPages: true,
    info: {
      Title: `${project.name} - Architectural & Construction Report`,
      Author: 'Intelligent House Design Assistant',
      Subject: 'B.Tech IT Major Project AI/ML'
    }
  });

  doc.pipe(res);

  // 1. Header & Title Banner
  doc.rect(40, 40, 515, 65).fill('#0f172a');
  doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold')
     .text('INTELLIGENT HOUSE DESIGN & CONSTRUCTION ASSISTANT', 55, 52);
  doc.fontSize(9).font('Helvetica')
     .text('B.Tech IT Major Project | AI/ML-Powered Architectural Planning & Estimation Engine', 55, 75);

  doc.moveDown(3);

  // 2. Project Meta Table / Summary
  doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold')
     .text(`Project Overview: ${project.name}`, 40, 125);

  doc.moveDown(0.5);

  const overviewTable = {
    headers: ['Attribute', 'Project Value', 'Attribute', 'Project Value'],
    rows: [
      ['Location & PIN', `${project.location} (${project.pincode})`, 'Plot Dimensions', `${project.plot?.width} ft x ${project.plot?.length} ft (${project.plot?.area} sq.ft)`],
      ['Facing Direction', project.plot?.facingDirection || 'East', 'Number of Floors', `${project.accommodation?.floors || 1} Floor(s)`],
      ['Total Built-Up Area', `${boq.totalBuiltUpAreaSqFt || 1500} sq.ft`, 'User Budget', `₹ ${Number(project.budget || 0).toLocaleString('en-IN')}`],
      ['Architectural Style', project.preferences?.style || 'Contemporary', 'Selected Package', `${boq.selectedPackage || 'MEDIUM'} Tier`],
      ['Total Estimated Cost', `₹ ${Number(boq.totalEstimatedCost || 0).toLocaleString('en-IN')}`, 'Cost per Sq.Ft', `₹ ${boq.costPerSqFt || 0} / sq.ft`],
      ['Budget Variance', `₹ ${Number(boq.budgetDifference || 0).toLocaleString('en-IN')} (${(boq.budgetDifference >= 0) ? 'Savings' : 'Shortfall'})`, 'Vastu Rating', `${vastu.grade} (${vastu.overallScore}/100)`]
    ]
  };

  await doc.table(overviewTable, {
    prepareHeader: () => doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff'),
    prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
      doc.font('Helvetica').fontSize(8).fillColor('#1e293b');
    }
  });

  doc.moveDown(1);

  // 3. Vastu Shastra Compliance Section
  doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('Vastu Shastra Compliance Evaluation', 40);
  doc.moveDown(0.3);

  const vastuRows = (vastu.evaluations || []).map(v => [
    v.roomName,
    v.allocatedZone,
    v.recommendedZones.join(', '),
    v.status,
    v.suggestedRemedy
  ]);

  if (vastuRows.length > 0) {
    await doc.table({
      headers: ['Room / Element', 'Zone', 'Optimal Zones', 'Status', 'Remedy / Guidance'],
      rows: vastuRows.slice(0, 7)
    }, {
      prepareHeader: () => doc.font('Helvetica-Bold').fontSize(8),
      prepareRow: () => doc.font('Helvetica').fontSize(7.5)
    });
  }

  doc.addPage();

  // 4. 3-Tier Package Comparison
  doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text('3-Tier Package Comparison Matrix', 40, 40);
  doc.moveDown(0.5);

  const pkgTable = {
    headers: ['Package Tier', 'Rate / Sq.Ft', 'Estimated Total', 'Difference from Budget', 'Key Specifications'],
    rows: [
      ['BASIC', `₹ ${boq.packages?.basic?.costPerSqFt} / sq.ft`, `₹ ${Number(boq.packages?.basic?.totalCost).toLocaleString('en-IN')}`, `₹ ${Number(boq.packages?.basic?.diffFromBudget).toLocaleString('en-IN')}`, 'Standard vitrified 2x2, clay bricks, flush doors, tractor emulsion'],
      ['MEDIUM (Selected)', `₹ ${boq.packages?.medium?.costPerSqFt} / sq.ft`, `₹ ${Number(boq.packages?.medium?.totalCost).toLocaleString('en-IN')}`, `₹ ${Number(boq.packages?.medium?.diffFromBudget).toLocaleString('en-IN')}`, 'Glazed 4x2 GVT tiles, UPVC windows, Teak entrance, false ceiling'],
      ['RICH / LUXURY', `₹ ${boq.packages?.rich?.costPerSqFt} / sq.ft`, `₹ ${Number(boq.packages?.rich?.totalCost).toLocaleString('en-IN')}`, `₹ ${Number(boq.packages?.rich?.diffFromBudget).toLocaleString('en-IN')}`, 'Italian marble, smart automation, AAC blocks, PU polish, walk-in wardrobes']
    ]
  };

  await doc.table(pkgTable, {
    prepareHeader: () => doc.font('Helvetica-Bold').fontSize(8),
    prepareRow: () => doc.font('Helvetica').fontSize(8)
  });

  doc.moveDown(1);

  // 5. Detailed Bill of Quantities (BOQ) Line Items
  doc.fillColor('#0f172a').fontSize(13).font('Helvetica-Bold').text('Detailed Bill of Quantities (BOQ)', 40);
  doc.moveDown(0.5);

  const boqRows = (boq.boqLineItems || []).map(item => [
    item.code,
    item.itemName,
    `${item.quantity} ${item.unit}`,
    `₹ ${item.materialCost ? item.materialCost.toLocaleString('en-IN') : '-'}`,
    `₹ ${item.labourCost ? item.labourCost.toLocaleString('en-IN') : '-'}`,
    `₹ ${Number(item.totalCost).toLocaleString('en-IN')}`
  ]);

  await doc.table({
    headers: ['Code', 'Item Description', 'Quantity', 'Material Cost', 'Labour Cost', 'Total (INR)'],
    rows: boqRows
  }, {
    prepareHeader: () => doc.font('Helvetica-Bold').fontSize(7.5),
    prepareRow: () => doc.font('Helvetica').fontSize(7)
  });

  doc.addPage();

  // 6. Construction Timeline & Stages
  doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text('Construction Timeline & Milestone Progress', 40, 40);
  doc.moveDown(0.5);

  const stageRows = (stages || []).map(s => [
    s.code,
    s.name,
    s.category,
    s.status,
    `${s.progressPercentage || 0}%`,
    `₹ ${Number(s.estimatedCost || 0).toLocaleString('en-IN')}`
  ]);

  await doc.table({
    headers: ['Stage', 'Milestone Name', 'Category', 'Status', 'Progress', 'Est. Cost'],
    rows: stageRows
  }, {
    prepareHeader: () => doc.font('Helvetica-Bold').fontSize(8),
    prepareRow: () => doc.font('Helvetica').fontSize(7.5)
  });

  doc.moveDown(1.5);

  // 7. Disclaimer & Academic Notice
  doc.rect(40, doc.y, 515, 60).fill('#f8fafc');
  doc.fillColor('#64748b').fontSize(8).font('Helvetica')
     .text('Engineering & Academic Project Disclaimer:', 50, doc.y + 10, { width: 495 })
     .text('This design portfolio, geometric layout, and Bill of Quantities were automatically generated by the Intelligent House Design Assistant (B.Tech IT Major Project). Quantities are derived from structural empirical heuristics and regional Schedules of Rates (Warangal/Telangana). Prior to physical construction, structural stability must be certified by a licensed structural engineer.', 50, doc.y + 22, { width: 495 });

  // Page numbering on all pages
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.fillColor('#94a3b8').fontSize(8)
       .text(`Page ${i + 1} of ${range.count} | Intelligent House Design Assistant`, 40, doc.page.height - 30, { align: 'center', width: 515 });
  }

  doc.end();
}

module.exports = { generateProjectPdf };
