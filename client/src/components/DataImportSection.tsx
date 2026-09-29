import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  Database,
  History,
  RefreshCw,
  ArrowRight
} from 'lucide-react';

interface ValidationErrorItem {
  rowNumber: number;
  column: string;
  value: any;
  message: string;
  severity: 'ERROR' | 'WARNING';
}

interface ValidationReportResult {
  fileName: string;
  fileSize: number;
  sheetNames: string[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  warningCount: number;
  duplicateCount: number;
  errors: ValidationErrorItem[];
  canCommit: boolean;
}

interface ImportHistoryItem {
  id: string;
  fileName: string;
  uploadedAt: string;
  totalRows: number;
  importedRows: number;
  rejectedRows: number;
  warningCount: number;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
}

interface DataImportSectionProps {
  onImportSuccess: () => void;
}

export const DataImportSection: React.FC<DataImportSectionProps> = ({ onImportSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationReportResult | null>(null);
  const [history, setHistory] = useState<ImportHistoryItem[]>([]);
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'ERROR' | 'WARNING'>('ALL');
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [commitMessage, setCommitMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch past import history
  const fetchImportHistory = async () => {
    try {
      const res = await fetch('/api/import/history');
      const data = await res.json();
      setHistory(data.history || []);
    } catch (err) {
      console.error('Failed to fetch import history:', err);
    }
  };

  useEffect(() => {
    fetchImportHistory();
  }, []);

  // Automatic upload & validate upon file selection
  const uploadAndValidateFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx')) {
      alert('Please select a valid Excel workbook file (.xlsx)');
      return;
    }

    setSelectedFile(file);
    setIsUploading(true);
    setValidationResult(null);
    setCommitMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/import/excel', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to process Excel file');
      }

