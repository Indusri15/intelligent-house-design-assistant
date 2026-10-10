const ExcelJS = require('exceljs');

/**
 * Generates comprehensive multi-sheet Excel Workbook
 */
async function generateProjectExcel(data, res) {
  const { project, vastu, boq, stages, expenses } = data;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Intelligent House Design Assistant';
  workbook.created = new Date();

  // Helper styling
  const headerStyle = {
    font: { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } },
    alignment: { vertical: 'middle', horizontal: 'center' }
  };

  // Sheet 1: Project Summary
  const summarySheet = workbook.addWorksheet('Project Summary');
  summarySheet.columns = [
    { header: 'Property / Attribute', key: 'attr', width: 32 },
    { header: 'Value', key: 'val', width: 45 }
  ];
  summarySheet.getRow(1).eachCell(cell => Object.assign(cell, headerStyle));

  summarySheet.addRows([
    { attr: 'Project Name', val: project.name },
    { attr: 'Location & PIN', val: `${project.location} (${project.pincode})` },
    { attr: 'Plot Dimensions', val: `${project.plot?.width}' Width x ${project.plot?.length}' Length (${project.plot?.area} sq.ft)` },
    { attr: 'Plot Facing Direction', val: project.plot?.facingDirection || 'East' },
    { attr: 'Number of Floors', val: project.accommodation?.floors || 1 },
    { attr: 'Total Built-up Area', val: `${boq.totalBuiltUpAreaSqFt} sq.ft` },
    { attr: 'User Target Budget', val: `₹ ${Number(project.budget).toLocaleString('en-IN')}` },
    { attr: 'Selected Finishing Package', val: boq.selectedPackage },
    { attr: 'Total Estimated Construction Cost', val: `₹ ${Number(boq.totalEstimatedCost).toLocaleString('en-IN')}` },
    { attr: 'Cost per Square Foot', val: `₹ ${boq.costPerSqFt} / sq.ft` },
    { attr: 'Budget Variance', val: `₹ ${Number(boq.budgetDifference).toLocaleString('en-IN')} (${boq.budgetDifference >= 0 ? 'Projected Savings' : 'Shortfall'})` },
    { attr: 'Vastu Compliance Score', val: `${vastu.overallScore}/100 (${vastu.grade})` },
    { attr: 'Report Generated Date', val: new Date().toISOString().split('T')[0] }
  ]);

  // Sheet 2: Detailed BOQ
  const boqSheet = workbook.addWorksheet('Detailed BOQ');
  boqSheet.columns = [
    { header: 'Code', key: 'code', width: 12 },
    { header: 'Category', key: 'category', width: 25 },
    { header: 'Item Description', key: 'name', width: 35 },
    { header: 'Unit', key: 'unit', width: 10 },
    { header: 'Quantity', key: 'qty', width: 12 },
    { header: 'Wastage %', key: 'wastage', width: 12 },
    { header: 'Material Rate (₹)', key: 'matRate', width: 18 },
    { header: 'Material Cost (₹)', key: 'matCost', width: 18 },
    { header: 'Labour Rate (₹)', key: 'labRate', width: 16 },
    { header: 'Labour Cost (₹)', key: 'labCost', width: 18 },
    { header: 'Total Cost (₹)', key: 'total', width: 20 }
  ];
  boqSheet.getRow(1).eachCell(cell => Object.assign(cell, headerStyle));

  (boq.boqLineItems || []).forEach(item => {
    boqSheet.addRow({
      code: item.code,
      category: item.category,
      name: item.itemName,
      unit: item.unit,
      qty: item.quantity,
      wastage: `${item.wastagePercentage}%`,
      matRate: item.materialRate || 0,
      matCost: item.materialCost || 0,
      labRate: item.labourRate || 0,
      labCost: item.labourCost || 0,
      total: item.totalCost || 0
    });
  });

  // Sheet 3: Package Comparison
  const pkgSheet = workbook.addWorksheet('Package Comparison');
  pkgSheet.columns = [
    { header: 'Specification Metric', key: 'metric', width: 30 },
    { header: 'BASIC Package', key: 'basic', width: 28 },
    { header: 'MEDIUM Package', key: 'medium', width: 28 },
    { header: 'RICH Package', key: 'rich', width: 28 }
  ];
  pkgSheet.getRow(1).eachCell(cell => Object.assign(cell, headerStyle));

  pkgSheet.addRows([
    { metric: 'Cost per Square Foot', basic: `₹ ${boq.packages?.basic?.costPerSqFt}`, medium: `₹ ${boq.packages?.medium?.costPerSqFt}`, rich: `₹ ${boq.packages?.rich?.costPerSqFt}` },
    { metric: 'Total Estimated Cost', basic: `₹ ${boq.packages?.basic?.totalCost?.toLocaleString('en-IN')}`, medium: `₹ ${boq.packages?.medium?.totalCost?.toLocaleString('en-IN')}`, rich: `₹ ${boq.packages?.rich?.totalCost?.toLocaleString('en-IN')}` },
    { metric: 'Budget Difference', basic: `₹ ${boq.packages?.basic?.diffFromBudget?.toLocaleString('en-IN')}`, medium: `₹ ${boq.packages?.medium?.diffFromBudget?.toLocaleString('en-IN')}`, rich: `₹ ${boq.packages?.rich?.diffFromBudget?.toLocaleString('en-IN')}` },
    { metric: 'Material Cost Split', basic: `₹ ${boq.packages?.basic?.materialsCost?.toLocaleString('en-IN')}`, medium: `₹ ${boq.packages?.medium?.materialsCost?.toLocaleString('en-IN')}`, rich: `₹ ${boq.packages?.rich?.materialsCost?.toLocaleString('en-IN')}` },
    { metric: 'Labour Cost Split', basic: `₹ ${boq.packages?.basic?.labourCost?.toLocaleString('en-IN')}`, medium: `₹ ${boq.packages?.medium?.labourCost?.toLocaleString('en-IN')}`, rich: `₹ ${boq.packages?.rich?.labourCost?.toLocaleString('en-IN')}` },
    { metric: 'Flooring Finish', basic: 'Vitrified Standard 2x2', medium: 'Glazed 4x2 GVT', rich: 'Italian Marble / Large Slab' },
    { metric: 'Windows Profile', basic: 'Aluminum 2-Track', medium: 'UPVC 3-Track + Mesh', rich: 'Acoustic Sound-Proof UPVC' },
    { metric: 'Kitchen Finish', basic: 'Laminated Semi-Modular', medium: 'Acrylic Modular Soft-Close', rich: 'PU Lacquered Quartz Island' },
    { metric: 'False Ceiling', basic: 'Excluded', medium: 'Living & Dining Included', rich: 'Full Home Magnetic Track Cove' }
  ]);

  // Sheet 4: Construction Stages
  const stageSheet = workbook.addWorksheet('Construction Timeline');
  stageSheet.columns = [
    { header: 'Order', key: 'order', width: 8 },
    { header: 'Stage Code', key: 'code', width: 12 },
    { header: 'Milestone Name', key: 'name', width: 38 },
    { header: 'Category', key: 'cat', width: 18 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Progress %', key: 'progress', width: 12 },
    { header: 'Estimated Cost (₹)', key: 'estCost', width: 20 },
    { header: 'Actual Cost (₹)', key: 'actCost', width: 20 },
    { header: 'Dependencies', key: 'deps', width: 20 }
  ];
  stageSheet.getRow(1).eachCell(cell => Object.assign(cell, headerStyle));

  (stages || []).forEach(stg => {
    stageSheet.addRow({
      order: stg.stageOrder,
      code: stg.code,
      name: stg.name,
      cat: stg.category,
      status: stg.status,
      progress: `${stg.progressPercentage || 0}%`,
      estCost: stg.estimatedCost || 0,
      actCost: stg.actualCost || 0,
      deps: (stg.dependencies || []).join(', ')
    });
  });

  // Sheet 5: Expenses
  const expSheet = workbook.addWorksheet('Expenses Ledger');
  expSheet.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Supplier / Payee', key: 'payee', width: 25 },
    { header: 'Category', key: 'cat', width: 16 },
    { header: 'Description', key: 'desc', width: 32 },
    { header: 'Quantity & Unit', key: 'qty', width: 18 },
    { header: 'Rate (₹)', key: 'rate', width: 14 },
    { header: 'Total (₹)', key: 'total', width: 18 },
    { header: 'Payment Status', key: 'status', width: 15 }
  ];
  expSheet.getRow(1).eachCell(cell => Object.assign(cell, headerStyle));

  (expenses || []).forEach(exp => {
    expSheet.addRow({
      date: exp.date,
      payee: exp.supplierOrPayee,
      cat: exp.category,
      desc: exp.materialOrService,
      qty: `${exp.quantity} ${exp.unit}`,
      rate: exp.rate,
      total: exp.totalAmount,
      status: exp.paymentStatus
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${project.name.replace(/\s+/g, '_')}_Construction_Report.xlsx"`);

  await workbook.xlsx.write(res);
  res.end();
}

module.exports = { generateProjectExcel };
