import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  PieChart,
  Users,
  DollarSign,
  FileCheck,
  Printer
} from 'lucide-react';
import { FinalScenarioModel } from './FinalScenarioWorkspace';
import { safeParseJson } from '../utils/apiUtils';
import { exportApprovedDecisionToPdf } from '../utils/pdfExportUtils';

interface FinalDecisionApprovalPageProps {
  finalScenario: FinalScenarioModel | null;
  onBackToFinalScenario: () => void;
  onApprovalSuccess?: () => void;
  onRedirectToHistory?: () => void;
}

export const FinalDecisionApprovalPage: React.FC<FinalDecisionApprovalPageProps> = ({
  finalScenario,
  onBackToFinalScenario,
  onApprovalSuccess,
  onRedirectToHistory
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [approving, setApproving] = useState<boolean>(false);
  const [approvedRecord, setApprovedRecord] = useState<any | null>(null);
  const [successNotification, setSuccessNotification] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!finalScenario || !finalScenario.totals) {
    return (
      <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-sm my-6 space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">No Final Scenario Loaded</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Please complete or load a Final Commercial Scenario before opening the Final Decision Approval page.
        </p>
        <button
          onClick={onBackToFinalScenario}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Go to Final Scenario
        </button>
      </div>
    );
  }

  const isApproved = Boolean(approvedRecord) || finalScenario.validation?.isOutgoingShare100 && false; // tracked dynamically
  const statusLabel = approvedRecord ? 'Approved' : 'Ready for Approval';
  const approvalDate = approvedRecord
    ? new Date(approvedRecord.approvalTimestamp).toLocaleString('en-US')
    : new Date().toLocaleDateString('en-US');

  const handleConfirmApproval = async () => {
    setApproving(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/approval/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioName: finalScenario.name || 'Final Commercial Scenario',
          outgoingMinutes: finalScenario.outgoingMinutes,
          incomingMinutes: finalScenario.incomingMinutes,
          outgoingRevenueRate: finalScenario.outgoingRevenueRate,
          carriers: (finalScenario.carrierResults || []).map(c => ({
            carrierName: c.carrierName,
            outgoingShare: c.outgoingSharePct,
            incomingShare: c.incomingSharePct,
            incomingRevenueRate: c.incomingRevenueRate,
            outgoingCostRate: c.outgoingCostRate
          }))
        })
      });

      if (!res.ok) {
        const errData = await safeParseJson(res, {});
        throw new Error(errData.error || 'Failed to approve traffic allocation');
      }

      const data = await safeParseJson(res, {});
      setApprovedRecord(data.decision);
      setShowConfirmModal(false);
      setSuccessNotification('✓ Traffic Allocation Approved Successfully! Navigating to Approval History...');

      if (onApprovalSuccess) onApprovalSuccess();

      // Automatically navigate to Approval History page after a brief notification popup pause
      setTimeout(() => {
        if (onRedirectToHistory) onRedirectToHistory();
      }, 700);

    } catch (err: any) {
      setErrorMsg(err.message || 'Error executing traffic allocation approval.');
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight text-white">Final Commercial Decision</h2>
              <span className={`px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase rounded-full border ${approvedRecord
                  ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                {statusLabel}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Review proposed carrier traffic allocation, inspect final commercial impacts, and execute formal business approval.
            </p>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToFinalScenario}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Final Scenario
          </button>

          <button
            onClick={() => {
              const recordToExport = approvedRecord || {
                id: finalScenario.id || 'preview',
                scenarioName: finalScenario.name || 'Final Commercial Scenario',
                status: approvedRecord ? 'Approved' : 'Proposal Preview',
                approvalTimestamp: new Date().toISOString(),
                outgoingMinutes: finalScenario.outgoingMinutes,
                incomingMinutes: finalScenario.incomingMinutes,
                outgoingRevenueRate: finalScenario.outgoingRevenueRate,
                totals: finalScenario.totals,
                carrierAllocations: (finalScenario.carrierResults || []).map(c => ({
                  carrierName: c.carrierName,
                  outgoingSharePct: c.outgoingSharePct,
                  incomingSharePct: c.incomingSharePct,
                  incomingRevenueRate: c.incomingRevenueRate,
                  outgoingCostRate: c.outgoingCostRate,
                  calculatedOutgoingTraffic: c.calculatedOutgoingTraffic,
                  calculatedIncomingTraffic: c.calculatedIncomingTraffic,
                  incomingRevenue: c.incomingRevenue,
                  subscriberRevenue: c.subscriberRevenue,
                  totalRevenue: c.totalRevenue,
                  wholesaleCost: c.wholesaleCost,
                  netProfit: c.netProfit,
                  profitMarginPct: c.profitMarginPct
                })),
                createdAt: new Date().toISOString()
              };
              exportApprovedDecisionToPdf(recordToExport);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 transition-all shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-600" /> Export PDF Report
          </button>

          {!approvedRecord ? (
            <button
              onClick={() => setShowConfirmModal(true)}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md cursor-pointer"
            >
              <FileCheck className="w-4 h-4" /> Approve Traffic Allocation
            </button>
          ) : (
            <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Allocation Approved
            </span>
          )}
        </div>
      </div>

      {/* Success Popup Toast Notification */}
      {successNotification && (
        <div className="p-4 bg-emerald-600 text-white rounded-xl shadow-lg text-xs font-bold flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 animate-bounce" />
            <span>{successNotification}</span>
          </div>
          <button onClick={() => setSuccessNotification(null)} className="text-emerald-200 hover:text-white font-bold">Dismiss</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 font-bold hover:text-rose-800">Dismiss</button>
        </div>
      )}

      {/* Decision Status Metadata Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs w-full">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Scenario Name</span>
            <span className="font-extrabold text-slate-900 text-sm">{finalScenario.name}</span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Decision Status</span>
            <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-xs ${approvedRecord ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
              {approvedRecord ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5 text-amber-600" />}
              {statusLabel}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Approval Date</span>
            <span className="font-bold text-slate-700 text-xs">{approvalDate}</span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Participating Carriers</span>
            <span className="font-bold text-indigo-700 text-xs">{finalScenario.carrierResults?.length || 0} Carriers</span>
          </div>
        </div>
      </div>

      {/* SUMMARY PROMINENT BUSINESS METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Net Commercial Profit Banner */}
        <div className={`sm:col-span-2 lg:col-span-3 p-6 rounded-2xl border shadow-sm ${finalScenario.totals.netProfit >= 0
            ? 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-emerald-500/10 border-emerald-200 text-emerald-950'
            : 'bg-rose-50 border-rose-200 text-rose-950'
          }`}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Final Net Commercial Profit
            </span>
            <span className={`inline-flex items-center text-xs font-bold px-3 py-1 rounded-full ${finalScenario.totals.netProfit >= 0 ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}>
              {finalScenario.totals.profitMarginPct.toFixed(2)}% Margin
            </span>
          </div>

          <div className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
            ${finalScenario.totals.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Total Revenue */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500">Total Revenue</span>
          <div className="text-xl font-extrabold text-blue-700">
            ${finalScenario.totals.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Total Wholesale Cost */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500">Total Wholesale Cost</span>
          <div className="text-xl font-extrabold text-rose-600">
            ${finalScenario.totals.totalWholesaleCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Total Incoming Traffic */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500">Total Incoming Traffic</span>
          <div className="text-xl font-extrabold text-teal-700">
            {finalScenario.totals.totalIncomingTraffic.toLocaleString('en-US')} mins
          </div>
        </div>

        {/* Total Outgoing Traffic */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500">Total Outgoing Traffic</span>
          <div className="text-xl font-extrabold text-blue-700">
            {finalScenario.totals.totalOutgoingTraffic.toLocaleString('en-US')} mins
          </div>
        </div>

        {/* Incoming Revenue */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500">Incoming Wholesale Revenue</span>
          <div className="text-lg font-bold text-slate-800">
            ${finalScenario.totals.totalIncomingRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Subscriber Revenue */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500">Subscriber Revenue</span>
          <div className="text-lg font-bold text-slate-800">
            ${finalScenario.totals.totalSubscriberRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* FINAL APPROVED ALLOCATION TABLE */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Approved Carrier Allocation Breakdown</h3>
              <p className="text-xs text-slate-500">Exact carrier traffic distribution and commercial revenue/cost contributions</p>
            </div>
          </div>

          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            {finalScenario.carrierResults?.length || 0} Dynamic Carriers
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Carrier</th>
                <th className="py-3 px-4 text-center">Inc Share</th>
                <th className="py-3 px-4 text-center">Out Share</th>
                <th className="py-3 px-4 text-right">Inc Traffic (mins)</th>
                <th className="py-3 px-4 text-right">Out Traffic (mins)</th>
                <th className="py-3 px-4 text-right">Total Revenue</th>
                <th className="py-3 px-4 text-right">Wholesale Cost</th>
                <th className="py-3 px-4 text-right">Net Profit</th>
                <th className="py-3 px-4 text-right">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
              {finalScenario.carrierResults?.map((cr, idx) => (
                <tr key={cr.id || idx} className="hover:bg-slate-50/80 transition-all">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{cr.carrierName}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-teal-700 bg-teal-50/30">{cr.incomingSharePct}%</td>
                  <td className="py-3.5 px-4 text-center font-bold text-blue-700 bg-blue-50/30">{cr.outgoingSharePct}%</td>
                  <td className="py-3.5 px-4 text-right font-mono text-teal-700">{cr.calculatedIncomingTraffic.toLocaleString('en-US')}</td>
                  <td className="py-3.5 px-4 text-right font-mono text-blue-700">{cr.calculatedOutgoingTraffic.toLocaleString('en-US')}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                    ${cr.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                    ${cr.wholesaleCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`py-3.5 px-4 text-right font-bold ${cr.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    ${cr.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${cr.profitMarginPct >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                      {cr.profitMarginPct.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRMATION MODAL DIALOG */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Confirm Traffic Allocation</h3>
                <p className="text-xs text-slate-500">Formal business approval confirmation</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are about to approve the following carrier traffic allocation for implementation inside the application.
            </p>

            {/* Concise Summary inside Modal */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600 font-medium">
                <span>Scenario:</span>
                <span className="font-bold text-slate-900">{finalScenario.name}</span>
              </div>

              <div className="flex justify-between items-center text-slate-600 font-medium">
                <span>Total Incoming Traffic:</span>
                <span className="font-bold text-teal-700">{finalScenario.totals.totalIncomingTraffic.toLocaleString('en-US')} mins</span>
              </div>

              <div className="flex justify-between items-center text-slate-600 font-medium">
                <span>Total Outgoing Traffic:</span>
                <span className="font-bold text-blue-700">{finalScenario.totals.totalOutgoingTraffic.toLocaleString('en-US')} mins</span>
              </div>

              <div className="flex justify-between items-center text-slate-600 font-medium">
                <span>Total Revenue:</span>
                <span className="font-bold text-slate-900">${finalScenario.totals.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between items-center text-slate-600 font-medium">
                <span>Total Cost:</span>
                <span className="font-bold text-rose-600">${finalScenario.totals.totalWholesaleCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-slate-900 font-extrabold">
                <span>Net Commercial Profit:</span>
                <span className={finalScenario.totals.netProfit >= 0 ? 'text-emerald-700 text-sm' : 'text-rose-700 text-sm'}>
                  ${finalScenario.totals.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({finalScenario.totals.profitMarginPct.toFixed(2)}%)
                </span>
              </div>
            </div>

            {/* Dialog Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={approving}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApproval}
                disabled={approving}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <FileCheck className="w-4 h-4" /> {approving ? 'Approving...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinalDecisionApprovalPage;
