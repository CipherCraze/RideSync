"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, Car } from "lucide-react";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { VehicleFilterSidebar } from "@/components/vehicles/VehicleFilterSidebar";
import { apiService } from "@/lib/api";
import { Vehicle } from "@/types";

function SearchVehiclesContent() {
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({
    query: searchParams.get("query") || "",
    location: searchParams.get("location") || "",
    vehicle_type: searchParams.get("vehicle_type") || "",
    fuel_type: searchParams.get("fuel_type") || "",
    transmission: searchParams.get("transmission") || "",
    min_seats: searchParams.get("min_seats") || "",
    min_price: searchParams.get("min_price") || "",
    max_price: searchParams.get("max_price") || "",
    sort_by: searchParams.get("sort_by") || "newest",
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showMobileFilter, setShowMobileFilter] = useState<boolean>(false);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const data = await apiService.searchVehicles({
        query: filters.query || undefined,
        location: filters.location || undefined,
        vehicle_type: filters.vehicle_type || undefined,
        fuel_type: filters.fuel_type || undefined,
        transmission: filters.transmission || undefined,
        min_seats: filters.min_seats ? parseInt(filters.min_seats) : undefined,
        min_price: filters.min_price ? parseFloat(filters.min_price) : undefined,
        max_price: filters.max_price ? parseFloat(filters.max_price) : undefined,
        sort_by: filters.sort_by,
      });
      setVehicles(data);
    } catch (err) {
      console.error("Failed to load vehicles", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [filters]);

  const handleReset = () => {
    setFilters({
      query: "",
      location: "",
      vehicle_type: "",
      fuel_type: "",
      transmission: "",
      min_seats: "",
      min_price: "",
      max_price: "",
      sort_by: "newest",
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Explore P2P Vehicle Marketplace
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Showing {vehicles.length} available verified vehicle(s) ready for instant rental
          </p>
        </div>

        <button
          onClick={() => setShowMobileFilter(!showMobileFilter)}
          className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 shadow-subtle"
        >
          <SlidersHorizontal className="w-4 h-4 text-blue-600" />
          Filter Vehicles
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Desktop & Mobile Filter Sidebar */}
        <div className={`lg:block ${showMobileFilter ? "block" : "hidden"}`}>
          <VehicleFilterSidebar
            filters={filters}
            onChange={setFilters}
            onReset={handleReset}
          />
        </div>

        {/* Vehicle Cards Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-80 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 mx-auto flex items-center justify-center">
                <Car className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No vehicles match your criteria</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Try expanding your search location or clearing filters to view available cars.
              </p>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchVehiclesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500">Loading marketplace...</div>}>
      <SearchVehiclesContent />
    </Suspense>
  );
}
