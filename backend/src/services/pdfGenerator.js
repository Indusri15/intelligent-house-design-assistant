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
     .text('Architectural Planning, Structural BOQ & Construction Estimation Portfolio', 55, 75);

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
      ['Budget Variance', `₹ ${Number(boq.budgetDifference || 0).toLocaleString('en-IN')} (${(boq.budgetDifference >= 0) ? 'Within Budget' : 'Budget Shortfall'})`, 'Vastu Rating', `${vastu.grade} (${vastu.overallScore}/100)`]
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

  // 4. Financial Assessment & Cost Summary
  doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text('Financial Assessment & Cost Summary', 40, 40);
  doc.moveDown(0.5);

  const financialTable = {
    headers: ['Financial Metric', 'Amount (INR)', 'Allocation %', 'Engineering Notes'],
    rows: [
      ['Structural Materials', `₹ ${Number(boq.summary?.materialCost || 0).toLocaleString('en-IN')}`, `${Math.round(((boq.summary?.materialCost || 0) / (boq.totalEstimatedCost || 1)) * 100)}%`, 'Cement, TMT Steel, Sand, Coarse Aggregate, AAC/Brickwork'],
      ['Labour & Masonry', `₹ ${Number(boq.summary?.labourCost || 0).toLocaleString('en-IN')}`, `${Math.round(((boq.summary?.labourCost || 0) / (boq.totalEstimatedCost || 1)) * 100)}%`, 'Excavation, bar bending, RCC casting, brickwork & plastering'],
      ['Contractor Supervision (10%)', `₹ ${Number(boq.summary?.contractorCost || 0).toLocaleString('en-IN')}`, '10%', 'On-site engineering oversight and project coordination'],
      ['Interior & Finishing Carpentry', `₹ ${Number(boq.summary?.interiorCost || 0).toLocaleString('en-IN')}`, `${Math.round(((boq.summary?.interiorCost || 0) / (boq.totalEstimatedCost || 1)) * 100)}%`, 'Modular kitchen, bedroom wardrobes and false ceiling'],
      ['Architectural & Structural Fees', `₹ ${Number(boq.summary?.otherExpenses || 0).toLocaleString('en-IN')}`, '3%', 'Sanction drawings, structural detailing & MEP consultancy'],
      ['Contingency Reserve (5%)', `₹ ${Number(boq.summary?.contingency || 0).toLocaleString('en-IN')}`, '5%', 'Unforeseen ground conditions & minor market price variances'],
      ['TOTAL ESTIMATED COST', `₹ ${Number(boq.totalEstimatedCost || 0).toLocaleString('en-IN')}`, '100%', `₹ ${boq.costPerSqFt} / sq.ft across ${boq.totalBuiltUpAreaSqFt} sq.ft`]
    ]
  };

  await doc.table(financialTable, {
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

  // Only add a new page if space on current page is insufficient for the stages section
  if (doc.y > doc.page.height - 220) {
    doc.addPage();
  } else {
    doc.moveDown(1.5);
  }

  // 6. Construction Timeline & Stages
  doc.fillColor('#0f172a').fontSize(13).font('Helvetica-Bold').text('Construction Timeline & Milestone Progress', 40);
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

  doc.moveDown(1);

  // 7. Disclaimer & Academic Notice
  if (doc.y > doc.page.height - 90) {
    doc.addPage();
  }
  doc.rect(40, doc.y, 515, 60).fill('#f8fafc');
  doc.fillColor('#64748b').fontSize(8).font('Helvetica')
     .text('Engineering & Estimating Disclaimer:', 50, doc.y + 10, { width: 495 })
     .text('This design portfolio, geometric layout, and Bill of Quantities were automatically generated by the Intelligent House Design Assistant. Quantities are derived from structural empirical heuristics and regional Schedules of Rates (Warangal/Telangana). Prior to physical construction, structural stability must be certified by a licensed structural engineer.', 50, doc.y + 22, { width: 495 });

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
