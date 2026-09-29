import React, { useEffect, useState } from 'react';
import { Filter, RotateCcw, Calendar, Building2, Truck, Globe, MapPin, X } from 'lucide-react';

import { safeParseJson } from '../utils/apiUtils';

export interface FilterState {
  startDate: string;
  endDate: string;
  operator: string;
  carrier: string;
  customer: string;
  route: string;
  country: string;
}

interface FilterOptions {
  operators: string[];
  carriers: string[];
  customers: string[];
  countries: string[];
  routes: string[];
}

interface HeaderFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

export const HeaderFilters: React.FC<HeaderFiltersProps> = ({ filters, onChange, onReset }) => {
  const [options, setOptions] = useState<FilterOptions>({
    operators: [],
    carriers: [],
    customers: [],
    countries: [],
    routes: []
  });

  useEffect(() => {
    fetch('/api/filter-options')
      .then(res => safeParseJson(res, { operators: [], carriers: [], customers: [], countries: [], routes: [] }))
      .then(data => setOptions(data))
      .catch(err => console.error('Failed to load filter options:', err));
  }, []);

  const handleSelectChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onChange({
      ...filters,
      [name]: value
    });
  };

  const removeFilterField = (key: keyof FilterState) => {
    onChange({
      ...filters,
      [key]: ''
    });
  };

  // Count active non-empty filters
  const activeCount = Object.values(filters).filter(val => Boolean(val)).length;

  return (
    <div className="card-panel rounded-xl p-4 mb-6 border border-slate-200 shadow-sm bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-100 rounded-lg text-slate-700">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Commercial Filters</h3>
              {activeCount > 0 && (
                <span className="bg-blue-50 text-blue-700 font-semibold text-[11px] px-2 py-0.5 rounded-full border border-blue-200">
                  {activeCount} Active
                </span>
              )}
            </div>
          </div>
        </div>

        {activeCount > 0 && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all border border-rose-200"
          >
            <RotateCcw className="w-3 h-3" /> Reset Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Start Date */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-500" /> Start Date
          </label>
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleSelectChange}
            className="h-8 bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
          />
        </div>

        {/* End Date */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-500" /> End Date
          </label>
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleSelectChange}
            className="h-8 bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
          />
        </div>

        {/* Operator Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-slate-500" /> Operator
          </label>
          <select
            name="operator"
            value={filters.operator}
            onChange={handleSelectChange}
            className="h-8 bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="">All Operators</option>
            {options.operators.map(op => (
              <option key={op} value={op}>{op}</option>
            ))}
          </select>
        </div>

        {/* Carrier Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
            <Truck className="w-3 h-3 text-slate-500" /> Carrier
          </label>
          <select
            name="carrier"
            value={filters.carrier}
            onChange={handleSelectChange}
            className="h-8 bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="">All Carriers</option>
            {options.carriers.map(carr => (
              <option key={carr} value={carr}>{carr}</option>
            ))}
          </select>
        </div>

        {/* Customer Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-slate-500" /> Customer
          </label>
          <select
            name="customer"
            value={filters.customer}
            onChange={handleSelectChange}
            className="h-8 bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="">All Customers</option>
            {options.customers.map(cust => (
              <option key={cust} value={cust}>{cust}</option>
            ))}
          </select>
        </div>

        {/* Country Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
            <Globe className="w-3 h-3 text-slate-500" /> Destination
          </label>
          <select
            name="country"
            value={filters.country}
            onChange={handleSelectChange}
            className="h-8 bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="">All Destinations</option>
            {options.countries.map(cntry => (
              <option key={cntry} value={cntry}>{cntry}</option>
            ))}
          </select>
        </div>

        {/* Route Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-500" /> Route
          </label>
          <select
            name="route"
            value={filters.route}
            onChange={handleSelectChange}
            className="h-8 bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="">All Routes</option>
            {options.routes.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100">
          <span className="text-[11px] text-slate-500 font-semibold">Active:</span>
          {Object.entries(filters).map(([key, value]) => {
            if (!value) return null;
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200"
              >
                <span className="capitalize text-slate-500">{key}:</span> {value}
                <button
                  onClick={() => removeFilterField(key as keyof FilterState)}
                  className="hover:text-rose-600 p-0.5 rounded ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};
