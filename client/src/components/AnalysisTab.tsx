import React from 'react';
import { DollarSign, Scale, TrendingUp, TrendingDown, Building2, Truck, Globe } from 'lucide-react';

interface OperatorProfitItem {
  operator: string;
  traffic?: number;
  revenue: number;
  cost: number;
  profit: number;
  marginPct: number;
}

interface RouteProfitabilityItem {
  route: string;
  traffic?: number;
  revenue: number;
  cost: number;
  profit: number;
  marginPct: number;
}

interface AnalysisTabProps {
  summaryData: any;
  profitByOperator: OperatorProfitItem[];
  routeProfitability: RouteProfitabilityItem[];
  loading?: boolean;
}

export const AnalysisTab: React.FC<AnalysisTabProps> = ({
  summaryData,
  profitByOperator,
  routeProfitability,
  loading
}) => {
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

  return (
    <div className="space-y-6 mb-8">
      {/* Executive Financial Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Revenue Breakdown */}
        <div className="card-panel rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-800 text-sm">Revenue Analysis</h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Subscriber Revenue:</span>
              <span className="font-semibold text-slate-800">{formatCurrency(summaryData.totalSubscriberRev)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Incoming Revenue:</span>
              <span className="font-semibold text-slate-800">{formatCurrency(summaryData.totalIncomingRev)}</span>
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700">Total Revenue:</span>
              <span className="text-base font-bold text-blue-600">{formatCurrency(summaryData.totalRevenue)}</span>
            </div>
          </div>
        </div>

        {/* 2. Cost Breakdown */}
        <div className="card-panel rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-800 text-sm">Cost Analysis</h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Wholesale Outgoing Cost:</span>
              <span className="font-semibold text-slate-800">{formatCurrency(summaryData.wholesaleCost)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Avg Cost / Outgoing Min:</span>
              <span className="font-semibold text-slate-800">${summaryData.avgCostPerMin}</span>
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700">Total Cost:</span>
              <span className="text-base font-bold text-rose-600">{formatCurrency(summaryData.totalCost)}</span>
            </div>
          </div>
        </div>

        {/* 3. Profitability Metrics */}
        <div className="card-panel rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-800 text-sm">Profitability Analysis</h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Gross Profit:</span>
              <span className="font-semibold text-slate-800">{formatCurrency(summaryData.grossProfit)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Profit Margin %:</span>
              <span className={`font-bold ${summaryData.marginPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {summaryData.marginPct}%
              </span>
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700">Net Profit / Loss:</span>
              <span className={`text-base font-bold ${summaryData.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(summaryData.netProfit)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Operator Commercial Performance Table */}
      <div className="card-panel rounded-xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-4 h-4 text-slate-600" />
          <h3 className="font-semibold text-slate-800 text-sm">Operator Commercial Performance</h3>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Operator</th>
                <th className="py-2.5 px-4 text-right">Revenue ($)</th>
                <th className="py-2.5 px-4 text-right">Cost ($)</th>
                <th className="py-2.5 px-4 text-right">Net Profit ($)</th>
                <th className="py-2.5 px-4 text-right">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {profitByOperator.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    No operator data matching active filters
                  </td>
                </tr>
              ) : (
                profitByOperator.map((op, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-slate-800">{op.operator}</td>
                    <td className="py-2.5 px-4 text-right font-medium text-slate-800">{formatCurrency(op.revenue)}</td>
                    <td className="py-2.5 px-4 text-right font-medium text-rose-600">{formatCurrency(op.cost)}</td>
                    <td className={`py-2.5 px-4 text-right font-bold ${op.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatCurrency(op.profit)}
                    </td>
                    <td className={`py-2.5 px-4 text-right font-bold ${op.marginPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {op.marginPct}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Destination Route Performance Table */}
      <div className="card-panel rounded-xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-slate-600" />
          <h3 className="font-semibold text-slate-800 text-sm">Destination Route Commercial Performance</h3>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Route Code / Destination</th>
                <th className="py-2.5 px-4 text-right">Revenue ($)</th>
                <th className="py-2.5 px-4 text-right">Cost ($)</th>
                <th className="py-2.5 px-4 text-right">Net Profit ($)</th>
                <th className="py-2.5 px-4 text-right">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {routeProfitability.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    No route data matching active filters
                  </td>
                </tr>
              ) : (
                routeProfitability.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-slate-800">{r.route}</td>
                    <td className="py-2.5 px-4 text-right font-medium text-slate-800">{formatCurrency(r.revenue)}</td>
                    <td className="py-2.5 px-4 text-right font-medium text-rose-600">{formatCurrency(r.cost)}</td>
                    <td className={`py-2.5 px-4 text-right font-bold ${r.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatCurrency(r.profit)}
                    </td>
                    <td className={`py-2.5 px-4 text-right font-bold ${r.marginPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {r.marginPct}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
