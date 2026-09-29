import React from 'react';
import ReactECharts from 'echarts-for-react';

interface TrafficTrendItem {
  date: string;
  incomingTraffic: number;
  outgoingTraffic: number;
}

interface OperatorTrafficItem {
  operator: string;
  incomingTraffic: number;
  outgoingTraffic: number;
}

interface OperatorShareItem {
  operator: string;
  outgoingTraffic: number;
  sharePct: number;
}

interface RevenueCostTrendItem {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
}

interface CostCategoryItem {
  category: string;
  amount: number;
}

interface OperatorProfitItem {
  operator: string;
  revenue: number;
  cost: number;
  profit: number;
  marginPct: number;
}

interface RouteProfitabilityItem {
  route: string;
  revenue: number;
  cost: number;
  profit: number;
  marginPct: number;
}

interface ProfitabilityChartsProps {
  trafficTrend: TrafficTrendItem[];
  operatorTraffic: OperatorTrafficItem[];
  operatorShare: OperatorShareItem[];
  revenueCostTrend: RevenueCostTrendItem[];
  costCategories: CostCategoryItem[];
  profitByOperator: OperatorProfitItem[];
  routeProfitability: RouteProfitabilityItem[];
  summaryData?: any;
  loading?: boolean;
}

export const ProfitabilityCharts: React.FC<ProfitabilityChartsProps> = ({
  trafficTrend,
  operatorTraffic,
  operatorShare,
  revenueCostTrend,
  costCategories,
  profitByOperator,
  routeProfitability,
  summaryData,
  loading
}) => {
  const formatCurrencyTooltip = (val: number) => `$${new Intl.NumberFormat('en-US').format(val)}`;
  const formatNumberTooltip = (val: number) => `${new Intl.NumberFormat('en-US').format(val)} mins`;

  // Common ECharts light theme options
  const lightTextStyle = { color: '#475569', fontSize: 11, fontWeight: '500' };
  const lightTitleStyle = { color: '#1e293b', fontSize: 13, fontWeight: '700' };
  const lightTooltip = {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    textStyle: { color: '#0f172a', fontSize: 12 },
    extraCssText: 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);'
  };

  // 1. Revenue vs Cost Trend
  const revCostTrendOption = {
    backgroundColor: 'transparent',
    title: { text: 'Revenue vs Cost Trend', left: 'left', textStyle: lightTitleStyle },
    tooltip: {
      ...lightTooltip,
      trigger: 'axis',
      formatter: (params: any[]) => {
        let res = `<div class="font-bold border-b border-slate-200 pb-1 mb-1 text-slate-800">${params[0].axisValue}</div>`;
        params.forEach(p => {
          res += `<div class="flex items-center justify-between gap-4 py-0.5">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${p.color};"></span>
            <span class="text-slate-600">${p.seriesName}:</span>
            <b class="text-slate-900">${formatCurrencyTooltip(p.value)}</b>
          </div>`;
        });
        return res;
      }
    },
    legend: { data: ['Revenue', 'Cost'], textStyle: lightTextStyle, right: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '18%', containLabel: true },
    xAxis: { type: 'category', data: revenueCostTrend.map(r => r.date), axisLine: { lineStyle: { color: '#cbd5e1' } }, axisLabel: lightTextStyle },
    yAxis: { type: 'value', axisLine: { lineStyle: { color: '#cbd5e1' } }, splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLabel: lightTextStyle },
    series: [
      { name: 'Revenue', type: 'line', smooth: true, data: revenueCostTrend.map(r => r.revenue), lineStyle: { width: 3, color: '#2563eb' } },
      { name: 'Cost', type: 'line', smooth: true, data: revenueCostTrend.map(r => r.cost), lineStyle: { width: 3, color: '#dc2626' } }
    ]
  };

  // 2. Profit Trend Over Time
  const profitTrendOption = {
    backgroundColor: 'transparent',
    title: { text: 'Net Profit Trend over Time', left: 'left', textStyle: lightTitleStyle },
    tooltip: {
      ...lightTooltip,
      trigger: 'axis',
      formatter: (params: any[]) => {
        const p = params[0];
        return `<div class="font-bold border-b border-slate-200 pb-1 mb-1 text-slate-800">${p.axisValue}</div>
          <div class="flex items-center gap-2">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${p.color};"></span>
            <span class="text-slate-600">Net Profit: <b class="${p.value >= 0 ? 'text-emerald-600' : 'text-rose-600'}">${formatCurrencyTooltip(p.value)}</b></span>
          </div>`;
      }
    },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '18%', containLabel: true },
    xAxis: { type: 'category', data: revenueCostTrend.map(r => r.date), axisLine: { lineStyle: { color: '#cbd5e1' } }, axisLabel: lightTextStyle },
    yAxis: { type: 'value', axisLine: { lineStyle: { color: '#cbd5e1' } }, splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLabel: lightTextStyle },
    series: [
      { name: 'Net Profit', type: 'line', smooth: true, data: revenueCostTrend.map(r => r.profit), lineStyle: { width: 3, color: '#16a34a' }, areaStyle: { opacity: 0.1, color: '#16a34a' } }
    ]
  };

  // 3. Incoming vs Outgoing Traffic Volume
  const trafficTrendOption = {
    backgroundColor: 'transparent',
    title: { text: 'Incoming vs Outgoing Traffic Volume', left: 'left', textStyle: lightTitleStyle },
    tooltip: { ...lightTooltip, trigger: 'axis' },
    legend: { data: ['Incoming Traffic', 'Outgoing Traffic'], textStyle: lightTextStyle, right: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '18%', containLabel: true },
    xAxis: { type: 'category', data: trafficTrend.map(t => t.date), axisLine: { lineStyle: { color: '#cbd5e1' } }, axisLabel: lightTextStyle },
    yAxis: { type: 'value', axisLine: { lineStyle: { color: '#cbd5e1' } }, splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLabel: lightTextStyle },
    series: [
      { name: 'Incoming Traffic', type: 'bar', data: trafficTrend.map(t => t.incomingTraffic), itemStyle: { color: '#0d9488', borderRadius: [4, 4, 0, 0] } },
      { name: 'Outgoing Traffic', type: 'bar', data: trafficTrend.map(t => t.outgoingTraffic), itemStyle: { color: '#0284c7', borderRadius: [4, 4, 0, 0] } }
    ]
  };

  // 4. Revenue Contribution Donut Chart
  const revenueContributionOption = {
    backgroundColor: 'transparent',
    title: { text: 'Revenue Contribution Breakdown', left: 'left', textStyle: lightTitleStyle },
    tooltip: { ...lightTooltip, trigger: 'item', formatter: '{b}: <b>${c}</b> ({d}%)' },
    legend: { orient: 'horizontal', bottom: 0, textStyle: lightTextStyle },
    series: [
      {
        name: 'Revenue Breakdown',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '45%'],
        itemStyle: { borderRadius: 6, borderColor: '#ffffff', borderWidth: 2 },
        label: { show: false },
        data: [
          { name: 'Subscriber Revenue', value: summaryData?.totalSubscriberRev || 60000, itemStyle: { color: '#2563eb' } },
          { name: 'Incoming Revenue', value: summaryData?.totalIncomingRev || 50000, itemStyle: { color: '#0d9488' } }
        ]
      }
    ]
  };

  // 5. Operator Profitability (Horizontal Bar)
  const operatorProfitOption = {
    backgroundColor: 'transparent',
    title: { text: 'Operator Net Profit Breakdown', left: 'left', textStyle: lightTitleStyle },
    tooltip: { ...lightTooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '5%', bottom: '10%', top: '18%', containLabel: true },
    xAxis: { type: 'value', axisLine: { lineStyle: { color: '#cbd5e1' } }, splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLabel: lightTextStyle },
    yAxis: { type: 'category', data: profitByOperator.map(o => o.operator), axisLine: { lineStyle: { color: '#cbd5e1' } }, axisLabel: lightTextStyle },
    series: [
      {
        name: 'Net Profit',
        type: 'bar',
        data: profitByOperator.map(o => o.profit),
        itemStyle: {
          color: (params: any) => params.value >= 0 ? '#16a34a' : '#dc2626',
          borderRadius: [0, 4, 4, 0]
        }
      }
    ]
  };

  // 6. Operator Margin % (Horizontal Bar)
  const operatorMarginOption = {
    backgroundColor: 'transparent',
    title: { text: 'Operator Profit Margin %', left: 'left', textStyle: lightTitleStyle },
    tooltip: { ...lightTooltip, trigger: 'axis', formatter: (params: any[]) => `${params[0].name}: <b>${params[0].value}%</b>` },
    grid: { left: '3%', right: '5%', bottom: '10%', top: '18%', containLabel: true },
    xAxis: { type: 'value', axisLine: { lineStyle: { color: '#cbd5e1' } }, splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLabel: { ...lightTextStyle, formatter: '{value}%' } },
    yAxis: { type: 'category', data: profitByOperator.map(o => o.operator), axisLine: { lineStyle: { color: '#cbd5e1' } }, axisLabel: lightTextStyle },
    series: [
      {
        name: 'Margin %',
        type: 'bar',
        data: profitByOperator.map(o => o.marginPct),
        itemStyle: { color: '#9333ea', borderRadius: [0, 4, 4, 0] }
      }
    ]
  };

  // 7. Route Profitability (Horizontal Bar)
  const routeProfitOption = {
    backgroundColor: 'transparent',
    title: { text: 'Destination Route Profitability', left: 'left', textStyle: lightTitleStyle },
    tooltip: { ...lightTooltip, trigger: 'axis' },
    grid: { left: '3%', right: '5%', bottom: '10%', top: '18%', containLabel: true },
    xAxis: { type: 'value', axisLine: { lineStyle: { color: '#cbd5e1' } }, splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLabel: lightTextStyle },
    yAxis: { type: 'category', data: routeProfitability.map(r => r.route), axisLine: { lineStyle: { color: '#cbd5e1' } }, axisLabel: lightTextStyle },
    series: [
      { name: 'Net Profit', type: 'bar', data: routeProfitability.map(r => r.profit), itemStyle: { color: '#0d9488', borderRadius: [0, 4, 4, 0] } }
    ]
  };

  // 8. Revenue vs Cost by Operator (Grouped Bar)
  const revCostByOperatorOption = {
    backgroundColor: 'transparent',
    title: { text: 'Revenue vs Cost by Operator', left: 'left', textStyle: lightTitleStyle },
    tooltip: { ...lightTooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['Revenue', 'Cost'], textStyle: lightTextStyle, right: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '18%', containLabel: true },
    xAxis: { type: 'category', data: profitByOperator.map(o => o.operator), axisLine: { lineStyle: { color: '#cbd5e1' } }, axisLabel: lightTextStyle },
    yAxis: { type: 'value', axisLine: { lineStyle: { color: '#cbd5e1' } }, splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLabel: lightTextStyle },
    series: [
      { name: 'Revenue', type: 'bar', data: profitByOperator.map(o => o.revenue), itemStyle: { color: '#2563eb', borderRadius: [4, 4, 0, 0] } },
      { name: 'Cost', type: 'bar', data: profitByOperator.map(o => o.cost), itemStyle: { color: '#dc2626', borderRadius: [4, 4, 0, 0] } }
    ]
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Row 1: Revenue vs Cost & Net Profit Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-panel rounded-xl p-5 border border-slate-200 shadow-sm bg-white">
          <div className="h-80">
            {loading ? <div className="h-full rounded-lg skeleton-shimmer" /> : <ReactECharts option={revCostTrendOption} style={{ height: '100%', width: '100%' }} />}
          </div>
        </div>

        <div className="card-panel rounded-xl p-5 border border-slate-200 shadow-sm bg-white">
          <div className="h-80">
            {loading ? <div className="h-full rounded-lg skeleton-shimmer" /> : <ReactECharts option={profitTrendOption} style={{ height: '100%', width: '100%' }} />}
          </div>
        </div>
      </div>

      {/* Row 2: Traffic Volumes & Revenue Contribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 card-panel rounded-xl p-5 border border-slate-200 shadow-sm bg-white">
          <div className="h-80">
            {loading ? <div className="h-full rounded-lg skeleton-shimmer" /> : <ReactECharts option={trafficTrendOption} style={{ height: '100%', width: '100%' }} />}
          </div>
        </div>

        <div className="lg:col-span-5 card-panel rounded-xl p-5 border border-slate-200 shadow-sm bg-white">
          <div className="h-80">
            {loading ? <div className="h-full rounded-lg skeleton-shimmer" /> : <ReactECharts option={revenueContributionOption} style={{ height: '100%', width: '100%' }} />}
          </div>
        </div>
      </div>

      {/* Row 3: Operator Analysis (Profit & Margin) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-panel rounded-xl p-5 border border-slate-200 shadow-sm bg-white">
          <div className="h-80">
            {loading ? <div className="h-full rounded-lg skeleton-shimmer" /> : <ReactECharts option={operatorProfitOption} style={{ height: '100%', width: '100%' }} />}
          </div>
        </div>

        <div className="card-panel rounded-xl p-5 border border-slate-200 shadow-sm bg-white">
          <div className="h-80">
            {loading ? <div className="h-full rounded-lg skeleton-shimmer" /> : <ReactECharts option={operatorMarginOption} style={{ height: '100%', width: '100%' }} />}
          </div>
        </div>
      </div>

      {/* Row 4: Route Profitability & Revenue vs Cost by Operator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-panel rounded-xl p-5 border border-slate-200 shadow-sm bg-white">
          <div className="h-80">
            {loading ? <div className="h-full rounded-lg skeleton-shimmer" /> : <ReactECharts option={routeProfitOption} style={{ height: '100%', width: '100%' }} />}
          </div>
        </div>

        <div className="card-panel rounded-xl p-5 border border-slate-200 shadow-sm bg-white">
          <div className="h-80">
            {loading ? <div className="h-full rounded-lg skeleton-shimmer" /> : <ReactECharts option={revCostByOperatorOption} style={{ height: '100%', width: '100%' }} />}
          </div>
        </div>
      </div>
    </div>
  );
};
