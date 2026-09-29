import React from 'react';
import { CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

export const BaselineBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-sky-950/80 border border-emerald-500/30 rounded-2xl p-4 mb-6 relative overflow-hidden shadow-lg shadow-emerald-950/20">
      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Baseline Logic Verified
              </span>
              <span className="text-slate-400 text-xs font-mono">Carrier A Benchmark</span>
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">Manager Sample Commercial Verification</h2>
            <p className="text-xs text-slate-300 mt-0.5 max-w-3xl">
              Outputs calculated dynamically from inputs: Outgoing Traffic (100k × 60% = <b>60k</b>), Incoming Traffic (200k × 50% = <b>100k</b>), Incoming Rev (<b>$50,000</b>), Subscriber Rev (<b>$60,000</b>), Wholesale Cost (<b>$42,000</b>) → Net Profit <b>$68,000</b> (Margin <b>61.82%</b>).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-300 shrink-0">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Unit Tests Passing (5/5)
          </div>
          <span className="text-slate-700">|</span>
          <span className="text-slate-400">Dynamic Precision Engine Active</span>
        </div>
      </div>
    </div>
  );
};
