"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ShieldCheck, Zap, Award, ArrowRight, Car, CheckCircle2, UserCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { apiService } from "@/lib/api";
import { Vehicle } from "@/types";

export default function LandingPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");

  useEffect(() => {
    apiService
      .searchVehicles({ limit: 6 })
      .then((data) => setVehicles(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-20 pb-10">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 bg-gradient-to-b from-blue-50/50 via-white to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold shadow-subtle animate-in fade-in slide-in-from-top-4 duration-500">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Introducing RideSync Honor Score System 2.0</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight max-w-4xl mx-auto leading-tight">
            Rent cars directly from <span className="text-blue-600 underline decoration-blue-200 underline-offset-8">trusted hosts</span> in your city.
          </h1>

          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            The premier peer-to-peer vehicle marketplace. List your own car to earn passive income or rent verified luxury, electric, and daily drivers with full transparent honor scores.
          </p>

          {/* Interactive Search Bar */}
          <div className="max-w-3xl mx-auto bg-white p-3 sm:p-4 rounded-2xl shadow-card border border-gray-200/80 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 flex items-center gap-2.5 px-3 py-2 bg-gray-50 rounded-xl w-full border border-gray-100">
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Where to? (e.g. San Francisco, NY, LAX)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
            </div>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2.5 bg-gray-50 text-xs font-semibold text-gray-700 rounded-xl border border-gray-100 focus:outline-none w-full sm:w-44"
            >
              <option value="">All Vehicle Types</option>
              <option value="Electric">Electric</option>
              <option value="Luxury">Luxury</option>
              <option value="SUV">SUV</option>
              <option value="Sedan">Sedan</option>
              <option value="Convertible">Convertible</option>
            </select>

            <Link href={`/vehicles?query=${encodeURIComponent(searchQuery)}&vehicle_type=${selectedType}`} className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto gap-2">
                Find Cars
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Trust Metrics */}
          <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto border-t border-gray-100 text-left">
            <div>
              <span className="block text-2xl font-bold text-gray-900">100 Pts</span>
              <span className="text-xs text-gray-500 font-medium">Default Starting Honor Score</span>
            </div>
            <div>
              <span className="block text-2xl font-bold text-blue-600">100%</span>
              <span className="text-xs text-gray-500 font-medium">Verified Drivers & License Checks</span>
            </div>
            <div>
              <span className="block text-2xl font-bold text-gray-900">$0</span>
              <span className="text-xs text-gray-500 font-medium">Hidden Subscriptions or Fees</span>
            </div>
            <div>
              <span className="block text-2xl font-bold text-emerald-600">4.9 / 5</span>
              <span className="text-xs text-gray-500 font-medium">Community Rating Standard</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Vehicles Marketplace Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Marketplace</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Featured Verified Vehicles
            </h2>
          </div>
          <Link href="/vehicles">
            <Button variant="outline" size="sm" className="gap-1.5">
              Explore All Vehicles ({vehicles.length})
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        )}
      </section>

      {/* How P2P Renting Works */}
      <section id="how-it-works" className="bg-gray-50 py-20 border-y border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Simple & Transparent</span>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              How P2P Vehicle Rental Works
            </h2>
            <p className="text-sm text-gray-600">
              Rent from real owners or host your own car in 4 seamless steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-subtle space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                1
              </div>
              <h3 className="font-bold text-gray-900 text-base">Browse & Request</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Filter by location, price, electric range, and seats. Request desired dates with instant price calculation.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-subtle space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                2
              </div>
              <h3 className="font-bold text-gray-900 text-base">Owner Confirmation</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                The car owner reviews your Honor Score and confirms the trip request. Real-time notification dispatched.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-subtle space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                3
              </div>
              <h3 className="font-bold text-gray-900 text-base">Pickup & Drive</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Meet at the agreed pickup location. Perform quick check-in and enjoy a smooth, reliable rental.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-subtle space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                4
              </div>
              <h3 className="font-bold text-gray-900 text-base">Return & Rate</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Return the vehicle. Both renter and host review each other to earn +5 Honor Score points!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Honor Score Engine Explanation */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="space-y-4 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-blue-300" /> RideSync Honor System
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Trust built on verifiable honor, not corporate gatekeeping.
            </h2>
            <p className="text-sm text-blue-100 leading-relaxed">
              Every member starts at 100 points. Honor score increases on successful rentals and positive ratings, while decreasing on damage, late returns, or cancellations.
            </p>

            <div className="pt-2 flex flex-wrap gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-emerald-300">
                <CheckCircle2 className="w-4 h-4" /> 95–100: Trusted Tier
              </span>
              <span className="flex items-center gap-1.5 text-blue-300">
                <CheckCircle2 className="w-4 h-4" /> 80–94: Good Standing
              </span>
              <span className="flex items-center gap-1.5 text-amber-300">
                <CheckCircle2 className="w-4 h-4" /> 60–79: Warning
              </span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 w-full lg:w-96 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200">Honor Score Tiers</span>
              <span className="text-xs font-bold text-emerald-400">Live Audit</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center bg-white/10 p-2.5 rounded-xl">
                <div>
                  <span className="font-bold block">Trusted (95-100)</span>
                  <span className="text-[11px] text-blue-200">Instant booking & priority support</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">Top 15%</span>
              </div>

              <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-xl">
                <div>
                  <span className="font-bold block">Good (80-94)</span>
                  <span className="text-[11px] text-blue-200">Standard rental permissions</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">Standard</span>
              </div>

              <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-xl">
                <div>
                  <span className="font-bold block">Restricted (&lt; 60)</span>
                  <span className="text-[11px] text-rose-300">Booking privileges blocked</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">Blocked</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Host Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-blue-50 rounded-3xl p-8 sm:p-12 border border-blue-100 text-center space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white mx-auto flex items-center justify-center shadow-md">
            <Car className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Have a vehicle sitting in your driveway?
          </h2>
          <p className="text-sm text-gray-600 max-w-xl mx-auto leading-relaxed">
            Turn your car into an income-generating asset. List in under 5 minutes, set your own daily pricing, and rent only to verified users with high honor scores.
          </p>
          <div className="pt-2">
            <Link href="/vehicles/new">
              <Button size="lg" variant="primary">
                List Your Vehicle Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
