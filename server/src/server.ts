import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { calculateCommercialPerformance, calculateMultiCarrierSimulation } from './calculation/calculationEngine';
import {
  getAllSimulations,
  getSimulationById,
  createSimulation,
  updateSimulation,
  duplicateSimulation,
  deleteSimulation
} from './services/simulationRepository';
import {
  getFinalScenario,
  updateFinalScenario,
  copySimulationToFinalScenario
} from './services/finalScenarioRepository';
import {
  getAllApprovedDecisions,
  getApprovedDecisionById,
  approveFinalScenario
} from './services/approvalRepository';
import { getAiSimulationRecommendation } from './services/aiRecommendationService';
import {
  processAndValidateExcel,
  generateValidationReportExcel
} from './services/excelImportService';
import { generateExportExcel, generateExportCsv } from './services/exportService';
import {
  commitImportToDatabase,
  seedDatabaseIfEmpty,
  getDbDashboardSummary,
  getDbDashboardTraffic,
  getDbDashboardRevenueCost,
  getDbDashboardProfitability,
  getDbPaginatedRecords,
  getDbFilterOptions,
  getDbExportRecords,
  getDbImportHistory,
  STORAGE_UPLOADS_DIR
} from './services/dbRepository';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Configure Multer File Upload Storage (temp directory)
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({ dest: uploadDir });

// Session state for pending validation preview (prior to user commit)
let pendingValidatedRecords: any[] = [];
let pendingUploadMeta: {
  tempFilePath: string;
  originalFilename: string;
  fileSize: number;
} | null = null;

let currentErrorReport: any[] = [];

// -----------------------------------------------------------------
// EXPORT ANALYTICS API ENDPOINT
// -----------------------------------------------------------------

app.get('/api/export', async (req, res) => {
  const format = String(req.query.format || 'xlsx').toLowerCase();

  try {
    const records = await getDbExportRecords(req.query);

    if (format === 'csv') {
      const csvData = generateExportCsv(records);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="Commercial_Analysis_Export.csv"');
      return res.send(csvData);
    } else {
      const excelBuffer = await generateExportExcel(records);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="Commercial_Analysis_Export.xlsx"');
      return res.send(excelBuffer);
    }
  } catch (err) {
    console.error('Export failed:', err);
    res.status(500).json({ error: 'Failed to generate export file' });
  }
});

// -----------------------------------------------------------------
// EXCEL IMPORT API ENDPOINTS
// -----------------------------------------------------------------

// 1. Upload & Validate Excel Workbook Endpoint (Retains original file in storage)
app.post('/api/import/excel', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No Excel file provided' });
  }

  try {
    const filePath = req.file.path;
    const originalName = req.file.originalname;

    console.log(`📥 Processing Excel upload: ${originalName} (${req.file.size} bytes)...`);

    const result = await processAndValidateExcel(filePath);

    // Retain upload state for atomic database transaction commit
    pendingValidatedRecords = result.validRecords;
    pendingUploadMeta = {
      tempFilePath: filePath,
      originalFilename: originalName,
      fileSize: req.file.size
    };
    currentErrorReport = result.report.errors;

    res.json({
      fileName: originalName,
      fileSize: req.file.size,
      sheetNames: result.sheetNames,
      totalRows: result.totalRows,
      validRows: result.report.validRows,
      invalidRows: result.report.invalidRows,
      warningCount: result.report.warningCount,
      duplicateCount: result.report.duplicateCount,
      errors: result.report.errors,
      canCommit: result.validRecords.length > 0
    });
  } catch (err: any) {
    console.error('❌ Excel upload processing failed:', err);
    res.status(422).json({
      error: err.message || 'Failed to parse Excel workbook'
    });
  }
});

