import React, { useState } from 'react';
import { CarrierSimulationWorkspace, SimulationContext } from './components/CarrierSimulationWorkspace';
import { OperatorsView } from './components/OperatorsView';
import { CarriersView } from './components/CarriersView';
import { Sliders, Building2, Globe } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'simulations' | 'operators' | 'carriers'>('simulations');
  const [simulationContext, setSimulationContext] = useState<SimulationContext | null>(null);

  const handleSelectOperator = (country: string, operatorName: string) => {
    setSimulationContext({ country, operator: operatorName });
    setActiveTab('simulations');
  };

  const handleSelectRouteSimulation = (context: {
    country: string;
    operator: string;
    destinationCountry?: string;
    carrier?: string;
  }) => {
    setSimulationContext(context);
    setActiveTab('simulations');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col overflow-x-hidden">
      {/* Full-Width Edge-to-Edge Dark Header Bar */}
      <header className="w-full bg-slate-900 border-b border-slate-800 text-white shadow-md sticky top-0 z-40">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-3 flex flex-wrap items-center justify-between gap-4">
          
          {/* Logo & Application Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-base shadow-sm">
              W
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Wholesale Commercial Analysis
              </h1>
              <p className="text-[11px] text-slate-400">
                Commercial performance, traffic allocation & simulation workspace
              </p>
            </div>
          </div>

          {/* Top Navigation Tabs: SIMULATIONS | OPERATORS | CARRIERS */}
          <nav className="flex items-center gap-1.5 bg-slate-800/90 p-1.5 rounded-xl border border-slate-700/80 shadow-inner">
            <button
              onClick={() => setActiveTab('simulations')}
              className={`px-4 py-2 rounded-lg font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'simulations'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/70'
              }`}
            >
              <Sliders className="w-4 h-4" />
              Simulations
            </button>

            <button
              onClick={() => setActiveTab('operators')}
              className={`px-4 py-2 rounded-lg font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'operators'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/70'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Operators
            </button>

            <button
              onClick={() => setActiveTab('carriers')}
              className={`px-4 py-2 rounded-lg font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'carriers'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/70'
              }`}
            >
              <Globe className="w-4 h-4" />
              Carriers
            </button>
          </nav>
        </div>
      </header>

      {/* Main Page Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {activeTab === 'simulations' && (
          <CarrierSimulationWorkspace
            selectedContext={simulationContext}
            onClearContext={() => setSimulationContext(null)}
          />
        )}

        {activeTab === 'operators' && (
          <OperatorsView onSelectOperator={handleSelectOperator} />
        )}

        {activeTab === 'carriers' && (
          <CarriersView onSelectRouteSimulation={handleSelectRouteSimulation} />
        )}
      </main>
    </div>
  );
}

export default App;
