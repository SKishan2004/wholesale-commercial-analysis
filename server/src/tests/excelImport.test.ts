import { describe, it, expect, beforeAll } from 'vitest';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { prisma } from '../db/prismaClient';
import { processAndValidateExcel } from '../services/excelImportService';
import { validateHeaderColumns, validateCommercialRow } from '../services/dataValidation';
import { commitImportToDatabase, seedDatabaseIfEmpty, STORAGE_UPLOADS_DIR } from '../services/dbRepository';
import { calculateCommercialPerformance } from '../calculation/calculationEngine';

describe('Persistent Database & Data Lifecycle Tests', () => {
  const testDir = path.join(__dirname, 'temp_test_files');

  beforeAll(async () => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  async function createTestWorkbook(filePath: string, columns: string[], rows: any[][], sheetName = 'Traffic_Commercial_Data') {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(sheetName);
    sheet.addRow(columns);
    rows.forEach(r => sheet.addRow(r));
    await workbook.xlsx.writeFile(filePath);
  }

  const validColumns = [
    'Date', 'Customer_ID', 'Customer_Name', 'Operator_Code', 'Operator_Name',
    'Carrier_Code', 'Carrier_Name', 'Source_Country', 'Destination_Country', 'Region',
    'Route_Code', 'Submarine_Cable', 'Traffic_Direction', 'Outgoing_Minutes', 'Incoming_Minutes',
    'Outgoing_Share', 'Incoming_Share', 'Incoming_Revenue_Rate', 'Outgoing_Cost_Rate',
    'Outgoing_Revenue_Per_Min', 'Currency'
  ];

  it('1. should insert imported records into database with importId foreign key', async () => {
    const file = path.join(testDir, 'db_persist_test.xlsx');
    const validRow = [
      '2026-09-01', 'CUST-DB1', 'Airtel DB', 'OP-DB1', 'Vodacom DB', 'CAR-DB1', 'Carrier DB',
      'India', 'UK', 'Europe', 'ROUTE-DB1', 'SEA-ME-WE 5', 'BOTH', 100000, 200000,
      0.60, 0.50, 0.50, 0.70, 1.00, 'INR'
    ];
    await createTestWorkbook(file, validColumns, [validRow]);

    const parsed = await processAndValidateExcel(file);
    const importJob = await commitImportToDatabase({
      originalFilename: 'db_persist_test.xlsx',
      tempFilePath: file,
      fileSize: 1000,
      totalRows: 1,
      validRows: 1,
      rejectedRows: 0,
      warningCount: 0,
      replaceExisting: false,
      validRecords: parsed.validRecords
    });

    expect(importJob.id).toBeDefined();
    expect(importJob.status).toBe('COMMITTED');

    // Query record from database via Prisma
    const dbRecord = await prisma.trafficCommercialRecord.findFirst({
      where: { importId: importJob.id },
      include: { importJob: true, customer: true }
    });

    expect(dbRecord).not.toBeNull();
    expect(dbRecord?.importId).toBe(importJob.id);
    expect(dbRecord?.importJob?.originalFilename).toBe('db_persist_test.xlsx');
    expect(dbRecord?.customer.code).toBe('CUST-DB1');
  });

  it('2. should verify original uploaded file is permanently retained in local storage directory', () => {
    const filesInStorage = fs.readdirSync(STORAGE_UPLOADS_DIR);
    expect(filesInStorage.length).toBeGreaterThan(0);
    expect(filesInStorage.some(f => f.endsWith('.xlsx'))).toBe(true);
  });

  it('3. should support replaceExisting = true by replacing active dataset atomically', async () => {
    const file = path.join(testDir, 'replace_test.xlsx');
    const row = [
      '2026-09-02', 'CUST-REPLACE', 'Replace Cust', 'OP-REP', 'Replace Op', 'CAR-REP', 'Replace Carr',
      'India', 'USA', 'North America', 'ROUTE-REP', 'AAE-1', 'BOTH', 50000, 50000,
      1.0, 1.0, 0.5, 0.5, 2.0, 'INR'
    ];
    await createTestWorkbook(file, validColumns, [row]);

    const parsed = await processAndValidateExcel(file);
    const importJob = await commitImportToDatabase({
      originalFilename: 'replace_test.xlsx',
      tempFilePath: file,
      fileSize: 1000,
      totalRows: 1,
      validRows: 1,
      rejectedRows: 0,
      warningCount: 0,
      replaceExisting: true, // Replace active dataset!
      validRecords: parsed.validRecords
    });

    const activeCount = await prisma.trafficCommercialRecord.count();
    expect(activeCount).toBe(1);

    const activeRecord = await prisma.trafficCommercialRecord.findFirst({
      include: { customer: true }
    });
    expect(activeRecord?.customer.code).toBe('CUST-REPLACE');
  });

  it('4. should rollback entire transaction if an error occurs during database commit', async () => {
    const initialCount = await prisma.trafficCommercialRecord.count();

    const invalidRecords = [
      {
        rawRow: {
          date: '2026-09-01',
          customer_id: null, // Invalid customer ID triggers throw in loop
          operator_code: 'O1',
          carrier_code: 'C1',
          dest_country: 'US',
          route_code: 'R1',
          outgoing_mins: 100,
          incoming_mins: 100,
          outgoing_share: 0.5,
          incoming_share: 0.5,
          inc_rev_rate: 0.5,
          out_cost_rate: 0.5,
          out_rev_rate: 1.0
        },
        calculations: calculateCommercialPerformance({
          outgoingMinutes: 100, incomingMinutes: 100, outgoingShare: 0.5, incomingShare: 0.5,
          incomingRevenueRate: 0.5, outgoingCostRate: 0.5, outgoingRevenueRate: 1.0
        })
      }
    ];

    try {
      await commitImportToDatabase({
        originalFilename: 'rollback_test.xlsx',
        tempFilePath: path.join(testDir, 'non_existent.xlsx'),
        fileSize: 100,
        totalRows: 1,
        validRows: 1,
        rejectedRows: 0,
        warningCount: 0,
        replaceExisting: false,
        validRecords: invalidRecords
      });
    } catch (err) {
      // Expected rollback error
    }

    const postRollbackCount = await prisma.trafficCommercialRecord.count();
    expect(postRollbackCount).toBe(initialCount); // Unchanged after rollback!
  });

  it('5. should verify manager baseline calculation formula integrity', () => {
    const input = {
      outgoingMinutes: 100000,
      incomingMinutes: 200000,
      outgoingShare: 0.60,
      incomingShare: 0.50,
      incomingRevenueRate: 0.50,
      outgoingCostRate: 0.70,
      outgoingRevenueRate: 1.0
    };

    const result = calculateCommercialPerformance(input);

    expect(result.calculatedOutgoingTraffic).toBe(60000);
    expect(result.calculatedIncomingTraffic).toBe(100000);
    expect(result.incomingRevenue).toBe(50000);
    expect(result.wholesaleCost).toBe(42000);
    expect(result.subscriberRevenue).toBe(60000);
    expect(result.totalRevenue).toBe(110000);
    expect(result.netProfit).toBe(68000);
    expect(result.profitMarginPct).toBe(61.82);
  });
});
