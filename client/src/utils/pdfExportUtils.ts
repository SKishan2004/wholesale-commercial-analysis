import { ApprovedDecisionRecord } from '../components/ApprovalHistoryWorkspace';

/**
 * Generates and triggers PDF export/print for an approved commercial traffic allocation record.
 */
export function exportApprovedDecisionToPdf(decision: ApprovedDecisionRecord) {
  if (!decision) return;

  // Open a clean print window containing the formatted PDF report
  const printWindow = window.open('', '_blank', 'width=900,height=1000');
  if (!printWindow) {
    alert('Please allow pop-ups to export the PDF report.');
    return;
  }

  const approvalDate = new Date(decision.approvalTimestamp).toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'medium'
  });

  const formattedRevenue = decision.totals.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedCost = decision.totals.totalWholesaleCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedNetProfit = decision.totals.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const marginPct = decision.totals.profitMarginPct.toFixed(2);
  const totalIncMins = decision.totals.totalIncomingTraffic.toLocaleString('en-US');
  const totalOutMins = decision.totals.totalOutgoingTraffic.toLocaleString('en-US');

  const carrierRowsHtml = (decision.carrierAllocations || []).map((c, idx) => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #0f172a;">
        ${idx + 1}. ${c.carrierName}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #0d9488;">
        ${c.incomingSharePct}%
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #2563eb;">
        ${c.outgoingSharePct}%
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace;">
        ${c.calculatedIncomingTraffic.toLocaleString('en-US')}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace;">
        ${c.calculatedOutgoingTraffic.toLocaleString('en-US')}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #0f172a;">
        $${c.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #e11d48;">
        $${c.wholesaleCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: ${c.netProfit >= 0 ? '#059669' : '#e11d48'};">
        $${c.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </td>
    </tr>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Traffic Allocation PDF Report - ${decision.scenarioName}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 15mm;
        }
        body {
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          margin: 0;
          padding: 20px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .report-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        .company-title {
          font-size: 20px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.5px;
          text-transform: uppercase;
        }
        .report-subtitle {
          font-size: 12px;
          color: #64748b;
          margin-top: 4px;
        }
        .status-badge {
          background: #dcfce7;
          color: #166534;
          border: 1px solid #86efac;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px 18px;
          margin-bottom: 24px;
        }
        .meta-item {
          display: flex;
          flex-direction: column;
        }
        .meta-label {
          font-size: 10px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }
        .meta-value {
          font-size: 13px;
          font-weight: 800;
          color: #0f172a;
        }
        .section-title {
          font-size: 14px;
          font-weight: 800;
          color: #0f172a;
          margin-top: 20px;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-left: 4px solid #2563eb;
          padding-left: 8px;
        }
        .kpi-container {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 12px;
          margin-bottom: 24px;
        }
        .kpi-box {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px 18px;
          background: #ffffff;
        }
        .kpi-box.highlight {
          background: #f0fdf4;
          border-color: #bbf7d0;
        }
        .kpi-label {
          font-size: 10px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .kpi-val {
          font-size: 24px;
          font-weight: 900;
          color: #0f172a;
        }
        .kpi-val.green {
          color: #059669;
        }
        .kpi-val.blue {
          color: #2563eb;
        }
        .kpi-val.rose {
          color: #e11d48;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          margin-bottom: 24px;
        }
        th {
          background: #0f172a;
          color: #ffffff;
          padding: 10px 12px;
          text-align: left;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .signatures {
          margin-top: 40px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          page-break-inside: avoid;
        }
        .signature-line {
          border-top: 1px dashed #94a3b8;
          padding-top: 8px;
          font-size: 11px;
          color: #475569;
          font-weight: 600;
        }
        .footer {
          margin-top: 30px;
          padding-top: 12px;
          border-top: 1px solid #e2e8f0;
          font-size: 10px;
          color: #94a3b8;
          text-align: center;
        }
        @media print {
          .no-print {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 20px; text-align: right;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: #fff; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
          🖨️ Print / Save as PDF
        </button>
      </div>

      <div class="report-header">
        <div>
          <div class="company-title">Wholesale Commercial Analysis</div>
          <div class="report-subtitle">Official Commercial Traffic Allocation & Profitability Report</div>
        </div>
        <div class="status-badge">
          ✓ Formally Approved
        </div>
      </div>

      <div class="meta-grid">
        <div class="meta-item">
          <span class="meta-label">Scenario Name</span>
          <span class="meta-value">${decision.scenarioName}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Approval Date & Time</span>
          <span class="meta-value">${approvalDate}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Decision Status</span>
          <span class="meta-value" style="color: #059669;">Approved</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Total Allocated Carriers</span>
          <span class="meta-value">${decision.carrierAllocations?.length || 0} Carriers</span>
        </div>
      </div>

      <div class="section-title">Executive Financial Summary</div>
      <div class="kpi-container">
        <div class="kpi-box highlight">
          <div class="kpi-label">Net Commercial Profit</div>
          <div class="kpi-val green">$${formattedNetProfit}</div>
          <div style="font-size: 11px; font-weight: bold; color: #059669; margin-top: 4px;">
            Margin: ${marginPct}%
          </div>
        </div>
        <div class="kpi-box">
          <div class="kpi-label">Total Revenue</div>
          <div class="kpi-val blue">$${formattedRevenue}</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-label">Total Wholesale Cost</div>
          <div class="kpi-val rose">$${formattedCost}</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
        <div class="kpi-box">
          <div class="kpi-label">Total Outgoing Traffic</div>
          <div style="font-size: 18px; font-weight: 800; color: #2563eb;">${totalOutMins} mins</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-label">Total Incoming Traffic</div>
          <div style="font-size: 18px; font-weight: 800; color: #0d9488;">${totalIncMins} mins</div>
        </div>
      </div>

      <div class="section-title">Approved Carrier Traffic Distribution & Rates</div>
      <table>
        <thead>
          <tr>
            <th>Carrier Name</th>
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
          ${carrierRowsHtml}
        </tbody>
      </table>

      <div class="signatures">
        <div class="signature-line">
          Prepared By: Commercial Analyst
          <br /><br />
          Date: ________________________
        </div>
        <div class="signature-line">
          Approved By: Wholesale Business Director
          <br /><br />
          Date: ________________________
        </div>
      </div>

      <div class="footer">
        Confidential - Mobileum Wholesale Commercial Analysis System | Report Generated: ${new Date().toLocaleString()}
      </div>

      <script>
        // Auto trigger print preview when loaded
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
