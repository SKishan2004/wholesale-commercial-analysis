import React from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PhoneOutgoing,
  PhoneIncoming,
  Scale,
  Percent,
  Activity,
  Receipt,
  PiggyBank,
  Layers
} from 'lucide-react';

export interface KpiData {
  recordCount: number;
  totalIncomingMins: number;
  totalOutgoingMins: number;
  totalCalcIncomingMins: number;
  totalCalcOutgoingMins: number;
  totalIncomingRev: number;
  totalSubscriberRev: number;
  totalRevenue: number;
  wholesaleCost: number;
  totalCost: number;
  grossProfit: number;
  netProfit: number;
  marginPct: number;
  avgRevPerMin: number;
  avgCostPerMin: number;
}

interface KpiCardsProps {
  data: KpiData;
  loading?: boolean;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ data, loading }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('en-US').format(Math.round(val || 0));
  };

  const isProfitable = data.netProfit >= 0;

  if (loading) {
    return (
      <div className="space-y-6 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card-panel rounded-xl p-5 h-32 skeleton-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-8">
      {/* 1. PRIMARY FINANCIAL METRICS (Uniform 4-Column Grid) */}
      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Primary Financial Metrics</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <div className="card-panel rounded-xl p-5 border border-slate-200 shadow-sm bg-white hover:border-blue-300 transition-all flex flex-col justify-between h-32">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Revenue</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {formatCurrency(data.totalRevenue)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Subscriber & Incoming Rev</p>
            </div>
          </div>

          {/* Total Cost */}
          <div className="card-panel rounded-xl p-5 border border-slate-200 shadow-sm bg-white hover:border-rose-300 transition-all flex flex-col justify-between h-32">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Cost</span>
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                <Scale className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {formatCurrency(data.totalCost)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Wholesale Outgoing Cost</p>
            </div>
          </div>

          {/* Net Profit / Loss */}
          <div className={`card-panel rounded-xl p-5 border shadow-sm ${isProfitable ? 'border-emerald-200 bg-emerald-50/30 hover:border-emerald-300' : 'border-rose-200 bg-rose-50/30 hover:border-rose-300'} transition-all flex flex-col justify-between h-32`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Net Profit / Loss</span>
              <div className={`p-2 rounded-lg ${isProfitable ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {isProfitable ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              </div>
            </div>
            <div>
              <div className={`text-2xl font-extrabold tracking-tight ${isProfitable ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(data.netProfit)}
              </div>
              <p className="text-xs text-slate-600 mt-1 font-medium">Revenue minus Wholesale Cost</p>
            </div>
          </div>

          {/* Profit Margin % */}
          <div className="card-panel rounded-xl p-5 border border-slate-200 shadow-sm bg-white hover:border-purple-300 transition-all flex flex-col justify-between h-32">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Profit Margin</span>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <Percent className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className={`text-2xl font-extrabold tracking-tight ${isProfitable ? 'text-emerald-600' : 'text-rose-600'}`}>
                {`${data.marginPct}%`}
              </div>
              <p className="text-xs text-slate-500 mt-1">Net Margin Percentage</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SECONDARY COMMERCIAL & TRAFFIC METRICS (Uniform 4-Column Grid) */}
      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Secondary Commercial & Traffic Metrics</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Subscriber Revenue */}
          <div className="card-panel rounded-xl p-5 border border-slate-200 shadow-sm bg-white hover:border-blue-300 transition-all flex flex-col justify-between h-32">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Subscriber Rev</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-800 tracking-tight">
                {formatCurrency(data.totalSubscriberRev)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Outgoing Subscriber Billings</p>
            </div>
          </div>

          {/* Incoming Revenue */}
          <div className="card-panel rounded-xl p-5 border border-slate-200 shadow-sm bg-white hover:border-teal-300 transition-all flex flex-col justify-between h-32">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Incoming Rev</span>
              <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-800 tracking-tight">
                {formatCurrency(data.totalIncomingRev)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Wholesale Incoming Settlements</p>
            </div>
          </div>

          {/* Total Incoming Traffic */}
          <div className="card-panel rounded-xl p-5 border border-slate-200 shadow-sm bg-white hover:border-emerald-300 transition-all flex flex-col justify-between h-32">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Incoming Traffic</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <PhoneIncoming className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-800 tracking-tight">
                {formatNumber(data.totalCalcIncomingMins)} <span className="text-xs font-semibold text-slate-500">mins</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Raw: {formatNumber(data.totalIncomingMins)} mins</p>
            </div>
          </div>

          {/* Total Outgoing Traffic */}
          <div className="card-panel rounded-xl p-5 border border-slate-200 shadow-sm bg-white hover:border-sky-300 transition-all flex flex-col justify-between h-32">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Outgoing Traffic</span>
              <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
                <PhoneOutgoing className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-800 tracking-tight">
                {formatNumber(data.totalCalcOutgoingMins)} <span className="text-xs font-semibold text-slate-500">mins</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Raw: {formatNumber(data.totalOutgoingMins)} mins</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. UNIT ECONOMICS & RATES (Uniform 4-Column Grid) */}
      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Unit Economics & Commercial Rates</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Gross Profit */}
          <div className="card-panel rounded-xl p-5 border border-slate-200 shadow-sm bg-white hover:border-emerald-300 transition-all flex flex-col justify-between h-32">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Gross Profit</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <PiggyBank className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-800 tracking-tight">
                {formatCurrency(data.grossProfit)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Total Revenue - Wholesale Cost</p>
            </div>
          </div>

          {/* Average Revenue Per Minute */}
          <div className="card-panel rounded-xl p-5 border border-slate-200 shadow-sm bg-white hover:border-blue-300 transition-all flex flex-col justify-between h-32">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Avg Rev / Min</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-blue-600 tracking-tight">
                ${data.avgRevPerMin}
              </div>
              <p className="text-xs text-slate-500 mt-1">Revenue per Outgoing Minute</p>
            </div>
          </div>

          {/* Average Cost Per Minute */}
          <div className="card-panel rounded-xl p-5 border border-slate-200 shadow-sm bg-white hover:border-rose-300 transition-all flex flex-col justify-between h-32">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Avg Cost / Min</span>
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                <Scale className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-rose-600 tracking-tight">
                ${data.avgCostPerMin}
              </div>
              <p className="text-xs text-slate-500 mt-1">Wholesale Cost per Minute</p>
            </div>
          </div>

          {/* Total Transactions / Records */}
          <div className="card-panel rounded-xl p-5 border border-slate-200 shadow-sm bg-white hover:border-indigo-300 transition-all flex flex-col justify-between h-32">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Records</span>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-800 tracking-tight">
                {formatNumber(data.recordCount)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Active Commercial Records</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
