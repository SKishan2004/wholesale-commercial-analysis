import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Bot } from 'lucide-react';
import { SimulationModel } from './CarrierSimulationWorkspace';
import { safeParseJson } from '../utils/apiUtils';

export interface AiRecommendationResponse {
  available: boolean;
  suggestedSimulationId?: string;
  suggestedSimulationName?: string;
  reason?: string;
  message?: string;
}

interface AiRecommendationBannerProps {
  simulations: SimulationModel[];
  onUseSuggestedSimulation?: (simulationId: string, simulationName: string) => void;
  className?: string;
}

export const AiRecommendationBanner: React.FC<AiRecommendationBannerProps> = ({
  simulations,
  onUseSuggestedSimulation,
  className = ''
}) => {
  const [recommendation, setRecommendation] = useState<AiRecommendationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copying, setCopying] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const fetchRecommendation = async () => {
      if (!simulations || simulations.length === 0) {
        setRecommendation({ available: false, message: 'AI recommendation unavailable' });
        return;
      }

      setLoading(true);
      try {
        const res = await fetch('/api/simulations/recommendation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ simulations })
        });

        if (!res.ok) {
          if (isMounted) {
            setRecommendation({ available: false, message: 'AI recommendation unavailable' });
          }
          return;
        }

        const data: AiRecommendationResponse = await safeParseJson(res, {
          available: false,
          message: 'AI recommendation unavailable'
        });

        if (isMounted) {
          setRecommendation(data);
        }
      } catch (err) {
        console.error('Failed to fetch AI recommendation:', err);
        if (isMounted) {
          setRecommendation({ available: false, message: 'AI recommendation unavailable' });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRecommendation();

    return () => {
      isMounted = false;
    };
  }, [simulations]);

  if (loading) {
    return (
      <div className={`p-4 rounded-xl border border-indigo-200/80 bg-indigo-50/50 text-slate-700 shadow-2xs ${className}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg animate-pulse">
            <Sparkles className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <div className="text-xs font-bold text-indigo-900">AI Commercial Recommendation Engine</div>
            <div className="text-xs text-slate-500">Comparing calculated Net Profit, Profit Margin, Total Revenue, and Total Cost...</div>
          </div>
        </div>
      </div>
    );
  }

  // If AI recommendation is unavailable
  if (!recommendation || !recommendation.available) {
    return (
      <div className={`p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 ${className}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-200/80 text-slate-500 rounded-lg">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">AI recommendation unavailable</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Financial comparison matrix metrics below remain fully calculated and operational.
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-200/60 px-2.5 py-1 rounded-md">
            AI Provider Offline / Unconfigured
          </span>
        </div>
      </div>
    );
  }

  // AI Recommendation Available - Light, neat, modern aesthetic
  const suggestedSim = simulations.find(s => s.id === recommendation.suggestedSimulationId || s.name === recommendation.suggestedSimulationName) || simulations[0];

  const handleApply = async () => {
    if (!suggestedSim?.id || !onUseSuggestedSimulation) return;
    setCopying(true);
    try {
      await onUseSuggestedSimulation(suggestedSim.id, suggestedSim.name);
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className={`p-5 rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/90 via-blue-50/50 to-slate-50 text-slate-900 shadow-2xs relative overflow-hidden ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
        <div className="space-y-2 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-700 border border-indigo-200">
              <Sparkles className="w-3 h-3 text-indigo-600" /> AI Recommendation
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Evaluated Net Profit, Profit Margin, Revenue & Cost</span>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-500">Suggested Simulation:</div>
            <h4 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              {suggestedSim.name}
            </h4>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed font-medium pt-0.5">
            {recommendation.reason}
          </p>

          {/* Key Suggested Simulation Financial Summary Badges */}
          {suggestedSim.totals && (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="text-[11px] px-2.5 py-1 bg-white text-emerald-700 font-bold border border-emerald-200 rounded-lg shadow-2xs">
                Net Profit: ${suggestedSim.totals.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] px-2.5 py-1 bg-white text-blue-700 font-bold border border-blue-200 rounded-lg shadow-2xs">
                Margin: {suggestedSim.totals.profitMarginPct.toFixed(2)}%
              </div>
              <div className="text-[11px] px-2.5 py-1 bg-white text-teal-700 font-bold border border-teal-200 rounded-lg shadow-2xs">
                Revenue: ${suggestedSim.totals.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] px-2.5 py-1 bg-white text-rose-700 font-bold border border-rose-200 rounded-lg shadow-2xs">
                Cost: ${suggestedSim.totals.totalWholesaleCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex-shrink-0 self-start md:self-center">
          <button
            onClick={handleApply}
            disabled={copying}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all cursor-pointer hover:shadow-blue-500/20 active:scale-95 disabled:opacity-50"
          >
            {copying ? (
              <span>Applying to Final Scenario...</span>
            ) : (
              <>
                <span>Use Suggested Simulation</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiRecommendationBanner;
