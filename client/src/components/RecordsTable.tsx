import React from 'react';
import { ChevronLeft, ChevronRight, Table as TableIcon, Download, Info, FileSpreadsheet } from 'lucide-react';
import { AuditRecord } from './CalculationBreakdownModal';

export interface RecordItem {
  date: string;
  customer: string;
  operator: string;
  carrier: string;
  route: string;
  country: string;
  outgoingMins: number;
  incomingMins: number;
  outgoingShare?: number;
  incomingShare?: number;
  calcOutgoingTraffic: number;
  calcIncomingTraffic: number;
  incRevRate?: number;
  outCostRate?: number;
  outRevRate?: number;
  incomingRevenue: number;
  subscriberRevenue: number;
  totalRevenue: number;
  wholesaleCost: number;
  totalCost: number;
  netProfit: number;
  marginPct: number;
}

interface RecordsTableProps {
  records: RecordItem[];
  page: number;
  totalPages: number;
  totalRecords: number;
  onPageChange: (newPage: number) => void;
  onSelectRecord: (record: AuditRecord) => void;
  onExport: (format: 'xlsx' | 'csv') => void;
  loading?: boolean;
}

export const RecordsTable: React.FC<RecordsTableProps> = ({
  records,
  page,
  totalPages,
  totalRecords,
  onPageChange,
  onSelectRecord,
  onExport,
  loading
}) => {
  return (
    <div className="card-panel rounded-xl p-5 border border-slate-200 shadow-sm bg-white mb-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
            <TableIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Commercial Transactions Record Log</h3>
            <p className="text-xs text-slate-500">Detailed line items and row-level calculation audit traces</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onExport('xlsx')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Export Excel
          </button>
          <button
            onClick={() => onExport('csv')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" /> Export CSV
          </button>
          <span className="text-xs text-slate-500 hidden sm:inline font-medium">
            Total Records: <b className="text-slate-800">{totalRecords}</b>
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-3">Date</th>
              <th className="py-3 px-3">Customer</th>
              <th className="py-3 px-3">Operator</th>
              <th className="py-3 px-3">Carrier</th>
              <th className="py-3 px-3">Route</th>
              <th className="py-3 px-3 text-right">Out Traffic</th>
              <th className="py-3 px-3 text-right">Inc Traffic</th>
              <th className="py-3 px-3 text-right">Revenue ($)</th>
              <th className="py-3 px-3 text-right">Cost ($)</th>
              <th className="py-3 px-3 text-right">Net Profit ($)</th>
              <th className="py-3 px-3 text-right">Margin %</th>
              <th className="py-3 px-3 text-center">Audit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={12} className="py-8 text-center text-slate-400">
                  Loading records...
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-8 text-center text-slate-400">
                  No matching commercial records found.
                </td>
              </tr>
            ) : (
              records.map((row, idx) => (
                <tr
                  key={idx}
                  onClick={() => onSelectRecord({
                    date: row.date,
                    customer: row.customer,
                    operator: row.operator,
                    carrier: row.carrier,
                    route: row.route,
                    country: row.country,
                    outgoingMins: row.outgoingMins,
                    incomingMins: row.incomingMins,
                    outgoingShare: row.outgoingShare || 0.60,
                    incomingShare: row.incomingShare || 0.50,
                    calcOutgoingTraffic: row.calcOutgoingTraffic,
                    calcIncomingTraffic: row.calcIncomingTraffic,
                    incRevRate: row.incRevRate || 0.50,
                    outCostRate: row.outCostRate || 0.70,
                    outRevRate: row.outRevRate || 1.00,
                    incomingRevenue: row.incomingRevenue,
                    subscriberRevenue: row.subscriberRevenue,
                    totalRevenue: row.totalRevenue,
                    wholesaleCost: row.wholesaleCost,
                    totalCost: row.totalCost,
                    grossProfit: row.totalRevenue - row.wholesaleCost,
                    netProfit: row.netProfit,
                    marginPct: row.marginPct
                  })}
                  className="hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">{row.date}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">{row.customer}</td>
                  <td className="py-2.5 px-3 text-slate-800 group-hover:text-blue-600 font-semibold">{row.operator}</td>
                  <td className="py-2.5 px-3 text-slate-600">{row.carrier}</td>
                  <td className="py-2.5 px-3 text-slate-700 font-mono text-[11px]">{row.route}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-blue-700">{row.calcOutgoingTraffic.toLocaleString('en-US')} m</td>
                  <td className="py-2.5 px-3 text-right font-mono text-teal-700">{row.calcIncomingTraffic.toLocaleString('en-US')} m</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-slate-800">${row.totalRevenue.toLocaleString('en-US')}</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-rose-600">${row.totalCost.toLocaleString('en-US')}</td>
                  <td className={`py-2.5 px-3 text-right font-bold ${row.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    ${row.netProfit.toLocaleString('en-US')}
                  </td>
                  <td className={`py-2.5 px-3 text-right font-semibold ${row.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {row.marginPct}%
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="p-1 bg-slate-100 group-hover:bg-blue-50 text-slate-500 group-hover:text-blue-600 rounded inline-block transition-all">
                      <Info className="w-3.5 h-3.5" />
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-4 text-xs">
        <span className="text-slate-500 font-medium">
          Showing Page <b className="text-slate-800">{page}</b> of <b className="text-slate-800">{totalPages || 1}</b>
        </span>

        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="p-1.5 rounded-lg bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="p-1.5 rounded-lg bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
