import React from 'react';
import { CarrierSimulationWorkspace } from './components/CarrierSimulationWorkspace';

export function App() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col overflow-x-hidden">
      {/* Full-Width Edge-to-Edge Dark Header Bar */}
      <header className="w-full bg-slate-900 border-b border-slate-800 text-white shadow-md sticky top-0 z-40">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-sm shadow-sm">
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
        </div>
      </header>

      {/* Main Page Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <CarrierSimulationWorkspace />
      </main>
    </div>
  );
}

export default App;
