import React, { useState, useEffect } from 'react';
import { Sliders, RefreshCw, Calculator, ShieldAlert } from 'lucide-react';

interface SimulationState {
  outgoingMinutes: number;
  incomingMinutes: number;
  outgoingShare: number;
  incomingShare: number;
  incomingRevenueRate: number;
  outgoingCostRate: number;
  outgoingRevenueRate: number;
  interconnectCostRate: number;
  cableCapacityCost: number;
}

export const SimulationPanel: React.FC = () => {
  const [params, setParams] = useState<SimulationState>({
    outgoingMinutes: 100000,
    incomingMinutes: 200000,
    outgoingShare: 60,
    incomingShare: 50,
    incomingRevenueRate: 50,
    outgoingCostRate: 70,
    outgoingRevenueRate: 1.0,
    interconnectCostRate: 0,
    cableCapacityCost: 0
  });

  const [simResult, setSimResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculateSimulation = async (p: SimulationState) => {
    setLoading(true);
    try {
      const res = await fetch('/api/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      });
      const data = await res.json();
      setSimResult(data);
    } catch (err) {
      console.error('Simulation calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateSimulation(params);
  }, [params]);

  const handleInputChange = (field: keyof SimulationState, val: number) => {
    setParams(prev => ({
      ...prev,
      [field]: val
    }));
  };

  const resetToManagerBaseline = () => {
    setParams({
      outgoingMinutes: 100000,
      incomingMinutes: 200000,
      outgoingShare: 60,
      incomingShare: 50,
      incomingRevenueRate: 50,
      outgoingCostRate: 70,
      outgoingRevenueRate: 1.0,
      interconnectCostRate: 0,
      cableCapacityCost: 0
    });
  };

  return (
    <div className="card-panel rounded-xl p-6 border border-slate-200 shadow-sm bg-white mb-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Commercial Scenario Simulator</h3>
            <p className="text-xs text-slate-500">Adjust commercial assumptions to understand their impact on revenue, cost and profitability.</p>
          </div>
        </div>

        <button
          onClick={resetToManagerBaseline}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reset Assumptions
        </button>
      </div>

      {/* Business Note */}
      <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center justify-between">
        <span className="font-medium">Simulation only — does not modify imported data.</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Assumptions (Left Column) */}
        <div className="lg:col-span-7 bg-slate-50 p-5 rounded-lg border border-slate-200">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 pb-2 border-b border-slate-200">
            Input Assumptions
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Outgoing Mins */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-600 font-semibold">Outgoing Minutes</span>
                <span className="text-blue-700 font-bold">{params.outgoingMinutes.toLocaleString('en-US')}</span>
              </div>
              <input
                type="range"
                min="10000"
                max="500000"
                step="5000"
                value={params.outgoingMinutes}
                onChange={(e) => handleInputChange('outgoingMinutes', Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Incoming Mins */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-600 font-semibold">Incoming Minutes</span>
                <span className="text-teal-700 font-bold">{params.incomingMinutes.toLocaleString('en-US')}</span>
              </div>
              <input
                type="range"
                min="10000"
                max="500000"
                step="5000"
                value={params.incomingMinutes}
                onChange={(e) => handleInputChange('incomingMinutes', Number(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
            </div>

            {/* Outgoing Share */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-600 font-semibold">Outgoing Share %</span>
                <span className="text-blue-700 font-bold">{params.outgoingShare}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={params.outgoingShare}
                onChange={(e) => handleInputChange('outgoingShare', Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Incoming Share */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-600 font-semibold">Incoming Share %</span>
                <span className="text-teal-700 font-bold">{params.incomingShare}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={params.incomingShare}
                onChange={(e) => handleInputChange('incomingShare', Number(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
            </div>

            {/* Subscriber Price Per Min */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-600 font-semibold">Subscriber Price / Min</span>
                <span className="text-slate-800 font-bold">${params.outgoingRevenueRate.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="5.00"
                step="0.05"
                value={params.outgoingRevenueRate}
                onChange={(e) => handleInputChange('outgoingRevenueRate', Number(e.target.value))}
                className="w-full accent-slate-800 cursor-pointer"
              />
            </div>

            {/* Outgoing Cost Rate */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-600 font-semibold">Wholesale Cost Rate %</span>
                <span className="text-rose-600 font-bold">{params.outgoingCostRate}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="150"
                step="5"
                value={params.outgoingCostRate}
                onChange={(e) => handleInputChange('outgoingCostRate', Number(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Simulated Results (Right Column) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-purple-600" /> Simulated Results
              </h4>
              <span className="text-[11px] text-slate-400 font-medium">Real-Time</span>
            </div>

            {simResult ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">Total Revenue:</span>
                  <span className="font-bold text-blue-600 text-sm">${simResult.totalRevenue.toLocaleString('en-US')}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">Total Cost:</span>
                  <span className="font-bold text-rose-600 text-sm">${simResult.totalCost.toLocaleString('en-US')}</span>
                </div>

                <div className="pt-3 border-t border-slate-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">Net Profit:</span>
                    <span className={`text-xl font-extrabold ${simResult.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      ${simResult.netProfit.toLocaleString('en-US')}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-slate-500 font-semibold">Profit Margin:</span>
                  <span className={`font-bold text-sm ${simResult.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {simResult.profitMarginPct}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-8 text-center">Calculating scenario...</div>
            )}
          </div>

          {/* Break-even point card */}
          {simResult && (
            <div className="mt-5 p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-700">Break-Even Subscriber Rate</div>
                  <div className="text-[11px] text-slate-500">Rate required for Revenue = Cost</div>
                </div>
              </div>
              <span className="font-bold text-slate-900 text-sm">
                ${simResult.breakEvenSubscriberRate.toFixed(2)}/min
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