// 2. Commit Validated Import to PostgreSQL Database (Atomic Transaction)
app.post('/api/import/commit', async (req, res) => {
  const { fileName, replaceExisting = false } = req.body;

  if (pendingValidatedRecords.length === 0 || !pendingUploadMeta) {
    return res.status(400).json({ error: 'No validated records available to commit' });
  }

  try {
    console.log(`💾 Executing database atomic transaction for commit...`);

    const importJob = await commitImportToDatabase({
      originalFilename: pendingUploadMeta.originalFilename || String(fileName || 'Uploaded_Dataset.xlsx'),
      tempFilePath: pendingUploadMeta.tempFilePath,
      fileSize: pendingUploadMeta.fileSize,
      totalRows: pendingValidatedRecords.length + currentErrorReport.filter(e => e.severity === 'ERROR').length,
      validRows: pendingValidatedRecords.length,
      rejectedRows: currentErrorReport.filter(e => e.severity === 'ERROR').length,
      warningCount: currentErrorReport.filter(e => e.severity === 'WARNING').length,
      replaceExisting,
      validRecords: pendingValidatedRecords
    });

    // Clean up temp upload file after copying to permanent storage
    fs.unlink(pendingUploadMeta.tempFilePath, () => {});

    pendingValidatedRecords = [];
    pendingUploadMeta = null;

    console.log(`✅ Successfully committed import job ${importJob.id} to PostgreSQL.`);

    res.json({
      success: true,
      message: `Successfully imported ${importJob.validRows} records into PostgreSQL database.`,
      importJob
    });
  } catch (err: any) {
    console.error('❌ Database transaction commit failed (rolled back):', err);
    res.status(500).json({ error: 'Database transaction failed and was rolled back cleanly.' });
  }
});

// 3. Download Validation Error Report Endpoint
app.get('/api/import/download-report', async (req, res) => {
  try {
    const buffer = await generateValidationReportExcel(currentErrorReport);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Validation_Error_Report.xlsx"');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate error report' });
  }
});

// 4. Fetch Import History Log from Database
app.get('/api/import/history', async (req, res) => {
  try {
    const history = await getDbImportHistory();
    res.json({ history });
  } catch (err) {
    console.error('Failed to fetch import history:', err);
    res.status(500).json({ history: [] });
  }
});

// -----------------------------------------------------------------
// PERSISTENT DASHBOARD ANALYTICS API ENDPOINTS
// -----------------------------------------------------------------

app.get('/api/filter-options', async (req, res) => {
  try {
    const options = await getDbFilterOptions();
    res.json(options);
  } catch (err) {
    res.status(500).json({ operators: [], carriers: [], customers: [], countries: [], routes: [] });
  }
});

