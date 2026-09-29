import React from 'react';
import { X, Calculator, ShieldCheck, DollarSign, Scale } from 'lucide-react';

export interface AuditRecord {
  date: string;
  customer: string;
  operator: string;
  carrier: string;
  route: string;
  country: string;
  outgoingMins: number;
  incomingMins: number;
  outgoingShare: number;
  incomingShare: number;
  calcOutgoingTraffic: number;
  calcIncomingTraffic: number;
  incRevRate: number;
  outCostRate: number;
  outRevRate: number;
  incomingRevenue: number;
  subscriberRevenue: number;
  totalRevenue: number;
  wholesaleCost: number;
  totalCost: number;
  grossProfit: number;
  netProfit: number;
  marginPct: number;
}

interface CalculationBreakdownModalProps {
  record: AuditRecord | null;
  onClose: () => void;
}

export const CalculationBreakdownModal: React.FC<CalculationBreakdownModalProps> = ({ record, onClose }) => {
  if (!record) return null;

  const formatCurrency = (val: number) => `$${new Intl.NumberFormat('en-US').format(val)}`;
  const formatNumber = (val: number) => `${new Intl.NumberFormat('en-US').format(val)} mins`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Commercial Calculation Breakdown
              </h3>
              <p className="text-xs text-slate-500">{record.operator} • {record.route} ({record.date})</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white text-slate-400 hover:text-slate-700 border border-slate-200 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Metadata Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block">Customer</span>
              <span className="text-slate-800 font-semibold">{record.customer}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Carrier</span>
              <span className="text-slate-800 font-semibold">{record.carrier}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Destination</span>
              <span className="text-slate-800 font-semibold">{record.country}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Route Code</span>
              <span className="text-slate-800 font-semibold">{record.route}</span>
            </div>
          </div>

          {/* STEP 1: Traffic Volume Derivation */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> 1. Derived Traffic Volumes
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div className="text-slate-500 mb-1">Outgoing Traffic</div>
                <div className="font-bold text-blue-700 text-sm mb-1">
                  {formatNumber(record.calcOutgoingTraffic)}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {formatNumber(record.outgoingMins)} × {(record.outgoingShare * 100).toFixed(0)}% Share
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div className="text-slate-500 mb-1">Incoming Traffic</div>
                <div className="font-bold text-teal-700 text-sm mb-1">
                  {formatNumber(record.calcIncomingTraffic)}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {formatNumber(record.incomingMins)} × {(record.incomingShare * 100).toFixed(0)}% Share
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2: Revenue Derivation */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-blue-600" /> 2. Revenue Component Breakdown
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div className="text-slate-500 mb-1">Subscriber Revenue</div>
                <div className="font-semibold text-slate-800 text-sm mb-1">{formatCurrency(record.subscriberRevenue)}</div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {formatNumber(record.calcOutgoingTraffic)} × ${record.outRevRate.toFixed(2)}/min
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div className="text-slate-500 mb-1">Incoming Revenue</div>
                <div className="font-semibold text-slate-800 text-sm mb-1">{formatCurrency(record.incomingRevenue)}</div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {formatNumber(record.calcIncomingTraffic)} × {(record.incRevRate * 100).toFixed(0)}% Rate
                </div>
              </div>

              <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 text-xs">
                <div className="text-blue-800 font-semibold mb-1">Total Revenue</div>
                <div className="font-bold text-blue-700 text-base mb-1">{formatCurrency(record.totalRevenue)}</div>
                <div className="text-[11px] text-blue-600">Subscriber Rev + Incoming Rev</div>
              </div>
            </div>
          </div>

          {/* STEP 3: Cost Derivation */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-rose-600" /> 3. Wholesale Cost Derivation
            </h4>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex justify-between items-center">
              <div>
                <div className="text-slate-600 font-medium">Wholesale Base Outgoing Cost</div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {formatNumber(record.calcOutgoingTraffic)} × {(record.outCostRate * 100).toFixed(0)}% Cost Rate
                </div>
              </div>
              <div className="font-bold text-rose-600 text-base">{formatCurrency(record.wholesaleCost)}</div>
            </div>
          </div>

          {/* STEP 4: Net Commercial Profit & Margin */}
          <div className={`p-4 rounded-lg border ${record.netProfit >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'} flex items-center justify-between`}>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">Net Commercial Profit</span>
              <div className="text-[11px] text-slate-600">Total Revenue ({formatCurrency(record.totalRevenue)}) - Wholesale Cost ({formatCurrency(record.wholesaleCost)})</div>
            </div>
            <div className="text-right">
              <div className={`text-xl font-bold ${record.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {formatCurrency(record.netProfit)}
              </div>
              <div className="text-xs font-semibold text-emerald-700">Margin: {record.marginPct}%</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-all"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};
