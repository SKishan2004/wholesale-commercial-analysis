import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Sliders, PieChart, TrendingUp, BarChart3, Award, Layers } from 'lucide-react';
import { SimulationModel } from './CarrierSimulationWorkspace';
import { FinalScenarioModel } from './FinalScenarioWorkspace';

interface SimulationVisualizationsProps {
  simulations: SimulationModel[];
  finalScenario: FinalScenarioModel | null;
}

export const SimulationVisualizations: React.FC<SimulationVisualizationsProps> = ({
  simulations,
  finalScenario
}) => {
  const [activeMetric, setActiveMetric] = useState<'revenue' | 'cost' | 'netProfit' | 'margin'>('netProfit');
  const [selectedSimTab, setSelectedSimTab] = useState<number>(0);

  // Consolidate list of scenarios (Simulations 1/2/3 + Final Scenario)
  const scenariosList = [
    ...(simulations || []).map(s => ({
      name: s.name,
      revenue: s.totals.totalRevenue,
      cost: s.totals.totalWholesaleCost,
      netProfit: s.totals.netProfit,
      margin: s.totals.profitMarginPct,
      incomingTraffic: s.totals.totalIncomingTraffic,
      outgoingTraffic: s.totals.totalOutgoingTraffic,
      carrierResults: s.carrierResults || []
    })),
    ...(finalScenario && finalScenario.totals ? [{
      name: finalScenario.name || 'Final Scenario',
      revenue: finalScenario.totals.totalRevenue,
      cost: finalScenario.totals.totalWholesaleCost,
      netProfit: finalScenario.totals.netProfit,
      margin: finalScenario.totals.profitMarginPct,
      incomingTraffic: finalScenario.totals.totalIncomingTraffic,
      outgoingTraffic: finalScenario.totals.totalOutgoingTraffic,
      carrierResults: finalScenario.carrierResults || []
    }] : [])
  ];

  const categoryNames = scenariosList.map(s => s.name);

  // 1. COMMON LINE GRAPH OPTION (Metric Comparison across Scenarios)
  const getCommonLineOption = () => {
    let metricLabel = 'Net Profit ($)';
    let metricValues = scenariosList.map(s => s.netProfit);
    let lineColor = '#059669';

    if (activeMetric === 'revenue') {
      metricLabel = 'Total Revenue ($)';
      metricValues = scenariosList.map(s => s.revenue);
      lineColor = '#2563eb';
    } else if (activeMetric === 'cost') {
      metricLabel = 'Total Cost ($)';
      metricValues = scenariosList.map(s => s.cost);
      lineColor = '#e11d48';
    } else if (activeMetric === 'margin') {
      metricLabel = 'Profit Margin (%)';
      metricValues = scenariosList.map(s => s.margin);
      lineColor = '#d97706';
    }

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line', lineStyle: { color: '#94a3b8', type: 'dashed' } },
        formatter: (params: any[]) => {
          const item = params[0];
          const unit = activeMetric === 'margin' ? '%' : '$';
          const val = activeMetric === 'margin'
            ? Number(item.value).toFixed(2)
            : Number(item.value).toLocaleString('en-US', { minimumFractionDigits: 2 });
          return `<div class="font-bold text-slate-800">${item.name}</div><div class="text-xs text-slate-600 mt-1">${metricLabel}: <span class="font-extrabold text-blue-700">${unit}${val}</span></div>`;
        }
      },
      grid: { left: '4%', right: '5%', bottom: '10%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: categoryNames,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: { color: '#334155', fontWeight: 'bold', fontSize: 12 }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        axisLabel: {
          color: '#64748b',
          fontSize: 11,
          formatter: (val: number) => (activeMetric === 'margin' ? `${val}%` : `$${(val / 1000).toFixed(0)}k`)
        }
      },
      series: [
        {
          name: metricLabel,
          type: 'line',
          smooth: true,
          symbolSize: 10,
          data: metricValues,
          lineStyle: { width: 3.5, color: lineColor },
          itemStyle: { color: lineColor, borderWidth: 2, borderColor: '#ffffff' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: `${lineColor}33` },
                { offset: 1, color: `${lineColor}00` }
              ]
            }
          }
        }
      ]
    };
  };

  // 2. COMMERCIAL PERFORMANCE COMPARISON BAR CHART
  const getCommercialPerformanceBarOption = () => {
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['Total Revenue', 'Wholesale Cost', 'Net Profit'], top: 5, textStyle: { color: '#475569', fontWeight: 'bold' } },
      grid: { left: '4%', right: '5%', bottom: '10%', top: '18%', containLabel: true },
      xAxis: {
        type: 'category',
        data: categoryNames,
        axisLabel: { color: '#334155', fontWeight: 'bold', fontSize: 12 }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        axisLabel: { color: '#64748b', formatter: (val: number) => `$${(val / 1000).toFixed(0)}k` }
      },
      series: [
        {
          name: 'Total Revenue',
          type: 'bar',
          barGap: '15%',
          barCategoryGap: '35%',
          data: scenariosList.map(s => s.revenue),
          itemStyle: { color: '#2563eb', borderRadius: [6, 6, 0, 0] }
        },
        {
          name: 'Wholesale Cost',
          type: 'bar',
          data: scenariosList.map(s => s.cost),
          itemStyle: { color: '#e11d48', borderRadius: [6, 6, 0, 0] }
        },
        {
          name: 'Net Profit',
          type: 'bar',
          data: scenariosList.map(s => s.netProfit),
          itemStyle: { color: '#059669', borderRadius: [6, 6, 0, 0] }
        }
      ]
    };
  };

  // 3. FINAL SCENARIO CARRIER ALLOCATION CHART (Shares %)
  const getFinalCarrierShareOption = () => {
    const carriers = finalScenario?.carrierResults || [];
    const carrierNames = carriers.map(c => c.carrierName);

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['Incoming Share %', 'Outgoing Share %'], top: 5, textStyle: { color: '#475569', fontWeight: 'bold' } },
      grid: { left: '4%', right: '5%', bottom: '10%', top: '18%', containLabel: true },
      xAxis: {
        type: 'category',
        data: carrierNames,
        axisLabel: { color: '#334155', fontWeight: 'bold', fontSize: 12 }
      },
      yAxis: {
        type: 'value',
        max: 100,
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        axisLabel: { color: '#64748b', formatter: '{value}%' }
      },
      series: [
        {
          name: 'Incoming Share %',
          type: 'bar',
          barCategoryGap: '40%',
          data: carriers.map(c => c.incomingSharePct),
          itemStyle: { color: '#0d9488', borderRadius: [6, 6, 0, 0] }
        },
        {
          name: 'Outgoing Share %',
          type: 'bar',
          data: carriers.map(c => c.outgoingSharePct),
          itemStyle: { color: '#2563eb', borderRadius: [6, 6, 0, 0] }
        }
      ]
    };
  };

  // 4. FINAL SCENARIO CARRIER FINANCIALS
  const getFinalCarrierFinancialsOption = () => {
    const carriers = finalScenario?.carrierResults || [];
    const carrierNames = carriers.map(c => c.carrierName);

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['Carrier Revenue', 'Carrier Cost', 'Net Profit'], top: 5, textStyle: { color: '#475569', fontWeight: 'bold' } },
      grid: { left: '4%', right: '5%', bottom: '10%', top: '18%', containLabel: true },
      xAxis: {
        type: 'category',
        data: carrierNames,
        axisLabel: { color: '#334155', fontWeight: 'bold', fontSize: 12 }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        axisLabel: { color: '#64748b', formatter: (val: number) => `$${(val / 1000).toFixed(0)}k` }
      },
      series: [
        {
          name: 'Carrier Revenue',
          type: 'bar',
          barCategoryGap: '35%',
          data: carriers.map(c => c.totalRevenue),
          itemStyle: { color: '#3b82f6', borderRadius: [6, 6, 0, 0] }
        },
        {
          name: 'Carrier Cost',
          type: 'bar',
          data: carriers.map(c => c.wholesaleCost),
          itemStyle: { color: '#f43f5e', borderRadius: [6, 6, 0, 0] }
        },
        {
          name: 'Net Profit',
          type: 'bar',
          data: carriers.map(c => c.netProfit),
          itemStyle: { color: '#10b981', borderRadius: [6, 6, 0, 0] }
        }
      ]
    };
  };

  // 5. INDIVIDUAL SIMULATION CARRIER DEEP DIVE CHART
  const getSelectedSimCarrierOption = () => {
    const sim = simulations[selectedSimTab];
    if (!sim || !sim.carrierResults) return {};

    const carrierNames = sim.carrierResults.map(c => c.carrierName);

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['Incoming Traffic (mins)', 'Outgoing Traffic (mins)', 'Net Profit ($)'], top: 5, textStyle: { color: '#475569', fontWeight: 'bold' } },
      grid: { left: '4%', right: '5%', bottom: '10%', top: '18%', containLabel: true },
      xAxis: {
        type: 'category',
        data: carrierNames,
        axisLabel: { color: '#334155', fontWeight: 'bold', fontSize: 12 }
      },
      yAxis: [
        { type: 'value', name: 'Minutes', axisLabel: { color: '#64748b', formatter: (val: number) => `${(val / 1000).toFixed(0)}k` }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
        { type: 'value', name: 'Net Profit ($)', axisLabel: { color: '#64748b', formatter: (val: number) => `$${(val / 1000).toFixed(0)}k` }, splitLine: { show: false } }
      ],
      series: [
        {
          name: 'Incoming Traffic (mins)',
          type: 'bar',
          data: sim.carrierResults.map(c => c.calculatedIncomingTraffic),
          itemStyle: { color: '#14b8a6', borderRadius: [6, 6, 0, 0] }
        },
        {
          name: 'Outgoing Traffic (mins)',
          type: 'bar',
          data: sim.carrierResults.map(c => c.calculatedOutgoingTraffic),
          itemStyle: { color: '#6366f1', borderRadius: [6, 6, 0, 0] }
        },
        {
          name: 'Net Profit ($)',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          data: sim.carrierResults.map(c => c.netProfit),
          lineStyle: { width: 3.5, color: '#10b981' },
          itemStyle: { color: '#10b981', borderWidth: 2, borderColor: '#fff' }
        }
      ]
    };
  };

  return (
    <div className="space-y-8">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
            <PieChart className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Commercial Scenario Visualizations
          </h2>
        </div>

        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          Live Calculated Charts
        </span>
      </div>

      {/* SECTION 1: COMMON LINE GRAPH & METRIC COMPARISON */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Commercial Trajectory Comparison</h3>
              <p className="text-xs text-slate-500">Shared line graph comparing metrics across all scenarios</p>
            </div>
          </div>

          {/* Metric Selector Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveMetric('revenue')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMetric === 'revenue' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Revenue
            </button>
            <button
              onClick={() => setActiveMetric('cost')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMetric === 'cost' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cost
            </button>
            <button
              onClick={() => setActiveMetric('netProfit')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMetric === 'netProfit' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Net Profit
            </button>
            <button
              onClick={() => setActiveMetric('margin')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMetric === 'margin' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Profit Margin
            </button>
          </div>
        </div>

        {/* Common Line Graph Chart */}
        <div className="h-[360px] w-full">
          <ReactECharts option={getCommonLineOption()} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>

      {/* SECTION 2: COMMERCIAL PERFORMANCE COMPARISON BAR CHART */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Commercial Performance Breakdown</h3>
            <p className="text-xs text-slate-500">Revenue, cost, and net profit distribution across simulations & final scenario</p>
          </div>
        </div>

        <div className="h-[360px] w-full">
          <ReactECharts option={getCommercialPerformanceBarOption()} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>

      {/* SECTION 3: FINAL SCENARIO VISUALIZATIONS */}
      {finalScenario && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-slate-800 font-extrabold text-sm uppercase tracking-wider">
            <Award className="w-5 h-5 text-amber-600" /> Final Scenario Carrier Analytics
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Final Scenario Carrier Allocations Shares Bar Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900">Carrier Traffic Share Allocations (%)</h3>
              <div className="h-[320px] w-full">
                <ReactECharts option={getFinalCarrierShareOption()} style={{ height: '100%', width: '100%' }} />
              </div>
            </div>

            {/* Final Scenario Revenue vs Cost by Carrier */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900">Carrier Financials (Revenue vs Cost vs Profit)</h3>
              <div className="h-[320px] w-full">
                <ReactECharts option={getFinalCarrierFinancialsOption()} style={{ height: '100%', width: '100%' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: INDIVIDUAL SIMULATION VISUALIZATIONS */}
      {simulations && simulations.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <Sliders className="w-5 h-5 text-purple-600" />
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Individual Simulation Deep Dive</h3>
                <p className="text-xs text-slate-500">Per-carrier traffic and profit analysis for individual simulations</p>
              </div>
            </div>

            {/* Simulation Tabs */}
            <div className="flex items-center gap-2">
              {simulations.map((sim, idx) => (
                <button
                  key={sim.id || idx}
                  onClick={() => setSelectedSimTab(idx)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedSimTab === idx
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {sim.name}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[360px] w-full">
            <ReactECharts option={getSelectedSimCarrierOption()} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationVisualizations;
