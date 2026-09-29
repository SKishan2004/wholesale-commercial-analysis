import { processAndValidateExcel, WorkbookInspectionResult } from './excelImportService';
import { ValidationReport } from './dataValidation';

export interface ProcessedExcelResult {
  report: ValidationReport;
  records: any[];
}

export async function parseAndValidateExcel(filePath: string): Promise<ProcessedExcelResult> {
  const result: WorkbookInspectionResult = await processAndValidateExcel(filePath);
  return {
    report: result.report,
    records: result.validRecords
  };
}