app.get('/api/dashboard/summary', async (req, res) => {
  try {
    const summary = await getDbDashboardSummary(req.query);
    res.json(summary);
  } catch (err) {
    console.error('Failed to query dashboard summary:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

app.get('/api/dashboard/traffic', async (req, res) => {
  try {
    const traffic = await getDbDashboardTraffic(req.query);
    res.json(traffic);
  } catch (err) {
    res.status(500).json({ trafficTrend: [], byOperator: [], operatorShare: [] });
  }
});

app.get('/api/dashboard/revenue-cost', async (req, res) => {
  try {
    const revCost = await getDbDashboardRevenueCost(req.query);
    res.json(revCost);
  } catch (err) {
    res.status(500).json({ revenueVsCostTrend: [], revContributionByOperator: [], costContributionByOperator: [], costCategoryBreakdown: [] });
  }
});

app.get('/api/dashboard/profitability', async (req, res) => {
  try {
    const prof = await getDbDashboardProfitability(req.query);
    res.json(prof);
  } catch (err) {
    res.status(500).json({ profitByOperator: [], profitByRoute: [] });
  }
});

app.get('/api/records', async (req, res) => {
  try {
    const paginated = await getDbPaginatedRecords(req.query);
    res.json(paginated);
  } catch (err) {
    console.error('Failed to fetch paginated records:', err);
    res.status(500).json({ total: 0, page: 1, limit: 10, totalPages: 1, records: [] });
  }
});

app.post('/api/simulation', (req, res) => {
  const {
    outgoingMinutes,
    incomingMinutes,
    outgoingShare,
    incomingShare,
    incomingRevenueRate,
    outgoingCostRate,
    outgoingRevenueRate,
    interconnectCostRate,
    cableCapacityCost
  } = req.body;

  const result = calculateCommercialPerformance({
    outgoingMinutes: Number(outgoingMinutes || 0),
    incomingMinutes: Number(incomingMinutes || 0),
    outgoingShare: Number(outgoingShare || 0),
    incomingShare: Number(incomingShare || 0),
    incomingRevenueRate: Number(incomingRevenueRate || 0),
    outgoingCostRate: Number(outgoingCostRate || 0),
    outgoingRevenueRate: Number(outgoingRevenueRate || 0),
    interconnectCostRate: Number(interconnectCostRate || 0),
    cableCapacityCost: Number(cableCapacityCost || 0)
  });

  res.json(result);
});

// -----------------------------------------------------------------
// DYNAMIC MULTI-CARRIER COMMERCIAL SIMULATION API ENDPOINTS
// -----------------------------------------------------------------

app.get('/api/simulations', async (req, res) => {
  try {
    const simulations = await getAllSimulations();
    res.json({ simulations });
  } catch (err: any) {
    console.error('Failed to fetch simulations:', err);
    res.status(500).json({ error: 'Failed to fetch commercial simulations' });
  }
});

app.get('/api/simulations/:id', async (req, res) => {
  try {
    const simulation = await getSimulationById(req.params.id);
    if (!simulation) {
      return res.status(404).json({ error: 'Simulation not found' });
    }
    res.json({ simulation });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch simulation' });
  }
});

app.post('/api/simulations', async (req, res) => {
  try {
    const simulation = await createSimulation(req.body);
    res.status(201).json({ simulation });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create simulation' });
  }
});

app.put('/api/simulations/:id', async (req, res) => {
  try {
    const simulation = await updateSimulation(req.params.id, req.body);
    res.json({ simulation });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update simulation' });
  }
});

app.post('/api/simulations/:id/duplicate', async (req, res) => {
  try {
    const simulation = await duplicateSimulation(req.params.id);
    res.status(201).json({ simulation });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to duplicate simulation' });
  }
});

app.delete('/api/simulations/:id', async (req, res) => {
  try {
    await deleteSimulation(req.params.id);
    res.json({ success: true, message: 'Simulation deleted' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to delete simulation' });
  }
});

app.post('/api/simulation/multi-carrier', (req, res) => {
  try {
    const output = calculateMultiCarrierSimulation(req.body);
    res.json(output);
  } catch (err: any) {
    res.status(400).json({ error: 'Invalid calculation input' });
  }
});

app.post('/api/simulations/recommendation', async (req, res) => {
  try {
    let sims = req.body?.simulations;
    if (!Array.isArray(sims) || sims.length === 0) {
      sims = await getAllSimulations();
    }
    const recommendation = await getAiSimulationRecommendation(sims);
    res.json(recommendation);
  } catch (err: any) {
    console.error('AI recommendation endpoint error:', err);
    res.json({ available: false, message: 'AI recommendation unavailable' });
  }
});

// -----------------------------------------------------------------
// PHASE 2: FINAL COMMERCIAL SCENARIO & VARIANCE API ENDPOINTS
// -----------------------------------------------------------------

app.get('/api/final-scenario', async (req, res) => {
  try {
    const finalScenario = await getFinalScenario();
    res.json({ finalScenario });
  } catch (err: any) {
    console.error('Failed to fetch final scenario:', err);
    res.status(500).json({ error: 'Failed to fetch final scenario' });
  }
});

app.put('/api/final-scenario', async (req, res) => {
  try {
    const finalScenario = await updateFinalScenario(req.body);
    res.json({ finalScenario });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update final scenario' });
  }
});

app.post('/api/final-scenario/copy-from-simulation/:id', async (req, res) => {
  try {
    const finalScenario = await copySimulationToFinalScenario(req.params.id);
    res.json({ finalScenario });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to copy simulation to final scenario' });
  }
});

// -----------------------------------------------------------------
// PHASE 3: FINAL DECISION & APPROVAL WORKFLOW API ENDPOINTS
// -----------------------------------------------------------------

app.get('/api/approval/history', async (req, res) => {
  try {
    const history = await getAllApprovedDecisions();
    res.json({ history });
  } catch (err: any) {
    console.error('Failed to fetch approval history:', err);
    res.status(500).json({ error: 'Failed to fetch approval history' });
  }
});

app.get('/api/approval/history/:id', async (req, res) => {
  try {
    const decision = await getApprovedDecisionById(req.params.id);
    if (!decision) {
      return res.status(404).json({ error: 'Approved decision not found' });
    }
    res.json({ decision });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch approved decision details' });
  }
});

app.post('/api/approval/approve', async (req, res) => {
  try {
    const decision = await approveFinalScenario(req.body);
    res.status(201).json({ decision });
  } catch (err: any) {
    console.error('Failed to approve scenario:', err);
    res.status(400).json({ error: err.message || 'Failed to approve traffic allocation' });
  }
});

app.get('/api/approval/export-pdf/:id', async (req, res) => {
  try {
    const decision = await getApprovedDecisionById(req.params.id);
    if (!decision) {
      return res.status(404).send('Approved decision not found');
    }

    const approvalDate = new Date(decision.approvalTimestamp).toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'medium'
    });

    const carrierRows = (decision.carrierAllocations || []).map((c, idx) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${idx + 1}. ${c.carrierName}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #0d9488; font-weight: bold;">${c.incomingSharePct}%</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #2563eb; font-weight: bold;">${c.outgoingSharePct}%</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace;">${c.calculatedIncomingTraffic.toLocaleString('en-US')}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace;">${c.calculatedOutgoingTraffic.toLocaleString('en-US')}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">$${c.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #e11d48;">$${c.wholesaleCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: ${c.netProfit >= 0 ? '#059669' : '#e11d48'};">$${c.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Traffic Allocation PDF Report - ${decision.scenarioName}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: system-ui, sans-serif; color: #0f172a; padding: 20px; }
          .header { display: flex; justify-content: space-between; border-bottom: 3px solid #2563eb; padding-bottom: 14px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: 900; text-transform: uppercase; }
          .badge { background: #dcfce7; color: #166534; padding: 6px 12px; border-radius: 20px; font-weight: bold; font-size: 12px; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 12px; }
          .kpi-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px; margin-bottom: 20px; }
          .kpi { border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; }
          .kpi.green { background: #f0fdf4; border-color: #bbf7d0; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 30px; }
          th { background: #0f172a; color: #fff; padding: 10px; text-align: left; font-size: 10px; text-transform: uppercase; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 15px; text-align: right;">
          <button onclick="window.print()" style="padding: 8px 16px; background: #2563eb; color: #fff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">Print / Save as PDF</button>
        </div>
        <div class="header">
          <div>
            <div class="title">Wholesale Commercial Analysis</div>
            <div style="font-size: 12px; color: #64748b;">Official Approved Commercial Traffic Allocation Report</div>
          </div>
          <div class="badge">✓ Formally Approved</div>
        </div>
        <div class="grid">
          <div><strong>Scenario:</strong><br/>${decision.scenarioName}</div>
          <div><strong>Approved Date:</strong><br/>${approvalDate}</div>
          <div><strong>Status:</strong><br/><span style="color: #059669;">Approved</span></div>
          <div><strong>Carriers:</strong><br/>${decision.carrierAllocations?.length || 0} Carriers</div>
        </div>
        <div class="kpi-grid">
          <div class="kpi green">
            <div style="font-size: 10px; font-weight: bold; color: #64748b;">NET COMMERCIAL PROFIT</div>
            <div style="font-size: 22px; font-weight: 900; color: #059669;">$${decision.totals.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <div style="font-size: 11px; font-weight: bold; color: #059669;">Margin: ${decision.totals.profitMarginPct.toFixed(2)}%</div>
          </div>
          <div class="kpi">
            <div style="font-size: 10px; font-weight: bold; color: #64748b;">TOTAL REVENUE</div>
            <div style="font-size: 18px; font-weight: 900; color: #2563eb;">$${decision.totals.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="kpi">
            <div style="font-size: 10px; font-weight: bold; color: #64748b;">WHOLESALE COST</div>
            <div style="font-size: 18px; font-weight: 900; color: #e11d48;">$${decision.totals.totalWholesaleCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>
        <div style="font-size: 13px; font-weight: bold; margin-bottom: 10px; text-transform: uppercase;">Approved Carrier Distribution</div>
        <table>
          <thead>
            <tr>
              <th>Carrier</th>
              <th style="text-align: center;">Inc Share</th>
              <th style="text-align: center;">Out Share</th>
              <th style="text-align: right;">Inc Traffic (mins)</th>
              <th style="text-align: right;">Out Traffic (mins)</th>
              <th style="text-align: right;">Total Revenue</th>
              <th style="text-align: right;">Wholesale Cost</th>
              <th style="text-align: right;">Net Profit</th>
            </tr>
          </thead>
          <tbody>
            ${carrierRows}
          </tbody>
        </table>
        <div style="margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; font-size: 11px;">
          <div style="border-top: 1px dashed #94a3b8; padding-top: 8px;">Prepared By: Commercial Analyst</div>
          <div style="border-top: 1px dashed #94a3b8; padding-top: 8px;">Approved By: Wholesale Business Director</div>
        </div>
        <script>window.onload = function() { setTimeout(function() { window.print(); }, 300); };</script>
      </body>
      </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err: any) {
    res.status(500).send('Failed to generate PDF report');
  }
});

// Start Server & Initialize Database Persistence
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  try {
    await seedDatabaseIfEmpty();
  } catch (err) {
    console.error('⚠️ Database initialization error:', err);
  }
});