      const data: ValidationReportResult = await res.json();
      setValidationResult(data);
    } catch (err: any) {
      alert(`Upload Error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCommitData = async () => {
    if (!validationResult || !validationResult.canCommit) return;

    setIsCommitting(true);
    try {
      const res = await fetch('/api/import/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: validationResult.fileName,
          replaceExisting
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCommitMessage(data.message);
      setSelectedFile(null);
      setValidationResult(null);
      fetchImportHistory();
      onImportSuccess();
    } catch (err: any) {
      alert(`Import Error: ${err.message}`);
    } finally {
      setIsCommitting(false);
    }
  };

  const handleDownloadReport = () => {
    window.open('/api/import/download-report', '_blank');
  };

  const filteredErrors = validationResult?.errors.filter(e => {
    if (severityFilter === 'ERROR') return e.severity === 'ERROR';
    if (severityFilter === 'WARNING') return e.severity === 'WARNING';
    return true;
  }) || [];

  return (
    <div className="space-y-6 mb-8">
      {/* 1. Upload File Zone */}
      <div className="card-panel rounded-xl p-6 border border-slate-200 shadow-sm bg-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Import Commercial Data</h3>
            <p className="text-xs text-slate-500">Upload Excel workbooks (.xlsx) to update commercial dataset</p>
          </div>
        </div>

        {commitMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {commitMessage}
            </div>
            <button
              onClick={onImportSuccess}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold flex items-center gap-1"
            >
              View Overview <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Dropzone Container */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              uploadAndValidateFile(e.dataTransfer.files[0]);
            }
          }}
          className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-8 text-center bg-slate-50 hover:bg-blue-50/40 transition-all cursor-pointer flex flex-col items-center justify-center group"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                uploadAndValidateFile(e.target.files[0]);
              }
            }}
          />

          <div className="p-3 bg-white rounded-full text-blue-600 shadow-sm mb-3 group-hover:scale-110 transition-all border border-slate-200">
            {isUploading ? (
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            ) : (
              <UploadCloud className="w-8 h-8" />
            )}
          </div>

          <h4 className="text-sm font-bold text-slate-800 mb-1">
            {isUploading
              ? 'Parsing & Validating Workbook...'
              : selectedFile
              ? `Selected: ${selectedFile.name}`
              : 'Click or Drag & Drop Wholesale Excel Workbook (.xlsx)'}
          </h4>

          <p className="text-xs text-slate-500 max-w-md">
            {isUploading
              ? 'Verifying column headers, numerical ranges, dates, shares & rates...'
              : 'Automated commercial validation runs upon file selection.'}
          </p>

          <div className="mt-4">
            <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all">
              <FileSpreadsheet className="w-4 h-4" /> Select Excel File
            </span>
          </div>
        </div>
      </div>

      {/* 2. Validation Summary & Commit Actions */}
      {validationResult && (
        <div className="card-panel rounded-xl p-6 border border-slate-200 shadow-sm bg-white space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded">
                Validation Report
              </span>
              <h3 className="text-base font-bold text-slate-800 mt-1">Workbook Validation Inspection</h3>
            </div>

            <div className="flex items-center gap-3">
              {validationResult.errors.length > 0 && (
                <button
                  onClick={handleDownloadReport}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" /> Download Validation Log
                </button>
              )}

              {validationResult.canCommit && (
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={replaceExisting}
                      onChange={(e) => setReplaceExisting(e.target.checked)}
                      className="rounded accent-blue-600"
                    />
                    Replace Existing Dataset
                  </label>

                  <button
                    disabled={isCommitting}
                    onClick={handleCommitData}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-all shadow-sm"
                  >
                    {isCommitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                    {isCommitting ? 'Importing...' : 'Commit & Import Data'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stat Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 block mb-1">Total Rows</span>
              <span className="text-xl font-bold text-slate-800">{validationResult.totalRows.toLocaleString('en-US')}</span>
            </div>
            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
              <span className="text-[11px] text-emerald-700 block mb-1">Valid Rows</span>
              <span className="text-xl font-bold text-emerald-700">{validationResult.validRows.toLocaleString('en-US')}</span>
            </div>
            <div className="bg-rose-50 p-3 rounded-lg border border-rose-200">
              <span className="text-[11px] text-rose-700 block mb-1">Rejected Rows</span>
              <span className="text-xl font-bold text-rose-700">{validationResult.invalidRows.toLocaleString('en-US')}</span>
            </div>
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
              <span className="text-[11px] text-amber-700 block mb-1">Warnings</span>
              <span className="text-xl font-bold text-amber-700">{validationResult.warningCount.toLocaleString('en-US')}</span>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
              <span className="text-[11px] text-purple-700 block mb-1">Duplicates</span>
              <span className="text-xl font-bold text-purple-700">{validationResult.duplicateCount.toLocaleString('en-US')}</span>
            </div>
          </div>

          {/* Validation Issues Table */}
          {validationResult.errors.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" /> Validation Issues ({filteredErrors.length})
                </h4>

                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    onClick={() => setSeverityFilter('ALL')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${severityFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    All ({validationResult.errors.length})
                  </button>
                  <button
                    onClick={() => setSeverityFilter('ERROR')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${severityFilter === 'ERROR' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    Errors Only
                  </button>
                  <button
                    onClick={() => setSeverityFilter('WARNING')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${severityFilter === 'WARNING' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    Warnings Only
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-64">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px] sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Row</th>
                      <th className="py-2 px-3">Severity</th>
                      <th className="py-2 px-3">Column</th>
                      <th className="py-2 px-3">Value</th>
                      <th className="py-2 px-3">Validation Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredErrors.map((err, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold text-slate-600">Row {err.rowNumber}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${err.severity === 'ERROR' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                            {err.severity}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{err.column}</td>
                        <td className="py-2 px-3 font-mono text-slate-600 max-w-xs truncate">{String(err.value ?? 'N/A')}</td>
                        <td className="py-2 px-3 text-slate-700">{err.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Import History Table */}
      <div className="card-panel rounded-xl p-6 border border-slate-200 shadow-sm bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
              <History className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Dataset Import History</h3>
          </div>

          <button
            onClick={fetchImportHistory}
            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs border border-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">File Name</th>
                <th className="py-2.5 px-4">Import Date</th>
                <th className="py-2.5 px-4 text-right">Total Rows</th>
                <th className="py-2.5 px-4 text-right">Imported</th>
                <th className="py-2.5 px-4 text-right">Rejected</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No import history logged yet.
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-semibold text-slate-800">{item.fileName}</td>
                    <td className="py-2.5 px-4 text-slate-500 font-mono">{new Date(item.uploadedAt).toLocaleString('en-US')}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-700">{item.totalRows.toLocaleString('en-US')}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-emerald-600 font-bold">{item.importedRows.toLocaleString('en-US')}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-rose-600 font-bold">{item.rejectedRows.toLocaleString('en-US')}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-md">
                        Ready / {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
