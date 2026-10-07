import React, { useState, useEffect } from 'react';
import { Search, Building2, Globe, Users, ArrowRight, ShieldCheck, Sparkles, Filter, ChevronRight, PhoneCall } from 'lucide-react';

export interface MnoOperator {
  operatorName: string;
  subBase: string;
  marketShare: string;
  subscriberGrowth: string;
  prepPost: string;
  arpuGrowth: string;
  fiveGPenetration: string;
  revenueGrowth: string;
  profitability: string;
  capex: string;
}

export interface MnoCountry {
  country: string;
  region: string;
  subRegion: string;
  formerlyKnownAs: string;
  population: string;
  mobileUsers: string;
  mobilePenetration: string;
  gdpGrowth: string;
  avgAge: string;
  internetUsers: string;
  gdpPerCapita: string;
  outboundRoamingTrend: string;
  inboundRoamingTrend: string;
  businessTravellers: string;
  topRoamingCountries: string[];
  ottCalls: string;
  roamingComments: string;
  operators: MnoOperator[];
}

interface OperatorsViewProps {
  onSelectOperator: (country: string, operatorName: string) => void;
}

export const OperatorsView: React.FC<OperatorsViewProps> = ({ onSelectOperator }) => {
  const [countries, setCountries] = useState<MnoCountry[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<MnoCountry | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchMnoCountries = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/mno/countries');
        if (!res.ok) throw new Error('Failed to fetch MNO data');
        const data = await res.json();
        if (data.countries && data.countries.length > 0) {
          const sorted = [...data.countries].sort((a: MnoCountry, b: MnoCountry) => a.country.localeCompare(b.country));
          setCountries(sorted);
          const saudi = sorted.find((c: MnoCountry) => c.country.toLowerCase() === 'saudi arabia');
          setSelectedCountry(saudi || sorted[0]);
        }
      } catch (err: any) {
        console.error('Error loading MNO dataset:', err);
        setErrorMsg('Failed to load MNO operator data from source.');
      } finally {
        setLoading(false);
      }
    };

    fetchMnoCountries();
  }, []);

  // Filter regions
  const regions = ['ALL', ...Array.from(new Set(countries.map(c => c.region || c.subRegion).filter(Boolean)))];

  const filteredCountries = countries.filter(c => {
    const matchesSearch =
      c.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.operators.some(o => o.operatorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.region && c.region.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.subRegion && c.subRegion.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRegion =
      selectedRegion === 'ALL' ||
      c.region === selectedRegion ||
      c.subRegion === selectedRegion;

    return matchesSearch && matchesRegion;
  });

  if (loading) {
    return (
      <div className="card-panel rounded-2xl p-12 text-center bg-white border border-slate-200 shadow-sm my-6">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3"></div>
        <p className="text-sm font-semibold text-slate-600">Loading MNO Operator Directory...</p>
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
              <Building2 className="w-3.5 h-3.5" /> MNO Operator Directory
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Global Telecom Operators Directory
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Select a Country market to inspect MNO operators and open a commercial simulation for any operator.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 text-center">
              <span className="block text-lg font-black text-blue-400">{countries.length}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Countries</span>
            </div>
            <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 text-center">
              <span className="block text-lg font-black text-emerald-400">
                {countries.reduce((sum, c) => sum + c.operators.length, 0)}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MNO Operators</span>
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
          {errorMsg}
        </div>
      )}

      {/* Main 2-Column Split: Country Search Bar & Selection (Left) vs Operator Details (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Searchable Country List (5 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search country or operator..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Region Filters Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {regions.slice(0, 7).map((reg) => (
              <button
                key={reg}
                onClick={() => setSelectedRegion(reg)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedRegion === reg
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {reg}
              </button>
            ))}
          </div>

          {/* List of Countries */}
          <div className="max-h-[620px] overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
            {filteredCountries.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No matching countries found.</p>
            ) : (
              filteredCountries.map((c) => {
                const isSelected = selectedCountry?.country === c.country;
                return (
                  <div
                    key={c.country}
                    onClick={() => setSelectedCountry(c)}
                    className={`p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between border ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300 shadow-2xs'
                        : 'border-transparent hover:bg-slate-50 hover:border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={`text-xs font-bold ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                          {c.country}
                        </h4>
                        <span className="text-[10px] font-semibold text-slate-400">({c.region || c.subRegion})</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {c.operators.length} Operator{c.operators.length !== 1 ? 's' : ''} • Mobile Pen: {c.mobilePenetration || 'N/A'}%
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-300'}`} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Country Details & Operators List (7 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedCountry ? (
            <>
              {/* Selected Country Banner */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                      {selectedCountry.region} / {selectedCountry.subRegion}
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-600" />
                      {selectedCountry.country} Market Profile
                    </h3>
                  </div>
                </div>

                {/* Country Key Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Population</span>
                    <p className="text-sm font-extrabold text-slate-900 mt-0.5">{selectedCountry.population} mln</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Mobile Users</span>
                    <p className="text-sm font-extrabold text-slate-900 mt-0.5">{selectedCountry.mobileUsers} mln</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Mobile Penetration</span>
                    <p className="text-sm font-extrabold text-blue-700 mt-0.5">{selectedCountry.mobilePenetration}%</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Internet Penetration</span>
                    <p className="text-sm font-extrabold text-teal-700 mt-0.5">{selectedCountry.internetUsers}%</p>
                  </div>
                </div>

                {/* Roaming & OTT Summary */}
                {selectedCountry.topRoamingCountries.length > 0 && (
                  <div className="text-xs space-y-1 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                    <span className="font-bold text-slate-700">Top Outbound Roaming Destinations:</span>{' '}
                    <span className="text-blue-800 font-semibold">{selectedCountry.topRoamingCountries.join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Operators Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Operators in {selectedCountry.country} ({selectedCountry.operators.length})
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">Click any operator to open Simulation</span>
                </div>

                {selectedCountry.operators.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs font-semibold">
                    No operator details recorded for {selectedCountry.country}.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedCountry.operators.map((op, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                      >
                        <div className="space-y-3">
                          {/* Operator Title & Market Share Header */}
                          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Mobile Operator</span>
                              <h4 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {op.operatorName}
                              </h4>
                            </div>
                            {op.marketShare && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800">
                                {op.marketShare} Share
                              </span>
                            )}
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 bg-slate-50 rounded-lg">
                              <span className="text-[10px] text-slate-500 block font-semibold">Subscriber Base</span>
                              <span className="font-extrabold text-slate-800">{op.subBase ? `${op.subBase} mln` : 'N/A'}</span>
                            </div>
                            <div className="p-2 bg-slate-50 rounded-lg">
                              <span className="text-[10px] text-slate-500 block font-semibold">5G Penetration</span>
                              <span className="font-extrabold text-indigo-700">{op.fiveGPenetration || 'N/A'}</span>
                            </div>
                            <div className="p-2 bg-slate-50 rounded-lg">
                              <span className="text-[10px] text-slate-500 block font-semibold">Sub Growth</span>
                              <span className="font-extrabold text-emerald-700">{op.subscriberGrowth || 'N/A'}</span>
                            </div>
                            <div className="p-2 bg-slate-50 rounded-lg">
                              <span className="text-[10px] text-slate-500 block font-semibold">Pre/Postpaid</span>
                              <span className="font-extrabold text-slate-800">{op.prepPost || 'N/A'}</span>
                            </div>
                          </div>

                          {op.capex && (
                            <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <span className="font-bold text-slate-600">Capex/Investment:</span> {op.capex}
                            </p>
                          )}
                        </div>

                        {/* Action Button to Open Simulation */}
                        <button
                          onClick={() => onSelectOperator(selectedCountry.country, op.operatorName)}
                          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer group-hover:bg-blue-700"
                        >
                          <Sparkles className="w-4 h-4 text-blue-200" />
                          <span>Simulate {op.operatorName}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 text-sm font-semibold">
              Select a Country from the left list to view its operators.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
