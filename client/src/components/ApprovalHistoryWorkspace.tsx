import React, { useEffect, useState } from 'react';
import {
  FileCheck,
  CheckCircle2,
  Calendar,
  Eye,
  Users,
  X,
  TrendingUp,
  DollarSign,
  Award,
  Printer,
  FileDown
} from 'lucide-react';
import { safeParseJson } from '../utils/apiUtils';
import { exportApprovedDecisionToPdf } from '../utils/pdfExportUtils';

export interface ApprovedDecisionRecord {
  id: string;
  scenarioId?: string;
  scenarioName: string;
  sourceSimulationName?: string;
  status: string;
  approvalTimestamp: string;
  outgoingMinutes: number;
  incomingMinutes: number;
  outgoingRevenueRate: number;
  totals: {
    totalIncomingTraffic: number;
    totalOutgoingTraffic: number;
    totalIncomingRevenue: number;
    totalSubscriberRevenue: number;
    totalRevenue: number;
    totalWholesaleCost: number;
    totalCost: number;
    netProfit: number;
    profitMarginPct: number;
  };
  carrierAllocations: {
    id?: string;
    carrierName: string;
    outgoingSharePct: number;
    incomingSharePct: number;
    incomingRevenueRate: number;
    outgoingCostRate: number;
    calculatedOutgoingTraffic: number;
    calculatedIncomingTraffic: number;
    incomingRevenue: number;
    subscriberRevenue: number;
    totalRevenue: number;
    wholesaleCost: number;
    netProfit: number;
    profitMarginPct: number;
  }[];
  createdAt: string;
}

export const ApprovalHistoryWorkspace: React.FC = () => {
  const [history, setHistory] = useState<ApprovedDecisionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDecision, setSelectedDecision] = useState<ApprovedDecisionRecord | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/approval/history');
      const data = await safeParseJson(res, { history: [] });
      setHistory(data.history || []);
    } catch (err) {
      console.error('Failed to load approval history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="card-panel rounded-2xl p-12 text-center bg-white border border-slate-200 shadow-sm my-6">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent mb-3"></div>
        <p className="text-sm font-semibold text-slate-600">Loading Approval History Log...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Approved Traffic Allocation History</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Audit repository of all formally approved commercial traffic allocations and decision records
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          {history.length} Approved Decisions Logged
        </span>
      </div>

      {history.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No Approved Allocations Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Once you execute formal approval from the Final Decision page, approved decision records will be logged here permanently.
          </p>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Scenario Name</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Approved Date</th>
                  <th className="py-3 px-4 text-right">Total Revenue</th>
                  <th className="py-3 px-4 text-right">Total Cost</th>
                  <th className="py-3 px-4 text-right">Net Profit</th>
                  <th className="py-3 px-4 text-right">Margin %</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                {history.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/80 transition-all">
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">
                      {record.scenarioName}
                      <div className="text-[10px] text-slate-400 font-normal">
                        {record.carrierAllocations?.length || 0} Carriers Allocated
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[11px] bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {record.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {new Date(record.approvalTimestamp).toLocaleString('en-US')}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-blue-700">
                      ${record.totals.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                      ${record.totals.totalWholesaleCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>

                    <td className={`py-3.5 px-4 text-right font-bold ${record.totals.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      ${record.totals.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                        record.totals.profitMarginPct >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {record.totals.profitMarginPct.toFixed(2)}%
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedDecision(record)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Allocation
                        </button>
                        <button
                          onClick={() => exportApprovedDecisionToPdf(record)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 transition-all cursor-pointer"
                          title="Export Approved Allocation as PDF Report"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-600" /> Export PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* APPROVED ALLOCATION DETAILS MODAL */}
      {selectedDecision && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-4xl w-full rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{selectedDecision.scenarioName}</h3>
                  <p className="text-xs text-slate-500">Approved on {new Date(selectedDecision.approvalTimestamp).toLocaleString('en-US')}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportApprovedDecisionToPdf(selectedDecision)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Export Report as PDF
                </button>
                <button
                  onClick={() => setSelectedDecision(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Financial Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-semibold block mb-0.5">Total Revenue</span>
                <span className="text-base font-bold text-blue-700">
                  ${selectedDecision.totals.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-semibold block mb-0.5">Total Wholesale Cost</span>
                <span className="text-base font-bold text-rose-600">
                  ${selectedDecision.totals.totalWholesaleCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-semibold block mb-0.5">Net Commercial Profit</span>
                <span className={`text-base font-black ${selectedDecision.totals.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  ${selectedDecision.totals.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-semibold block mb-0.5">Profit Margin</span>
                <span className={`text-base font-black ${selectedDecision.totals.profitMarginPct >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {selectedDecision.totals.profitMarginPct.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Approved Carrier Allocation Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Approved Carrier Distribution
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <th className="py-2.5 px-4">Carrier</th>
                      <th className="py-2.5 px-4 text-center">Inc Share</th>
                      <th className="py-2.5 px-4 text-center">Out Share</th>
                      <th className="py-2.5 px-4 text-right">Inc Traffic (mins)</th>
                      <th className="py-2.5 px-4 text-right">Out Traffic (mins)</th>
                      <th className="py-2.5 px-4 text-right">Revenue</th>
                      <th className="py-2.5 px-4 text-right">Cost</th>
                      <th className="py-2.5 px-4 text-right">Net Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {selectedDecision.carrierAllocations?.map((ca, idx) => (
                      <tr key={ca.id || idx}>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{ca.carrierName}</td>
                        <td className="py-2.5 px-4 text-center font-bold text-teal-700">{ca.incomingSharePct}%</td>
                        <td className="py-2.5 px-4 text-center font-bold text-blue-700">{ca.outgoingSharePct}%</td>
                        <td className="py-2.5 px-4 text-right font-mono">{ca.calculatedIncomingTraffic.toLocaleString('en-US')}</td>
                        <td className="py-2.5 px-4 text-right font-mono">{ca.calculatedOutgoingTraffic.toLocaleString('en-US')}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900">${ca.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-rose-600">${ca.wholesaleCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className={`py-2.5 px-4 text-right font-bold ${ca.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          ${ca.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                onClick={() => exportApprovedDecisionToPdf(selectedDecision)}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Export Report as PDF
              </button>
              <button
                onClick={() => setSelectedDecision(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalHistoryWorkspace;
