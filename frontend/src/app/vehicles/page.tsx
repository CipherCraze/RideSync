"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, Car, Users, Calendar, Star, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { VehicleFilterSidebar } from "@/components/vehicles/VehicleFilterSidebar";
import { HonorScoreBadge } from "@/components/ui/HonorScoreBadge";
import { Button } from "@/components/ui/Button";
import { apiService } from "@/lib/api";
import { Vehicle, UserPublicCard } from "@/types";
import { formatDate } from "@/lib/utils";

function SearchVehiclesContent() {
  const searchParams = useSearchParams();

  // Search Mode: Vehicles vs Users
  const [searchMode, setSearchMode] = useState<"vehicles" | "users">("vehicles");
  const [userQuery, setUserQuery] = useState<string>("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("ALL");
  const [discoveredUsers, setDiscoveredUsers] = useState<UserPublicCard[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);

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

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await apiService.discoverUsers(
        userQuery || undefined,
        userRoleFilter === "ALL" ? undefined : userRoleFilter
      );
      setDiscoveredUsers(data);
    } catch (err) {
      console.error("Failed to discover users", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (searchMode === "vehicles") {
      fetchVehicles();
    } else {
      fetchUsers();
    }
  }, [filters, searchMode, userQuery, userRoleFilter]);

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
    setUserQuery("");
    setUserRoleFilter("ALL");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Global Search Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            {searchMode === "vehicles" ? "Explore P2P Vehicle Marketplace" : "Discover Peer-to-Peer Users & Hosts"}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {searchMode === "vehicles"
              ? `Showing ${vehicles.length} available verified vehicle(s) ready for instant rental`
              : `Browse ${discoveredUsers.length} verified community member(s), hosts, and renters`}
          </p>
        </div>

        {/* Global Search Filter: Toggle between Vehicles and Users */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-2xl border border-gray-200/80">
          <button
            onClick={() => setSearchMode("vehicles")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              searchMode === "vehicles"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Vehicles</span>
          </button>

          <button
            onClick={() => setSearchMode("users")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              searchMode === "users"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Users & Hosts</span>
          </button>
        </div>
      </div>

      {/* VIEW: Users & Hosts Discovery */}
      {searchMode === "users" ? (
        <div className="space-y-6">
          {/* User Search & Role Filter Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by user name, bio, or address..."
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray-500 font-medium">Role:</span>
              {(["ALL", "OWNER", "RENTER"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setUserRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    userRoleFilter === r
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {r === "ALL" ? "All Users" : r === "OWNER" ? "Hosts Only" : "Renters Only"}
                </button>
              ))}
            </div>
          </div>

          {/* User Cards Grid */}
          {loadingUsers ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-64 bg-gray-100 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : discoveredUsers.length === 0 ? (
            <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 mx-auto flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No users match your search</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Try searching for a different name, or clear the role filters.
              </p>
              <Button size="sm" variant="outline" onClick={handleReset}>
                Reset Search
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {discoveredUsers.map((u) => (
                <div
                  key={u.id}
                  className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm hover:shadow-card transition-all flex flex-col justify-between space-y-5"
                >
                  <div>
                    {/* User Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            u.profile_picture ||
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80"
                          }
                          alt={u.full_name}
                          className="w-14 h-14 rounded-full object-cover ring-2 ring-blue-600/20 shrink-0"
                        />
                        <div>
                          <h3 className="text-base font-extrabold text-gray-900 leading-tight">
                            {u.full_name}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-1">
                            {u.is_owner && (
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                                Host
                              </span>
                            )}
                            {u.is_renter && (
                              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                                Renter
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <HonorScoreBadge score={u.honor_score} />
                    </div>

                    {/* Bio */}
                    {u.bio && (
                      <p className="text-xs text-gray-600 line-clamp-2 italic mb-3">
                        "{u.bio}"
                      </p>
                    )}

                    {/* User Stats */}
                    <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50/80 rounded-2xl border border-gray-100 text-center text-xs">
                      <div>
                        <span className="text-sm font-extrabold text-gray-900 block">
                          {u.active_listings_count}
                        </span>
                        <span className="text-[10px] text-gray-400">Cars Listed</span>
                      </div>
                      <div>
                        <span className="text-sm font-extrabold text-emerald-600 block">
                          {u.completed_trips_count}
                        </span>
                        <span className="text-[10px] text-gray-400">Trips</span>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-0.5">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-extrabold text-gray-900">
                            {u.rating_avg.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400">Rating</span>
                      </div>
                    </div>

                    {/* Join Date */}
                    <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-3">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Member since {formatDate(u.joined_date)}</span>
                    </div>
                  </div>

                  {/* Action Link */}
                  <Link href={`/profile/${u.id}`} className="block">
                    <Button variant="primary" size="sm" className="w-full text-xs font-bold gap-1.5">
                      <span>View Public Profile & Fleet</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* VIEW: Vehicles Marketplace Grid */
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
      )}
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
