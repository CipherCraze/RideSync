"use client";

import React from "react";
import { Filter, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface FilterState {
  query: string;
  location: string;
  vehicle_type: string;
  fuel_type: string;
  transmission: string;
  min_seats: string;
  min_price: string;
  max_price: string;
  sort_by: string;
}

interface VehicleFilterSidebarProps {
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
  onReset: () => void;
}

export function VehicleFilterSidebar({ filters, onChange, onReset }: VehicleFilterSidebarProps) {
  const handleChange = (key: keyof FilterState, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <aside className="w-full lg:w-72 bg-white rounded-2xl border border-gray-200/80 p-5 shadow-subtle space-y-6 shrink-0 h-fit sticky top-20">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Filters</h3>
        </div>
        <button
          onClick={onReset}
          className="text-xs font-semibold text-gray-400 hover:text-blue-600 flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Search Input */}
      <div>
        <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">
          Search Vehicles
        </label>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Tesla, BMW, SFO..."
            value={filters.query}
            onChange={(e) => handleChange("query", e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
          />
        </div>
      </div>

      {/* Vehicle Type */}
      <div>
        <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">
          Vehicle Type
        </label>
        <select
          value={filters.vehicle_type}
          onChange={(e) => handleChange("vehicle_type", e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
        >
          <option value="">All Vehicle Types</option>
          <option value="Electric">Electric</option>
          <option value="Luxury">Luxury</option>
          <option value="Sedan">Sedan</option>
          <option value="SUV">SUV</option>
          <option value="Hatchback">Hatchback</option>
          <option value="Convertible">Convertible</option>
          <option value="Truck">Truck</option>
          <option value="Van">Van</option>
        </select>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">
          Daily Rate ($/day)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min $"
            value={filters.min_price}
            onChange={(e) => handleChange("min_price", e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
          />
          <input
            type="number"
            placeholder="Max $"
            value={filters.max_price}
            onChange={(e) => handleChange("max_price", e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
          />
        </div>
      </div>

      {/* Transmission */}
      <div>
        <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">
          Transmission
        </label>
        <select
          value={filters.transmission}
          onChange={(e) => handleChange("transmission", e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
        >
          <option value="">Any Transmission</option>
          <option value="Automatic">Automatic</option>
          <option value="Manual">Manual</option>
        </select>
      </div>

      {/* Fuel Type */}
      <div>
        <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">
          Fuel Type
        </label>
        <select
          value={filters.fuel_type}
          onChange={(e) => handleChange("fuel_type", e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
        >
          <option value="">Any Fuel Type</option>
          <option value="Electric">Electric</option>
          <option value="Hybrid">Hybrid</option>
          <option value="Petrol">Petrol</option>
          <option value="Diesel">Diesel</option>
        </select>
      </div>

      {/* Seats */}
      <div>
        <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">
          Minimum Seats
        </label>
        <select
          value={filters.min_seats}
          onChange={(e) => handleChange("min_seats", e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
        >
          <option value="">Any Seats</option>
          <option value="2">2+ Seats</option>
          <option value="4">4+ Seats</option>
          <option value="5">5+ Seats</option>
          <option value="7">7+ Seats</option>
        </select>
      </div>

      {/* Sorting */}
      <div className="pt-2 border-t border-gray-100">
        <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">
          Sort By
        </label>
        <select
          value={filters.sort_by}
          onChange={(e) => handleChange("sort_by", e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 font-medium"
        >
          <option value="newest">Recently Added</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating_desc">Highest Rated</option>
        </select>
      </div>
    </aside>
  );
}
