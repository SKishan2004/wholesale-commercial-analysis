import React, { useState, useEffect } from 'react';
import { Search, Globe, ArrowRight, Sparkles, Filter, ShieldCheck, MapPin, Building2, PhoneCall, RefreshCw } from 'lucide-react';
import { MnoOperator } from './OperatorsView';

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
  }) => void;
}

export const CarriersView: React.FC<CarriersViewProps> = ({ onSelectRouteSimulation }) => {
  const [routes, setRoutes] = useState<MnoRoute[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [destFilter, setDestFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoutes = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/mno/routes');
        if (!res.ok) throw new Error('Failed to fetch MNO routes');
        const data = await res.json();
        if (data.routes) {
          setRoutes(data.routes);
        }
      } catch (err: any) {
        console.error('Error loading MNO routes:', err);
        setErrorMsg('Failed to load MNO carrier route corridors from server.');
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, []);

  // Filter options
  const sourceCountries = ['ALL', ...Array.from(new Set(routes.map(r => r.sourceCountry)))];
  const destCountries = ['ALL', ...Array.from(new Set(routes.map(r => r.destinationCountry)))];

  const filteredRoutes = routes.filter(r => {
    const matchesSearch =
      r.sourceCountry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.destinationCountry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.sourceOperators.some(o => o.operatorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      r.destinationOperators.some(o => o.operatorName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSource = sourceFilter === 'ALL' || r.sourceCountry === sourceFilter;
    const matchesDest = destFilter === 'ALL' || r.destinationCountry === destFilter;

    return matchesSearch && matchesSource && matchesDest;
  });

  if (loading) {
    return (
      <div className="card-panel rounded-2xl p-12 text-center bg-white border border-slate-200 shadow-sm my-6">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3"></div>
        <p className="text-sm font-semibold text-slate-600">Loading Inter-Carrier Roaming Corridors from Excel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30 mb-2">
              <Globe className="w-3.5 h-3.5" /> Inter-Carrier Roaming Corridor Analysis
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Wholesale Carrier & Route Directory
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Source Country → Destination Country inter-carrier connectivity matrix derived from verified MNO top roaming corridors.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 text-center">
              <span className="block text-lg font-black text-teal-400">{routes.length}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Corridor Routes</span>
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
          {errorMsg}
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search source country, destination or operator..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Source Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500">Source:</span>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              {sourceCountries.slice(0, 30).map(sc => (
                <option key={sc} value={sc}>{sc === 'ALL' ? 'All Source Countries' : sc}</option>
              ))}
            </select>
          </div>

          {/* Destination Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500">Dest:</span>
            <select
              value={destFilter}
              onChange={(e) => setDestFilter(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              {destCountries.slice(0, 30).map(dc => (
                <option key={dc} value={dc}>{dc === 'ALL' ? 'All Destinations' : dc}</option>
              ))}
            </select>
          </div>
        </div>

        {(sourceFilter !== 'ALL' || destFilter !== 'ALL' || searchQuery) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSourceFilter('ALL');
              setDestFilter('ALL');
            }}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Corridor Routes Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600">
          <span>Showing {filteredRoutes.length} Carrier Corridor Routes</span>
        </div>

        {filteredRoutes.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 text-xs font-semibold">
            No matching carrier routes found for the current search/filter parameters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRoutes.slice(0, 50).map((route) => {
              const primarySrcOp = route.sourceOperators[0]?.operatorName || 'Source Operator';
              const primaryDestOp = route.destinationOperators[0]?.operatorName || 'Destination Operator';

              return (
                <div
                  key={route.id}
                  className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Source → Destination Header */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Source</span>
                          <h4 className="text-sm font-extrabold text-slate-900">{route.sourceCountry}</h4>
                        </div>
                      </div>

                      <div className="flex flex-col items-center">
                        <ArrowRight className="w-4 h-4 text-blue-600" />
                        <span className="text-[9px] font-bold text-blue-600 uppercase">Route</span>
                      </div>

                      <div className="flex items-center gap-2 text-right">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Destination</span>
                          <h4 className="text-sm font-extrabold text-slate-900">{route.destinationCountry}</h4>
                        </div>
                        <Globe className="w-4 h-4 text-teal-600" />
                      </div>
                    </div>

                    {/* Source & Destination Operators Section */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {/* Source Operators */}
                      <div className="space-y-1.5 p-2.5 bg-blue-50/60 rounded-xl border border-blue-100">
                        <span className="text-[10px] font-bold text-blue-800 uppercase block">
                          Source Operators ({route.sourceOperators.length})
                        </span>
                        <div className="space-y-1">
                          {route.sourceOperators.map((op, i) => (
                            <div key={i} className="flex items-center justify-between text-[11px] font-bold text-slate-800">
                              <span>{op.operatorName}</span>
                              <span className="text-[10px] text-blue-600 font-semibold">{op.marketShare}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Destination Operators / Carriers */}
                      <div className="space-y-1.5 p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100">
                        <span className="text-[10px] font-bold text-indigo-800 uppercase block">
                          Destination Carriers ({route.destinationOperators.length})
                        </span>
                        {route.destinationOperators.length > 0 ? (
                          <div className="space-y-1">
                            {route.destinationOperators.map((op, i) => (
                              <div key={i} className="flex items-center justify-between text-[11px] font-bold text-slate-800">
                                <span>{op.operatorName}</span>
                                <span className="text-[10px] text-indigo-600 font-semibold">{op.marketShare}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Partner Carrier Corridor</span>
                        )}
                      </div>
                    </div>

                    {/* Roaming Trend Meta */}
                    {route.outboundRoamingTrend && (
                      <p className="text-[11px] font-semibold text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="font-bold text-slate-700">Roaming Trend:</span> {route.outboundRoamingTrend}
                      </p>
                    )}
                  </div>

                  {/* Go to Simulation Action Button */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() =>
                        onSelectRouteSimulation({
                          country: route.sourceCountry,
                          operator: primarySrcOp,
                          destinationCountry: route.destinationCountry,
                          carrier: primaryDestOp
                        })
                      }
                      className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Simulate {primarySrcOp}</span>
                    </button>

                    {route.destinationOperators.length > 0 && (
                      <button
                        onClick={() =>
                          onSelectRouteSimulation({
                            country: route.destinationCountry,
                            operator: primaryDestOp,
                            destinationCountry: route.sourceCountry,
                            carrier: primarySrcOp
                          })
                        }
                        className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Simulate {primaryDestOp}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
