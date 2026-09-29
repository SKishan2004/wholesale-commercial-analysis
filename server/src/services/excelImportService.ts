import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import {
  validateHeaderColumns,
  validateCommercialRow,
  ValidationReport,
  ValidationErrorItem
} from './dataValidation';
import { calculateCommercialPerformance } from '../calculation/calculationEngine';

export interface ImportHistoryItem {
  id: string;
  fileName: string;
  uploadedAt: string;
  totalRows: number;
  importedRows: number;
  rejectedRows: number;
  warningCount: number;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
}

// In-Memory Import History Log
export const importHistoryStore: ImportHistoryItem[] = [];

export interface WorkbookInspectionResult {
  sheetNames: string[];
  totalRows: number;
  columnNames: string[];
  report: ValidationReport;
  validRecords: any[];
}

/**
 * Inspects and validates an uploaded Excel workbook buffer or file path
 */
export async function processAndValidateExcel(filePath: string): Promise<WorkbookInspectionResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const sheetNames = workbook.worksheets.map(w => w.name);
  if (sheetNames.length === 0) {
    throw new Error('Workbook contains no worksheets.');
  }

  // Select primary worksheet
  const sheet = workbook.getWorksheet('Traffic_Commercial_Data') || workbook.worksheets[0];
  const rowCount = sheet.rowCount;

  if (rowCount <= 1) {
    throw new Error('Workbook sheet is empty or contains only header row.');
  }

  const columnNames: string[] = [];
  const headerMap: { [key: number]: string } = {};

  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    const rawVal = String(cell.value || '').trim();
    columnNames.push(rawVal);
    headerMap[colNumber] = rawVal.toLowerCase().replace(/ /g, '_');
  });

  // Header Validation Check
  const headerCheck = validateHeaderColumns(columnNames);
  const report: ValidationReport = {
    totalRows: 0,
    validRows: 0,
    invalidRows: 0,
    warningCount: 0,
    duplicateCount: 0,
    errors: []
  };

  if (!headerCheck.valid) {
    headerCheck.missingColumns.forEach(col => {
      report.errors.push({
        rowNumber: 1,
        column: col,
        value: null,
        message: `Missing required schema column: "${col}"`,
        severity: 'ERROR'
      });
    });
    return {
      sheetNames,
      totalRows: 0,
      columnNames,
      report,
      validRecords: []
    };
  }

  const seenKeys = new Set<string>();
  const validRecords: any[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header

    report.totalRows++;
    const rowObj: any = {};

    row.eachCell((cell, colNumber) => {
      const headerKey = headerMap[colNumber];
      if (headerKey) {
        let val = cell.value;
        if (cell.type === ExcelJS.ValueType.Date && val instanceof Date) {
          val = val.toISOString().split('T')[0];
        }
        rowObj[headerKey] = val;
      }
    });

    // Flexible column mapping
    const formattedRow = {
      date: rowObj['date'] || new Date().toISOString().split('T')[0],
      customer_id: rowObj['customer_id'],
      customer_name: rowObj['customer_name'],
      operator_code: rowObj['operator_code'],
      operator_name: rowObj['operator_name'],
      carrier_code: rowObj['carrier_code'],
      carrier_name: rowObj['carrier_name'],
      source_country: rowObj['source_country'],
      dest_country: rowObj['dest_country'] || rowObj['destination_country'],
      region: rowObj['region'],
      route_code: rowObj['route_code'],
      cable: rowObj['submarine_cable'] || rowObj['cable'],
      direction: rowObj['traffic_direction'] || rowObj['direction'],
      outgoing_mins: rowObj['outgoing_minutes'] || rowObj['outgoing_mins'],
      incoming_mins: rowObj['incoming_minutes'] || rowObj['incoming_mins'],
      outgoing_share: rowObj['outgoing_share'],
      incoming_share: rowObj['incoming_share'],
      inc_rev_rate: rowObj['incoming_revenue_rate'] || rowObj['inc_rev_rate'],
      out_cost_rate: rowObj['outgoing_cost_rate'] || rowObj['out_cost_rate'],
      out_rev_rate: rowObj['outgoing_revenue_per_min'] || rowObj['out_rev_rate'],
      interconnect_rate: rowObj['interconnect_rate'],
      cable_cost: rowObj['cable_capacity_cost'] || rowObj['cable_cost'],
      currency: rowObj['currency']
    };

    const result = validateCommercialRow(formattedRow, rowNumber, seenKeys);

    if (result.isDuplicate) {
      report.duplicateCount++;
    }

    if (result.errors.length > 0) {
      report.errors.push(...result.errors);
      const hasFatal = result.errors.some(e => e.severity === 'ERROR');
      if (hasFatal) {
        report.invalidRows++;
      } else {
        report.validRows++;
        report.warningCount += result.errors.filter(e => e.severity === 'WARNING').length;
      }
    } else {
      report.validRows++;
    }

    if (result.valid && result.sanitizedData) {
      const data = result.sanitizedData;
      const calcResult = calculateCommercialPerformance({
        outgoingMinutes: data.outgoing_mins,
        incomingMinutes: data.incoming_mins,
        outgoingShare: data.outgoing_share,
        incomingShare: data.incoming_share,
        incomingRevenueRate: data.inc_rev_rate,
        outgoingCostRate: data.out_cost_rate,
        outgoingRevenueRate: data.out_rev_rate,
        interconnectCostRate: data.interconnect_rate,
        cableCapacityCost: data.cable_cost,
        currency: data.currency
      });

      validRecords.push({
        rawRow: data,
        calculations: calcResult
      });
    }
  });

  return {
    sheetNames,
    totalRows: report.totalRows,
    columnNames,
    report,
    validRecords
  };
}

/**
 * Generates an Excel workbook containing detailed validation error & warning report
 */
export async function generateValidationReportExcel(errors: ValidationErrorItem[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Validation_Errors');

  sheet.columns = [
    { header: 'Row Number', key: 'rowNumber', width: 14 },
    { header: 'Severity', key: 'severity', width: 14 },
    { header: 'Column', key: 'column', width: 22 },
    { header: 'Value', key: 'value', width: 20 },
    { header: 'Error Description / Message', key: 'message', width: 50 }
  ];

  // Header Styling
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } };

  errors.forEach(err => {
    const row = sheet.addRow({
      rowNumber: err.rowNumber,
      severity: err.severity,
      column: err.column,
      value: String(err.value ?? ''),
      message: err.message
    });

    if (err.severity === 'ERROR') {
      row.getCell('severity').font = { color: { argb: 'DC2626' }, bold: true };
    } else {
      row.getCell('severity').font = { color: { argb: 'D97706' }, bold: true };
    }
  });

  return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
}
