import React, { useState, useEffect } from 'react';
import { Globe, ArrowRight, MapPin, Building2 } from 'lucide-react';
import { MnoOperator, MnoCountry } from './OperatorsView';

export interface MnoRoute {
  id: string;
  sourceCountry: string;
  sourceRegion: string;
  sourceOperators: MnoOperator[];
  destinationCountry: string;
  destinationRegion: string;
  destinationOperators: MnoOperator[];
  outboundRoamingTrend: string;
  roamingComments: string;
}

interface CarriersViewProps {
  onSelectRouteSimulation: (context: {
    country: string;
    operator: string;
    destinationCountry?: string;
    carrier?: string;
    sourceOperatorData?: MnoOperator;
    destOperatorData?: MnoOperator;
  }) => void;
}

export const CarriersView: React.FC<CarriersViewProps> = ({ onSelectRouteSimulation }) => {
  const [countries, setCountries] = useState<MnoCountry[]>([]);
  const [selectedSourceCountry, setSelectedSourceCountry] = useState<string>('Saudi Arabia');
  const [selectedDestCountry, setSelectedDestCountry] = useState<string>('Malaysia');
  const [activeCustomRoute, setActiveCustomRoute] = useState<MnoRoute | null>(null);

  const [selectedSourceOpIndex, setSelectedSourceOpIndex] = useState<number>(0);
  const [selectedDestOpIndex, setSelectedDestOpIndex] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(true);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load initial MNO countries sorted alphabetically
  useEffect(() => {
    const fetchCountries = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/mno/countries');
        const data = await res.json();

        if (data.countries) {
          const sorted = [...data.countries].sort((a: MnoCountry, b: MnoCountry) =>
            a.country.localeCompare(b.country)
          );
          setCountries(sorted);
        }

        // Fetch initial route pair (Saudi Arabia -> Malaysia)
        fetchPairRoute('Saudi Arabia', 'Malaysia');
      } catch (err: any) {
        console.error('Error loading country data:', err);
        setErrorMsg('Failed to load country carrier data from server.');
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, []);

  // Fetch route pair on selection change
  const fetchPairRoute = async (source: string, dest: string) => {
    setConnecting(true);
    try {
      const res = await fetch(`/api/mno/route-pair?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(dest)}`);
      const data = await res.json();
      if (data.route) {
        setActiveCustomRoute(data.route);
        setSelectedSourceOpIndex(0);
        setSelectedDestOpIndex(0);
      }
    } catch (err) {
      console.error('Failed to fetch route pair:', err);
    } finally {
      setConnecting(false);
    }
  };

  const handleSourceChange = (src: string) => {
    setSelectedSourceCountry(src);
    fetchPairRoute(src, selectedDestCountry);
  };

  const handleDestChange = (dest: string) => {
    setSelectedDestCountry(dest);
    fetchPairRoute(selectedSourceCountry, dest);
  };

  const selectedSourceOp = activeCustomRoute?.sourceOperators[selectedSourceOpIndex] || activeCustomRoute?.sourceOperators[0];
  const selectedDestOp = activeCustomRoute?.destinationOperators[selectedDestOpIndex] || activeCustomRoute?.destinationOperators[0];

  if (loading) {
    return (
      <div className="card-panel rounded-2xl p-12 text-center bg-white border border-slate-200 shadow-sm my-6">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3"></div>
        <p className="text-sm font-semibold text-slate-600">Loading Carrier Matrix...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30 mb-2">
              <Globe className="w-3.5 h-3.5" /> Carrier Roaming Corridor Analysis
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Carrier & Route Connectivity Matrix
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Select Source and Destination countries to compare operators and launch commercial simulation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-800 px-4 py-2 rounded-xl border border-slate-700 text-center">
              <span className="block text-lg font-black text-blue-400">{countries.length}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Countries</span>
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
          {errorMsg}
        </div>
      )}

      {/* CROSS-COUNTRY ROUTE SELECTOR BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              Route Corridor Selector
            </h3>
            <p className="text-xs text-slate-500">
              Select Source and Destination countries to view operators and launch simulation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Source Country Selector (Alphabetical) */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Source:</span>
              <select
                value={selectedSourceCountry}
                onChange={(e) => handleSourceChange(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
              >
                {countries.map(c => (
                  <option key={c.country} value={c.country}>{c.country}</option>
                ))}
              </select>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-400 hidden sm:block" />

            {/* Destination Country Selector (Alphabetical) */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Destination:</span>
              <select
                value={selectedDestCountry}
                onChange={(e) => handleDestChange(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
              >
                {countries.map(c => (
                  <option key={c.country} value={c.country}>{c.country}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SIDE-BY-SIDE OPERATOR PANELS */}
        {connecting ? (
          <div className="p-8 text-center text-slate-500 text-xs font-semibold">
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent mb-2"></div>
            <p>Loading operators for {selectedSourceCountry} ➔ {selectedDestCountry}...</p>
          </div>
        ) : activeCustomRoute ? (
          <div className="space-y-6">
            
            {/* SIDE-BY-SIDE PANELS (SOURCE vs DESTINATION OPERATORS) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              
              {/* LEFT PANEL: SOURCE OPERATORS */}
              <div className="bg-slate-50/60 border border-slate-200 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <h4 className="text-sm font-bold text-slate-900">
                      {activeCustomRoute.sourceCountry} Operators ({activeCustomRoute.sourceOperators.length})
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold bg-blue-600 text-white px-2.5 py-0.5 rounded-md">
                    Source
                  </span>
                </div>

                <div className="space-y-3">
                  {activeCustomRoute.sourceOperators.map((op, idx) => {
                    const isSelectedOp = selectedSourceOpIndex === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedSourceOpIndex(idx)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                          isSelectedOp
                            ? 'bg-white border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h5 className="text-xs font-bold text-slate-900">{op.operatorName}</h5>
                            {isSelectedOp && (
                              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                Selected Source
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md">
                            {op.marketShare} Share
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Subscribers</span>
                            <span className="font-bold text-slate-800">{op.subBase ? `${op.subBase} mln` : 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">5G Penetration</span>
                            <span className="font-bold text-indigo-600">{op.fiveGPenetration || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Sub Growth</span>
                            <span className="font-bold text-emerald-600">{op.subscriberGrowth || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT PANEL: DESTINATION OPERATORS */}
              <div className="bg-slate-50/60 border border-slate-200 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-sm font-bold text-slate-900">
                      {activeCustomRoute.destinationCountry} Operators ({activeCustomRoute.destinationOperators.length})
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold bg-indigo-600 text-white px-2.5 py-0.5 rounded-md">
                    Destination
                  </span>
                </div>

                <div className="space-y-3">
                  {activeCustomRoute.destinationOperators.length === 0 ? (
                    <p className="text-xs text-slate-500 italic p-4 text-center">
                      No operators recorded for {activeCustomRoute.destinationCountry}.
                    </p>
                  ) : (
                    activeCustomRoute.destinationOperators.map((destOp, idx) => {
                      const isSelectedDest = selectedDestOpIndex === idx;
                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedDestOpIndex(idx)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                            isSelectedDest
                              ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-bold text-slate-900">{destOp.operatorName}</h5>
                              {isSelectedDest && (
                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                  Selected Destination
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                              {destOp.marketShare} Share
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-medium">Subscribers</span>
                              <span className="font-bold text-slate-800">{destOp.subBase ? `${destOp.subBase} mln` : 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-medium">5G Penetration</span>
                              <span className="font-bold text-indigo-600">{destOp.fiveGPenetration || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-medium">Pre/Postpaid</span>
                              <span className="font-bold text-slate-800">{destOp.prepPost || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

            {/* DEDICATED SELECTED PAIR SUMMARY & GO TO SIMULATION ACTION BAR */}
            {selectedSourceOp && selectedDestOp && (
              <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-md flex flex-wrap items-center justify-between gap-4 border border-slate-800">
                <div>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                    Selected Route Corridor Pair
                  </span>
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-2 mt-1">
                    <span className="bg-blue-600 text-white px-2.5 py-1 rounded-lg text-xs font-bold">
                      {selectedSourceOp.operatorName} ({activeCustomRoute.sourceCountry})
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <span className="bg-indigo-600 text-white px-2.5 py-1 rounded-lg text-xs font-bold">
                      {selectedDestOp.operatorName} ({activeCustomRoute.destinationCountry})
                    </span>
                  </h4>
                </div>

                <button
                  onClick={() =>
                    onSelectRouteSimulation({
                      country: activeCustomRoute.sourceCountry,
                      operator: selectedSourceOp.operatorName,
                      destinationCountry: activeCustomRoute.destinationCountry,
                      carrier: selectedDestOp.operatorName,
                      sourceOperatorData: selectedSourceOp,
                      destOperatorData: selectedDestOp
                    })
                  }
                  className="py-2.5 px-6 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Go to Simulation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
