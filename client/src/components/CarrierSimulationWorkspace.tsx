import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Plus,
  Trash2,
  Copy,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Users,
  Building2,
  Edit3,
  Save,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Columns,
  Award,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { SimulationComparisonMatrix } from './SimulationComparisonMatrix';
import { FinalScenarioWorkspace, FinalScenarioModel } from './FinalScenarioWorkspace';
import { FinalDecisionApprovalPage } from './FinalDecisionApprovalPage';
import { ApprovalHistoryWorkspace } from './ApprovalHistoryWorkspace';
import { SimulationVisualizations } from './SimulationVisualizations';
import { AiRecommendationBanner } from './AiRecommendationBanner';
import { safeParseJson } from '../utils/apiUtils';

export interface CarrierInput {
  id?: string;
  carrierName: string;
  outgoingShare: number;
  incomingShare: number;
  incomingRevenueRate: number;
  outgoingCostRate: number;
}

export interface CarrierResult {
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
}

export interface SimulationValidation {
  isValid: boolean;
  totalOutgoingSharePct: number;
  totalIncomingSharePct: number;
  isOutgoingShare100: boolean;
  isIncomingShare100: boolean;
  errors: string[];
  warnings: string[];
}

export interface SimulationModel {
  id?: string;
  name: string;
  description?: string;
  outgoingMinutes: number;
  incomingMinutes: number;
  outgoingRevenueRate: number;
  validation: SimulationValidation;
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
}

