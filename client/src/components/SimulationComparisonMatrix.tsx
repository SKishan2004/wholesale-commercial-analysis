import React from 'react';
import { Columns, ArrowRight, CheckCircle2 } from 'lucide-react';
import { SimulationModel } from './CarrierSimulationWorkspace';
import { AiRecommendationBanner } from './AiRecommendationBanner';

interface SimulationComparisonMatrixProps {
  simulations: SimulationModel[];
  onSelectSimulationToCopy?: (simId: string, simName: string) => void;
}

export const SimulationComparisonMatrix: React.FC<SimulationComparisonMatrixProps> = ({
  simulations,
  onSelectSimulationToCopy
}) => {
  if (!simulations || simulations.length === 0) return null;

  // Extract all unique carrier names across all simulations
  const allCarrierNames = Array.from(
    new Set(
      simulations.flatMap(sim =>
        (sim.carrierResults || []).map(c => c.carrierName)
      )
    )
  );

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Columns className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Commercial Simulation Comparison Matrix</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Side-by-side comparison of calculated financial performance across independent simulations
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          Comparing {simulations.length} Scenarios
        </span>
      </div>

      {/* AI Recommendation Feature Banner */}
      <AiRecommendationBanner
        simulations={simulations}
        onUseSuggestedSimulation={(simId, simName) => {
          if (onSelectSimulationToCopy) {
            onSelectSimulationToCopy(simId, simName);
          }
        }}
      />

      {/* Side-by-Side Summary Performance Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4 w-1/4">Commercial Metric</th>
              {simulations.map((sim, idx) => (
                <th key={sim.id || idx} className="py-3 px-4 text-right">
                  <div className="font-extrabold text-white">{sim.name}</div>
                  <div className="text-[10px] text-slate-300 font-normal uppercase tracking-normal">
                    {sim.carrierResults?.length || 0} Carriers
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
            {/* Total Revenue */}
            <tr className="hover:bg-slate-50 transition-colors">
              <td className="py-3 px-4 text-slate-600">Total Revenue</td>
              {simulations.map((sim, idx) => (
                <td key={sim.id || idx} className="py-3 px-4 text-right font-bold text-blue-700">
                  ${sim.totals.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
              ))}
            </tr>

            {/* Total Wholesale Cost */}
            <tr className="hover:bg-slate-50 transition-colors">
              <td className="py-3 px-4 text-slate-600">Total Wholesale Cost</td>
              {simulations.map((sim, idx) => (
                <td key={sim.id || idx} className="py-3 px-4 text-right font-bold text-rose-600">
                  ${sim.totals.totalWholesaleCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
              ))}
            </tr>

            {/* Net Commercial Profit */}
            <tr className="bg-slate-50/80 hover:bg-slate-100 transition-colors">
              <td className="py-3.5 px-4 font-extrabold text-slate-900">Net Profit / Loss</td>
              {simulations.map((sim, idx) => (
                <td key={sim.id || idx} className="py-3.5 px-4 text-right">
                  <span className={`text-sm font-black ${sim.totals.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    ${sim.totals.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </td>
              ))}
            </tr>

            {/* Profit Margin % */}
            <tr className="hover:bg-slate-50 transition-colors">
              <td className="py-3 px-4 text-slate-600">Profit Margin %</td>
              {simulations.map((sim, idx) => (
                <td key={sim.id || idx} className="py-3 px-4 text-right font-bold">
                  <span className={`inline-block px-2 py-0.5 rounded ${sim.totals.profitMarginPct >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {sim.totals.profitMarginPct.toFixed(2)}%
                  </span>
                </td>
              ))}
            </tr>

            {/* Outgoing Traffic */}
            <tr className="hover:bg-slate-50 transition-colors">
              <td className="py-3 px-4 text-slate-600">Total Outgoing Traffic</td>
              {simulations.map((sim, idx) => (
                <td key={sim.id || idx} className="py-3 px-4 text-right font-mono text-blue-700">
                  {sim.totals.totalOutgoingTraffic.toLocaleString('en-US')} mins
                </td>
              ))}
            </tr>

            {/* Incoming Traffic */}
            <tr className="hover:bg-slate-50 transition-colors">
              <td className="py-3 px-4 text-slate-600">Total Incoming Traffic</td>
              {simulations.map((sim, idx) => (
                <td key={sim.id || idx} className="py-3 px-4 text-right font-mono text-teal-700">
                  {sim.totals.totalIncomingTraffic.toLocaleString('en-US')} mins
                </td>
              ))}
            </tr>

            {/* Quick Action Button Row */}
            {onSelectSimulationToCopy && (
              <tr className="bg-slate-50 border-t border-slate-200">
                <td className="py-3 px-4 font-bold text-slate-700">Consolidate to Final Scenario</td>
                {simulations.map((sim, idx) => (
                  <td key={sim.id || idx} className="py-3 px-4 text-right">
                    <button
                      onClick={() => onSelectSimulationToCopy(sim.id!, sim.name)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all cursor-pointer"
                    >
                      Use {sim.name} <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Carrier-Level Comparative Matrix Breakdown */}
      {allCarrierNames.length > 0 && (
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Carrier-Level Comparative Breakdown
          </h4>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <th className="py-2.5 px-4">Carrier / Metric</th>
                  {simulations.map((sim, idx) => (
                    <th key={sim.id || idx} className="py-2.5 px-4 text-right">
                      {sim.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {allCarrierNames.map(carrierName => {
                  return (
                    <React.Fragment key={carrierName}>
                      <tr className="bg-slate-50/60 font-extrabold text-slate-900 border-t border-slate-200">
                        <td colSpan={simulations.length + 1} className="py-2 px-4 text-blue-700">
                          {carrierName}
                        </td>
                      </tr>
                      {/* Carrier Outgoing Traffic */}
                      <tr>
                        <td className="py-2 px-4 text-slate-500 pl-8">Outgoing Share & Traffic</td>
                        {simulations.map((sim, idx) => {
                          const cr = sim.carrierResults.find(c => c.carrierName === carrierName);
                          return (
                            <td key={sim.id || idx} className="py-2 px-4 text-right font-mono">
                              {cr ? `${cr.outgoingSharePct}% (${cr.calculatedOutgoingTraffic.toLocaleString('en-US')} mins)` : 'N/A'}
                            </td>
                          );
                        })}
                      </tr>
                      {/* Carrier Net Profit */}
                      <tr>
                        <td className="py-2 px-4 text-slate-500 pl-8">Net Profit ($)</td>
                        {simulations.map((sim, idx) => {
                          const cr = sim.carrierResults.find(c => c.carrierName === carrierName);
                          return (
                            <td key={sim.id || idx} className="py-2 px-4 text-right font-bold">
                              {cr ? (
                                <span className={cr.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                                  ${cr.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                              ) : 'N/A'}
                            </td>
                          );
                        })}
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationComparisonMatrix;
