import React, { useState, useEffect } from 'react';
import {
  Award,
  Copy,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Users,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Scale,
  DollarSign,
  Activity,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import {
  CarrierInput,
  CarrierResult,
  SimulationModel
} from './CarrierSimulationWorkspace';
import { safeParseJson } from '../utils/apiUtils';

export interface VarianceMetrics {
  targetSimulationId: string;
  targetSimulationName: string;
  revenueDiff: number;
  costDiff: number;
  netProfitDiff: number;
  marginPctDiff: number;
  incomingTrafficDiff: number;
  outgoingTrafficDiff: number;
}

export interface FinalScenarioModel {
  id?: string;
  name: string;
  description?: string;
  sourceSimulationId?: string;
  outgoingMinutes: number;
  incomingMinutes: number;
  outgoingRevenueRate: number;
  validation: {
    isValid: boolean;
    totalOutgoingSharePct: number;
    totalIncomingSharePct: number;
    isOutgoingShare100: boolean;
    isIncomingShare100: boolean;
    errors: string[];
    warnings: string[];
  };
  carrierResults: CarrierResult[];
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
  variances: VarianceMetrics[];
}

interface FinalScenarioWorkspaceProps {
  simulations: SimulationModel[];
  onFinalScenarioUpdated?: () => void;
  onProceedToApproval?: (scenario: FinalScenarioModel) => void;
}

export const FinalScenarioWorkspace: React.FC<FinalScenarioWorkspaceProps> = ({
  simulations,
  onFinalScenarioUpdated,
  onProceedToApproval
}) => {
  const [finalScenario, setFinalScenario] = useState<FinalScenarioModel | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Local draft state for final scenario inputs
  const [draftName, setDraftName] = useState<string>('Final Commercial Scenario');
  const [draftOutgoingMins, setDraftOutgoingMins] = useState<number>(100000);
  const [draftIncomingMins, setDraftIncomingMins] = useState<number>(200000);
  const [draftOutgoingRevRate, setDraftOutgoingRevRate] = useState<number>(1.0);
  const [draftCarriers, setDraftCarriers] = useState<CarrierInput[]>([]);

  // Fetch active Final Scenario on mount
  const fetchFinalScenario = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/final-scenario');
      const data = await safeParseJson(res, { finalScenario: null });
      if (data.finalScenario) {
        setFinalScenario(data.finalScenario);
        loadFinalScenarioToDraft(data.finalScenario);
      }
    } catch (err) {
      console.error('Failed to load final commercial scenario:', err);
      setErrorMsg('Failed to load final commercial scenario.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinalScenario();
  }, []);

  const loadFinalScenarioToDraft = (scen: FinalScenarioModel) => {
    setDraftName(scen.name);
    setDraftOutgoingMins(scen.outgoingMinutes);
    setDraftIncomingMins(scen.incomingMinutes);
    setDraftOutgoingRevRate(scen.outgoingRevenueRate);

    const carriers = (scen.carrierResults || []).map(c => ({
      id: c.id,
      carrierName: c.carrierName,
      outgoingShare: c.outgoingSharePct,
      incomingShare: c.incomingSharePct,
      incomingRevenueRate: c.incomingRevenueRate,
      outgoingCostRate: c.outgoingCostRate
    }));

    setDraftCarriers(
      carriers.length > 0
        ? carriers
        : [
            { carrierName: 'Carrier A', outgoingShare: 60, incomingShare: 50, incomingRevenueRate: 0.50, outgoingCostRate: 0.70 },
            { carrierName: 'Carrier B', outgoingShare: 40, incomingShare: 50, incomingRevenueRate: 0.40, outgoingCostRate: 0.60 }
          ]
    );
  };

  // Recalculate local calculation preview
  const triggerRecalculate = async (
    outgoingMinutes: number,
    incomingMinutes: number,
    outgoingRevenueRate: number,
    carriers: CarrierInput[]
  ) => {
    try {
      const res = await fetch('/api/simulation/multi-carrier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: draftName,
          outgoingMinutes,
          incomingMinutes,
          outgoingRevenueRate,
          carriers
        })
      });
      const output = await safeParseJson(res, null);
      if (!output || !output.totals) return;

      // Compute client-side variances against simulations list
      const variances: VarianceMetrics[] = (simulations || []).map(sim => ({
        targetSimulationId: sim.id || '',
        targetSimulationName: sim.name || 'Simulation',
        revenueDiff: Number((output.totals.totalRevenue - sim.totals.totalRevenue).toFixed(2)),
        costDiff: Number((output.totals.totalWholesaleCost - sim.totals.totalWholesaleCost).toFixed(2)),
        netProfitDiff: Number((output.totals.netProfit - sim.totals.netProfit).toFixed(2)),
        marginPctDiff: Number((output.totals.profitMarginPct - sim.totals.profitMarginPct).toFixed(2)),
        incomingTrafficDiff: Math.round(output.totals.totalIncomingTraffic - sim.totals.totalIncomingTraffic),
        outgoingTrafficDiff: Math.round(output.totals.totalOutgoingTraffic - sim.totals.totalOutgoingTraffic)
      }));

      setFinalScenario({
        ...output,
        name: draftName,
        variances
      });
    } catch (err) {
      console.error('Final Scenario recalculation error:', err);
    }
  };

  // Copy Simulation K into Final Scenario (Independent Copy Action)
  const handleCopySimulationToFinal = async (simId: string, simName: string) => {
    setSaving(true);
    setCopyNotice(null);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/final-scenario/copy-from-simulation/${simId}`, {
        method: 'POST'
      });

      if (!res.ok) {
        const errData = await safeParseJson(res, {});
        throw new Error(errData.error || 'Failed to copy simulation');
      }

      const data = await safeParseJson(res, {});
      setFinalScenario(data.finalScenario);
      loadFinalScenarioToDraft(data.finalScenario);
      setCopyNotice(`Successfully copied allocation values from "${simName}" into Final Scenario.`);
      if (onFinalScenarioUpdated) onFinalScenarioUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error copying simulation.');
    } finally {
      setSaving(false);
    }
  };

  // Save Final Scenario to Database
  const handleSaveFinalScenario = async () => {
    setSaving(true);
    setErrorMsg(null);
    setCopyNotice(null);
    try {
      const res = await fetch('/api/final-scenario', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: draftName,
          outgoingMinutes: draftOutgoingMins,
          incomingMinutes: draftIncomingMins,
          outgoingRevenueRate: draftOutgoingRevRate,
          carriers: draftCarriers
        })
      });

      if (!res.ok) {
        const errData = await safeParseJson(res, {});
        throw new Error(errData.error || 'Failed to save final scenario');
      }

      const data = await safeParseJson(res, {});
      setFinalScenario(data.finalScenario);
      setCopyNotice('Final Commercial Scenario saved successfully.');
      if (onFinalScenarioUpdated) onFinalScenarioUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving final scenario.');
    } finally {
      setSaving(false);
    }
  };

  // Carrier modification handlers
  const handleAddCarrier = () => {
    const newCarrier: CarrierInput = {
      carrierName: `Carrier ${String.fromCharCode(65 + draftCarriers.length)}`,
      outgoingShare: 0,
      incomingShare: 0,
      incomingRevenueRate: 0.50,
      outgoingCostRate: 0.60
    };
    const updated = [...draftCarriers, newCarrier];
    setDraftCarriers(updated);
    triggerRecalculate(draftOutgoingMins, draftIncomingMins, draftOutgoingRevRate, updated);
  };

  const handleRemoveCarrier = (idx: number) => {
    if (draftCarriers.length <= 1) return;
    const updated = draftCarriers.filter((_, i) => i !== idx);
    setDraftCarriers(updated);
    triggerRecalculate(draftOutgoingMins, draftIncomingMins, draftOutgoingRevRate, updated);
  };

  const handleCarrierChange = (idx: number, field: keyof CarrierInput, val: any) => {
    const updated = draftCarriers.map((c, i) => {
      if (i === idx) return { ...c, [field]: val };
      return c;
    });
    setDraftCarriers(updated);
    triggerRecalculate(draftOutgoingMins, draftIncomingMins, draftOutgoingRevRate, updated);
  };

  const handleTrafficParamChange = (field: 'outgoingMinutes' | 'incomingMinutes' | 'outgoingRevenueRate', val: number) => {
    let outMins = draftOutgoingMins;
    let incMins = draftIncomingMins;
    let outRevRate = draftOutgoingRevRate;

    if (field === 'outgoingMinutes') {
      outMins = val;
      setDraftOutgoingMins(val);
    } else if (field === 'incomingMinutes') {
      incMins = val;
      setDraftIncomingMins(val);
    } else if (field === 'outgoingRevenueRate') {
      outRevRate = val;
      setDraftOutgoingRevRate(val);
    }

    triggerRecalculate(outMins, incMins, outRevRate, draftCarriers);
  };

  const outShareSum = draftCarriers.reduce((acc, c) => acc + (Number(c.outgoingShare) || 0), 0);
  const incShareSum = draftCarriers.reduce((acc, c) => acc + (Number(c.incomingShare) || 0), 0);
  const isOut100 = Math.abs(outShareSum - 100) < 0.01;
  const isInc100 = Math.abs(incShareSum - 100) < 0.01;

  if (loading) {
    return (
      <div className="card-panel rounded-2xl p-12 text-center bg-white border border-slate-200 shadow-sm my-6">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-600 border-t-transparent mb-3"></div>
        <p className="text-sm font-semibold text-slate-600">Loading Final Commercial Scenario...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sleek Header Banner - Clean Section Title Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-2xs">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Final Commercial Scenario
            </h2>
            <p className="text-xs text-slate-500">
              Consolidated allocation decisions and variance analysis against individual simulations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveFinalScenario}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Final Scenario'}
          </button>

          {onProceedToApproval && finalScenario && (
            <button
              onClick={() => onProceedToApproval(finalScenario)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm cursor-pointer"
            >
              <FileCheck className="w-4 h-4" /> Proceed to Approval
            </button>
          )}
        </div>
      </div>

      {/* Copy Notice Banner */}
      {copyNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {copyNotice}
          </div>
          <button onClick={() => setCopyNotice(null)} className="text-emerald-600 font-bold hover:text-emerald-900">Dismiss</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 font-bold">Dismiss</button>
        </div>
      )}

      {/* QUICK STARTING-POINT ACTIONS BAR - Sleek Underline / Segment style */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Copy className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Use Simulation Values as Starting Point:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {simulations.map((sim) => (
            <button
              key={sim.id}
              onClick={() => handleCopySimulationToFinal(sim.id!, sim.name)}
              disabled={saving}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-800 hover:bg-amber-50 hover:text-amber-900 border border-slate-200 hover:border-amber-300 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <Copy className="w-3.5 h-3.5 text-amber-600" /> Use {sim.name}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN FINAL SCENARIO WORKSPACE GRID - EVEN 50/50 SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2 items-start">

        {/* LEFT PANEL: Final Allocation Inputs (Even 50% Width) */}
        <div className="space-y-6 pr-0 lg:pr-2">

          {/* Baseline Parameters */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Final Baseline Parameters</h3>
              <span className="text-xs font-medium text-slate-500">
                Consolidated Decision
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Total Outgoing Mins
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={draftOutgoingMins}
                  onChange={(e) => handleTrafficParamChange('outgoingMinutes', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Total Incoming Mins
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={draftIncomingMins}
                  onChange={(e) => handleTrafficParamChange('incomingMinutes', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-teal-700 focus:ring-2 focus:ring-teal-500 focus:outline-none shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Outgoing Rev / Min
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.05"
                    value={draftOutgoingRevRate}
                    onChange={(e) => handleTrafficParamChange('outgoingRevenueRate', Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-slate-500 focus:outline-none shadow-2xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Final Carrier Allocations Table */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Final Carrier Share & Rate Allocations</h3>
              </div>
              <button
                onClick={handleAddCarrier}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-amber-700 hover:bg-amber-50 border border-amber-200 rounded-lg transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Carrier
              </button>
            </div>

            {/* Validation Share Status */}
            <div className="flex flex-wrap items-center gap-6 text-xs py-2 px-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-500">Outgoing Share Total:</span>
                <span className={`inline-flex items-center gap-1 font-bold ${isOut100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {outShareSum.toFixed(1)}% {isOut100 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-500">Incoming Share Total:</span>
                <span className={`inline-flex items-center gap-1 font-bold ${isInc100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {incShareSum.toFixed(1)}% {isInc100 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                </span>
              </div>
            </div>

            {/* Sleek Carrier Input Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2 pr-3">Carrier Name</th>
                    <th className="py-2 px-2 text-center w-24">Out Share %</th>
                    <th className="py-2 px-2 text-center w-24">Inc Share %</th>
                    <th className="py-2 px-2 text-center w-28">Inc Rev ($/m)</th>
                    <th className="py-2 px-2 text-center w-28">Out Cost ($/m)</th>
                    <th className="py-2 pl-2 text-right w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {draftCarriers.map((carrier, idx) => (
                    <tr key={carrier.id || idx} className="hover:bg-slate-50/60 transition-all">
                      <td className="py-2.5 pr-3">
                        <input
                          type="text"
                          value={carrier.carrierName}
                          onChange={(e) => handleCarrierChange(idx, 'carrierName', e.target.value)}
                          placeholder="Carrier Name"
                          className="px-2.5 py-1 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-none w-full"
                        />
                      </td>
                      <td className="py-2.5 px-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={carrier.outgoingShare}
                          onChange={(e) => handleCarrierChange(idx, 'outgoingShare', Number(e.target.value))}
                          className="w-full text-center px-2 py-1 bg-white border border-slate-200 rounded-md font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={carrier.incomingShare}
                          onChange={(e) => handleCarrierChange(idx, 'incomingShare', Number(e.target.value))}
                          className="w-full text-center px-2 py-1 bg-white border border-slate-200 rounded-md font-bold text-teal-700 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-2">
                        <input
                          type="number"
                          min="0"
                          step="0.05"
                          value={carrier.incomingRevenueRate}
                          onChange={(e) => handleCarrierChange(idx, 'incomingRevenueRate', Number(e.target.value))}
                          className="w-full text-center px-2 py-1 bg-white border border-slate-200 rounded-md font-bold text-slate-800 focus:ring-2 focus:ring-slate-500 focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-2">
                        <input
                          type="number"
                          min="0"
                          step="0.05"
                          value={carrier.outgoingCostRate}
                          onChange={(e) => handleCarrierChange(idx, 'outgoingCostRate', Number(e.target.value))}
                          className="w-full text-center px-2 py-1 bg-white border border-slate-200 rounded-md font-bold text-rose-700 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 pl-2 text-right">
                        {draftCarriers.length > 1 && (
                          <button
                            onClick={() => handleRemoveCarrier(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-all"
                            title="Remove Carrier"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Final Scenario Results & Breakdown (Even 50% Width with Vertical Split Line) */}
        <div className="space-y-6 pl-0 lg:pl-8 lg:border-l lg:border-slate-200">

          {/* KPI Summary */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Final Scenario Results</h3>
              </div>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                Consolidated
              </span>
            </div>

            {finalScenario && finalScenario.totals ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border ${
                  finalScenario.totals.netProfit >= 0
                    ? 'bg-gradient-to-br from-amber-500/10 via-emerald-500/5 to-amber-500/10 border-amber-200 text-amber-950'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}>
                  <div className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">
                    Final Net Commercial Profit
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className={`text-2xl font-black ${finalScenario.totals.netProfit >= 0 ? 'text-amber-900' : 'text-rose-700'}`}>
                      ${finalScenario.totals.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-md ${
                      finalScenario.totals.netProfit >= 0 ? 'bg-amber-600 text-white' : 'bg-rose-600 text-white'
                    }`}>
                      {finalScenario.totals.netProfit >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                      {finalScenario.totals.profitMarginPct.toFixed(2)}% Margin
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-4 gap-x-6 py-2">
                  <div>
                    <span className="text-[11px] font-medium text-slate-500 block">Total Revenue</span>
                    <span className="text-base font-bold text-blue-700">
                      ${finalScenario.totals.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-medium text-slate-500 block">Total Wholesale Cost</span>
                    <span className="text-base font-bold text-rose-600">
                      ${finalScenario.totals.totalWholesaleCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-medium text-slate-500 block">Incoming Revenue</span>
                    <span className="text-sm font-semibold text-slate-800">
                      ${finalScenario.totals.totalIncomingRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-medium text-slate-500 block">Subscriber Revenue</span>
                    <span className="text-sm font-semibold text-slate-800">
                      ${finalScenario.totals.totalSubscriberRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-medium text-slate-500 block">Total Incoming Mins</span>
                    <span className="text-sm font-semibold text-teal-700">
                      {finalScenario.totals.totalIncomingTraffic.toLocaleString('en-US')} mins
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-medium text-slate-500 block">Total Outgoing Mins</span>
                    <span className="text-sm font-semibold text-blue-700">
                      {finalScenario.totals.totalOutgoingTraffic.toLocaleString('en-US')} mins
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Carrier Breakdown Table */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Final Carrier Breakdown</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {finalScenario?.carrierResults?.length || 0} Carriers
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2">Carrier</th>
                    <th className="py-2 text-right">Out Mins</th>
                    <th className="py-2 text-right">Revenue</th>
                    <th className="py-2 text-right">Cost</th>
                    <th className="py-2 text-right">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {finalScenario?.carrierResults?.map((cr, idx) => (
                    <tr key={cr.id || idx} className="hover:bg-slate-50/60 transition-all">
                      <td className="py-2 font-bold text-slate-900">
                        {cr.carrierName}
                        <div className="text-[10px] text-slate-400 font-normal">
                          Out {cr.outgoingSharePct}% | Inc {cr.incomingSharePct}%
                        </div>
                      </td>
                      <td className="py-2 text-right font-bold text-blue-700">
                        {cr.calculatedOutgoingTraffic.toLocaleString('en-US')}
                      </td>
                      <td className="py-2 text-right font-bold text-slate-900">
                        ${cr.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 text-right font-bold text-rose-600">
                        ${cr.wholesaleCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`py-2 text-right font-bold ${cr.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        ${cr.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* DIFFERENCE / VARIANCE ANALYSIS SECTION */}
      {finalScenario && finalScenario.variances && finalScenario.variances.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Difference Analysis (Final Scenario vs Simulations)</h3>
                <p className="text-xs text-slate-500">Numerical variance deltas between the Final Scenario and each baseline simulation</p>
              </div>
            </div>

            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              Variance Metrics
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {finalScenario.variances.map((v, idx) => (
              <div
                key={v.targetSimulationId || idx}
                className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-extrabold text-slate-800">
                    Final Scenario vs {v.targetSimulationName}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Variance Delta
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Revenue Change:</span>
                    <span className={`font-bold ${v.revenueDiff >= 0 ? 'text-blue-700' : 'text-rose-600'}`}>
                      {v.revenueDiff >= 0 ? '+' : ''}${v.revenueDiff.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Cost Change:</span>
                    <span className={`font-bold ${v.costDiff <= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {v.costDiff >= 0 ? '+' : ''}${v.costDiff.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                    <span className="font-bold text-slate-700">Net Profit Variance:</span>
                    <span className={`font-black text-sm ${v.netProfitDiff >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {v.netProfitDiff >= 0 ? '+' : ''}${v.netProfitDiff.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500 font-medium">Margin Variance:</span>
                    <span className={`font-bold ${v.marginPctDiff >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {v.marginPctDiff >= 0 ? '+' : ''}{v.marginPctDiff.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FinalScenarioWorkspace;