export const CarrierSimulationWorkspace: React.FC = () => {
  const [simulations, setSimulations] = useState<SimulationModel[]>([]);
  const [activeSimIndex, setActiveSimIndex] = useState<number>(0);
  const [activeFinalScenario, setActiveFinalScenario] = useState<FinalScenarioModel | null>(null);
  const [workspaceMode, setWorkspaceMode] = useState<
    'simulator' | 'visualizations' | 'ai-suggestion' | 'comparison' | 'final' | 'decision' | 'history'
  >('simulator');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Local draft state for active simulation inputs
  const [draftName, setDraftName] = useState<string>('');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [draftOutgoingMins, setDraftOutgoingMins] = useState<number>(100000);
  const [draftIncomingMins, setDraftIncomingMins] = useState<number>(200000);
  const [draftOutgoingRevRate, setDraftOutgoingRevRate] = useState<number>(1.0);
  const [draftCarriers, setDraftCarriers] = useState<CarrierInput[]>([]);

  // Fetch all simulations & active final scenario on mount
  const fetchSimulations = async () => {
    setLoading(true);
    try {
      const [simRes, finalRes] = await Promise.all([
        fetch('/api/simulations'),
        fetch('/api/final-scenario')
      ]);
      const simData = await safeParseJson(simRes, { simulations: [] });
      const finalData = await safeParseJson(finalRes, { finalScenario: null });

      if (simData.simulations && simData.simulations.length > 0) {
        setSimulations(simData.simulations);
        loadSimulationToDraft(simData.simulations[0]);
        setActiveSimIndex(0);
      }

      if (finalData.finalScenario) {
        setActiveFinalScenario(finalData.finalScenario);
      }
    } catch (err) {
      console.error('Failed to load commercial simulations:', err);
      setErrorMsg('Failed to load commercial simulations from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSimulations();
  }, []);

  // Populate local input draft state when switching active simulation
  const loadSimulationToDraft = (sim: SimulationModel) => {
    setDraftName(sim.name);
    setDraftOutgoingMins(sim.outgoingMinutes);
    setDraftIncomingMins(sim.incomingMinutes);
    setDraftOutgoingRevRate(sim.outgoingRevenueRate);
    
    // Map carrier results or inputs
    const carriers = sim.carrierResults.map(c => ({
      id: c.id,
      carrierName: c.carrierName,
      outgoingShare: c.outgoingSharePct,
      incomingShare: c.incomingSharePct,
      incomingRevenueRate: c.incomingRevenueRate,
      outgoingCostRate: c.outgoingCostRate
    }));

    setDraftCarriers(carriers.length > 0 ? carriers : [
      { carrierName: 'Carrier A', outgoingShare: 60, incomingShare: 50, incomingRevenueRate: 0.50, outgoingCostRate: 0.70 },
      { carrierName: 'Carrier B', outgoingShare: 40, incomingShare: 50, incomingRevenueRate: 0.40, outgoingCostRate: 0.60 }
    ]);
  };

  const activeSim = simulations[activeSimIndex];

  // Recalculate local calculation real-time preview via API or local calculation
  const triggerLocalRecalculate = async (
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
          id: activeSim?.id,
          name: draftName || activeSim?.name || 'Simulation',
          outgoingMinutes,
          incomingMinutes,
          outgoingRevenueRate,
          carriers
        })
      });
      const updatedSim: SimulationModel = await safeParseJson(res, null);
      
      // Update in local state list without waiting for full reload
      setSimulations(prev => {
        const copy = [...prev];
        if (copy[activeSimIndex]) {
          copy[activeSimIndex] = updatedSim;
        }
        return copy;
      });
    } catch (err) {
      console.error('Real-time recalculation error:', err);
    }
  };

  // Switch simulation tab
  const handleSelectSimTab = (index: number) => {
    if (index >= 0 && index < simulations.length) {
      setActiveSimIndex(index);
      loadSimulationToDraft(simulations[index]);
      setIsEditingName(false);
    }
  };

  // Add Carrier
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
    triggerLocalRecalculate(draftOutgoingMins, draftIncomingMins, draftOutgoingRevRate, updated);
  };

  // Remove Carrier
  const handleRemoveCarrier = (idx: number) => {
    if (draftCarriers.length <= 1) return;
    const updated = draftCarriers.filter((_, i) => i !== idx);
    setDraftCarriers(updated);
    triggerLocalRecalculate(draftOutgoingMins, draftIncomingMins, draftOutgoingRevRate, updated);
  };

  // Handle carrier field change
  const handleCarrierChange = (idx: number, field: keyof CarrierInput, val: any) => {
    const updated = draftCarriers.map((c, i) => {
      if (i === idx) {
        return { ...c, [field]: val };
      }
      return c;
    });
    setDraftCarriers(updated);
    triggerLocalRecalculate(draftOutgoingMins, draftIncomingMins, draftOutgoingRevRate, updated);
  };

  // Handle baseline traffic changes
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

    triggerLocalRecalculate(outMins, incMins, outRevRate, draftCarriers);
  };

  // Save changes to backend database
  const handleSaveSimulation = async () => {
    if (!activeSim?.id) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/simulations/${activeSim.id}`, {
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
        throw new Error(errData.error || 'Failed to save simulation');
      }

      const data = await safeParseJson(res, {});
      setSimulations(prev => {
        const copy = [...prev];
        copy[activeSimIndex] = data.simulation;
        return copy;
      });
      setIsEditingName(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving simulation.');
    } finally {
      setSaving(false);
    }
  };

  // Create new Simulation (Up to max 3)
  const handleCreateNewSimulation = async () => {
    if (simulations.length >= 3) {
      setErrorMsg('Maximum 3 commercial simulations allowed in this phase.');
      return;
    }
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/simulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Simulation ${simulations.length + 1}`,
          outgoingMinutes: 100000,
          incomingMinutes: 200000,
          outgoingRevenueRate: 1.0,
          carriers: [
            { carrierName: 'Carrier A', outgoingShare: 50, incomingShare: 50, incomingRevenueRate: 0.50, outgoingCostRate: 0.70 },
            { carrierName: 'Carrier B', outgoingShare: 50, incomingShare: 50, incomingRevenueRate: 0.40, outgoingCostRate: 0.60 }
          ]
        })
      });

      if (!res.ok) {
        const errData = await safeParseJson(res, {});
        throw new Error(errData.error || 'Failed to create simulation');
      }

      const data = await safeParseJson(res, {});
      const updatedList = [...simulations, data.simulation];
      setSimulations(updatedList);
      const newIndex = updatedList.length - 1;
      setActiveSimIndex(newIndex);
      loadSimulationToDraft(data.simulation);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating simulation.');
    } finally {
      setSaving(false);
    }
  };

  // Duplicate active simulation
  const handleDuplicateSimulation = async () => {
    if (!activeSim?.id) return;
    if (simulations.length >= 3) {
      setErrorMsg('Maximum 3 commercial simulations allowed in this phase.');
      return;
    }
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/simulations/${activeSim.id}/duplicate`, {
        method: 'POST'
      });

      if (!res.ok) {
        const errData = await safeParseJson(res, {});
        throw new Error(errData.error || 'Failed to duplicate simulation');
      }

      const data = await safeParseJson(res, {});
      const updatedList = [...simulations, data.simulation];
      setSimulations(updatedList);
      const newIndex = updatedList.length - 1;
      setActiveSimIndex(newIndex);
      loadSimulationToDraft(data.simulation);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error duplicating simulation.');
    } finally {
      setSaving(false);
    }
  };

  // Delete active simulation
  const handleDeleteSimulation = async () => {
    if (!activeSim?.id) return;
    if (simulations.length <= 1) {
      setErrorMsg('At least one commercial simulation must remain in the workspace.');
      return;
    }
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/simulations/${activeSim.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const errData = await safeParseJson(res, {});
        throw new Error(errData.error || 'Failed to delete simulation');
      }

      const updatedList = simulations.filter((_, idx) => idx !== activeSimIndex);
      setSimulations(updatedList);
      const newIndex = Math.max(0, activeSimIndex - 1);
      setActiveSimIndex(newIndex);
      loadSimulationToDraft(updatedList[newIndex]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error deleting simulation.');
    } finally {
      setSaving(false);
    }
  };

  // Reset to Manager Baseline Example
  const handleResetToManagerBaseline = () => {
    setDraftOutgoingMins(100000);
    setDraftIncomingMins(200000);
    setDraftOutgoingRevRate(1.0);
    const baselineCarriers: CarrierInput[] = [
      { carrierName: 'Carrier A', outgoingShare: 60, incomingShare: 50, incomingRevenueRate: 0.50, outgoingCostRate: 0.70 },
      { carrierName: 'Carrier B', outgoingShare: 40, incomingShare: 50, incomingRevenueRate: 0.40, outgoingCostRate: 0.60 }
    ];
    setDraftCarriers(baselineCarriers);
    triggerLocalRecalculate(100000, 200000, 1.0, baselineCarriers);
  };

  // Copy specified simulation into Final Scenario
  const handleCopySimulationToFinalScenario = async (simId: string) => {
    try {
      const res = await fetch(`/api/final-scenario/copy-from-simulation/${simId}`, {
        method: 'POST'
      });
      const data = await safeParseJson(res, {});
      if (data.finalScenario) {
        setActiveFinalScenario(data.finalScenario);
      }
    } catch (err) {
      console.error('Error copying simulation to final scenario:', err);
    }
    setWorkspaceMode('final');
  };

  // Totals verification metrics for incoming and outgoing shares
  const outShareSum = draftCarriers.reduce((acc, c) => acc + (Number(c.outgoingShare) || 0), 0);
  const incShareSum = draftCarriers.reduce((acc, c) => acc + (Number(c.incomingShare) || 0), 0);
  const isOut100 = Math.abs(outShareSum - 100) < 0.01;
  const isInc100 = Math.abs(incShareSum - 100) < 0.01;

  if (loading) {
    return (
      <div className="card-panel rounded-2xl p-12 text-center bg-white border border-slate-200 shadow-sm my-6">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3"></div>
        <p className="text-sm font-semibold text-slate-600">Loading Commercial Simulation Workspace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Workspace Sub-Navigation Mode Bar - Clean Underline Tabs with Parallel Action Buttons */}
      <div className="border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <nav className="flex space-x-6 -mb-px overflow-x-auto">
          <button
            onClick={() => setWorkspaceMode('simulator')}
            className={`py-3 px-1 border-b-2 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              workspaceMode === 'simulator'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Simulator ({simulations.length}/3)
          </button>

          <button
            onClick={() => setWorkspaceMode('visualizations')}
            className={`py-3 px-1 border-b-2 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              workspaceMode === 'visualizations'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <PieChart className="w-4 h-4" />
            Visualizations
          </button>

          <button
            onClick={() => setWorkspaceMode('ai-suggestion')}
            className={`py-3 px-1 border-b-2 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              workspaceMode === 'ai-suggestion'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            AI Suggestion
          </button>

          <button
            onClick={() => setWorkspaceMode('comparison')}
            className={`py-3 px-1 border-b-2 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              workspaceMode === 'comparison'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Columns className="w-4 h-4" />
            Comparison Matrix
          </button>

          <button
            onClick={() => setWorkspaceMode('final')}
            className={`py-3 px-1 border-b-2 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              workspaceMode === 'final'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Award className="w-4 h-4" />
            Final Scenario
          </button>

          <button
            onClick={() => setWorkspaceMode('decision')}
            className={`py-3 px-1 border-b-2 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              workspaceMode === 'decision'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Final Decision & Approval
          </button>

          <button
            onClick={() => setWorkspaceMode('history')}
            className={`py-3 px-1 border-b-2 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              workspaceMode === 'history'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            Approval History
          </button>
        </nav>

        {/* Global Action Bar Parallel to Tabs */}
        <div className="flex items-center gap-2 pb-2">
          <button
            onClick={handleResetToManagerBaseline}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 transition-all cursor-pointer shadow-2xs"
            title="Reset active simulation to manager baseline sample"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" /> Reset Baseline
          </button>
          <button
            onClick={handleSaveSimulation}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save Simulation'}
          </button>
        </div>
      </div>

      {/* Error alert if any */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 font-bold hover:text-rose-800">Dismiss</button>
        </div>
      )}

      {/* MODE 1: Carrier Allocation Simulator */}
      {workspaceMode === 'simulator' && (
        <>
          {/* Scenario Selector Bar - Sleek Segment Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scenarios:</span>
              <div className="inline-flex p-1 bg-slate-100 rounded-lg">
                {simulations.map((sim, index) => {
                  const isActive = index === activeSimIndex;
                  return (
                    <button
                      key={sim.id || index}
                      onClick={() => handleSelectSimTab(index)}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>{sim.name}</span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {simulations.length < 3 ? (
                <button
                  onClick={handleCreateNewSimulation}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200 transition-all cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Simulation ({simulations.length}/3)
                </button>
              ) : (
                <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-lg">
                  Max 3 Simulations Reached
                </span>
              )}

              <button
                onClick={handleDuplicateSimulation}
                disabled={saving || simulations.length >= 3}
                className="p-1.5 rounded-lg text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer disabled:opacity-40 shadow-2xs"
                title="Duplicate Current Simulation"
              >
                <Copy className="w-4 h-4" />
              </button>

              {simulations.length > 1 && (
                <button
                  onClick={handleDeleteSimulation}
                  disabled={saving}
                  className="p-1.5 rounded-lg text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 transition-all cursor-pointer shadow-2xs"
                  title="Delete Current Simulation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Main Even 50/50 Split Workspace with Clean Vertical Divider */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2 items-start">
            
            {/* LEFT PANEL: Carrier Inputs & Baseline Parameters (Even 50% Width) */}
            <div className="space-y-6 pr-0 lg:pr-2">

              {/* Active Simulation Header & Baseline Controls */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  {isEditingName ? (
                    <div className="flex items-center gap-2 w-full max-w-md">
                      <input
                        type="text"
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        className="px-3 py-1.5 text-sm font-bold border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        placeholder="Simulation Name"
                      />
                      <button
                        onClick={() => {
                          setIsEditingName(false);
                          triggerLocalRecalculate(draftOutgoingMins, draftIncomingMins, draftOutgoingRevRate, draftCarriers);
                        }}
                        className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">{draftName}</h3>
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded transition-all"
                        title="Rename Simulation"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <span className="text-xs font-medium text-slate-500">
                    Independent Scenario
                  </span>
                </div>

                {/* Baseline Traffic & Price Parameters */}
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

              {/* Dynamic Carrier Shares & Rates Section - Clean Table Layout */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">Carrier Shares & Commercial Rates</h3>
                  </div>

                  <button
                    onClick={handleAddCarrier}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Carrier
                  </button>
                </div>

                {/* Shares Totals Status */}
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
                              className="px-2.5 py-1 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none w-full"
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

            {/* RIGHT PANEL: Simulated Results Workspace (Even 50% Width with Vertical Split Line) */}
            <div className="space-y-6 pl-0 lg:pl-8 lg:border-l lg:border-slate-200">

              {/* Simulation Overall KPI Summary Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">Simulation Summary Results</h3>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    Real-Time
                  </span>
                </div>

                {activeSim && activeSim.totals ? (
                  <div className="space-y-5">
                    {/* Net Commercial Profit Metric */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                          Net Commercial Profit
                        </span>
                        <span className={`text-2xl font-extrabold ${activeSim.totals.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          ${activeSim.totals.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full ${
                        activeSim.totals.netProfit >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {activeSim.totals.netProfit >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                        {activeSim.totals.profitMarginPct.toFixed(2)}% Margin
                      </span>
                    </div>

                    {/* Clean 2-Column Financial Breakdown Grid */}
                    <div className="grid grid-cols-2 gap-y-4 gap-x-6 py-2">
                      <div>
                        <span className="text-[11px] font-medium text-slate-500 block">Total Revenue</span>
                        <span className="text-base font-bold text-blue-700">
                          ${activeSim.totals.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] font-medium text-slate-500 block">Total Wholesale Cost</span>
                        <span className="text-base font-bold text-rose-600">
                          ${activeSim.totals.totalWholesaleCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[11px] font-medium text-slate-500 block">Incoming Revenue</span>
                        <span className="text-sm font-semibold text-slate-800">
                          ${activeSim.totals.totalIncomingRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[11px] font-medium text-slate-500 block">Subscriber Revenue</span>
                        <span className="text-sm font-semibold text-slate-800">
                          ${activeSim.totals.totalSubscriberRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[11px] font-medium text-slate-500 block">Total Incoming Mins</span>
                        <span className="text-sm font-semibold text-teal-700">
                          {activeSim.totals.totalIncomingTraffic.toLocaleString('en-US')} mins
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[11px] font-medium text-slate-500 block">Total Outgoing Mins</span>
                        <span className="text-sm font-semibold text-blue-700">
                          {activeSim.totals.totalOutgoingTraffic.toLocaleString('en-US')} mins
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 py-8 text-center">No calculated results</div>
                )}
              </div>

              {/* Carrier Level Breakdown Table */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-purple-600" />
                    <h3 className="text-sm font-bold text-slate-900">Carrier Breakdown</h3>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    {activeSim?.carrierResults?.length || 0} Carriers
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-2">Carrier</th>
                        <th className="py-2 text-right">Out Mins</th>
                        <th className="py-2 text-right">Inc Mins</th>
                        <th className="py-2 text-right">Revenue</th>
                        <th className="py-2 text-right">Cost</th>
                        <th className="py-2 text-right">Profit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {activeSim?.carrierResults?.map((cr, idx) => (
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
                          <td className="py-2 text-right font-bold text-teal-700">
                            {cr.calculatedIncomingTraffic.toLocaleString('en-US')}
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
        </>
      )}

      {/* MODE 2: Side-by-Side Simulation Comparison Matrix */}
      {workspaceMode === 'comparison' && (
        <SimulationComparisonMatrix
          simulations={simulations}
          onSelectSimulationToCopy={(simId) => handleCopySimulationToFinalScenario(simId)}
        />
      )}

      {/* MODE 3: Final Scenario Consolidated Decision Workspace */}
      {workspaceMode === 'final' && (
        <FinalScenarioWorkspace
          simulations={simulations}
          onFinalScenarioUpdated={fetchSimulations}
          onProceedToApproval={(scen) => {
            setActiveFinalScenario(scen);
            setWorkspaceMode('decision');
          }}
        />
      )}

      {/* MODE 4: Final Decision & Formal Business Approval Page */}
      {workspaceMode === 'decision' && (
        <FinalDecisionApprovalPage
          finalScenario={activeFinalScenario}
          onBackToFinalScenario={() => setWorkspaceMode('final')}
          onApprovalSuccess={fetchSimulations}
          onRedirectToHistory={() => setWorkspaceMode('history')}
        />
      )}

      {/* MODE 5: Approval History Repository */}
      {workspaceMode === 'history' && (
        <ApprovalHistoryWorkspace />
      )}

      {/* MODE: Commercial Scenario Visualizations */}
      {workspaceMode === 'visualizations' && (
        <SimulationVisualizations
          simulations={simulations}
          finalScenario={activeFinalScenario}
        />
      )}

      {/* MODE: AI Suggestion Tab */}
      {workspaceMode === 'ai-suggestion' && (
        <SimulationComparisonMatrix
          simulations={simulations}
          onSelectSimulationToCopy={(simId) => handleCopySimulationToFinalScenario(simId)}
        />
      )}
    </div>
  );
};

export default CarrierSimulationWorkspace;
