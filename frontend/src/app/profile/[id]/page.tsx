"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  Star,
  MapPin,
  Car,
  Calendar,
  MessageSquare,
  ArrowLeft,
  Compass,
  Award,
  ExternalLink,
} from "lucide-react";
import { UserPublicDetail } from "@/types";
import { apiService } from "@/lib/api";
import { HonorScoreBadge } from "@/components/ui/HonorScoreBadge";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PublicProfilePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const userId = parseInt(resolvedParams.id);
  const router = useRouter();

  const [profile, setProfile] = useState<UserPublicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId || isNaN(userId)) {
      setError("Invalid user ID.");
      setLoading(false);
      return;
    }

    apiService
      .getPublicUserProfile(userId)
      .then((data) => {
        setProfile(data);
      })
      .catch((err) => {
        setError(err.response?.data?.detail || "User profile not found.");
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-xs text-gray-500">
        Loading public profile...
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl">
          {error || "Unable to display this user profile."}
        </div>
        <Link href="/vehicles">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Vehicles & Users
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Link */}
      <Link
        href="/vehicles"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Marketplace Discovery
      </Link>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <img
            src={
              profile.profile_picture ||
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80"
            }
            alt={profile.full_name}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-4 ring-blue-600/20 shadow-md shrink-0"
          />
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                {profile.full_name}
              </h1>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Community Verified
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" /> Joined {formatDate(profile.joined_date)}
              </span>
              <span>•</span>
              {profile.is_owner && (
                <span className="font-semibold text-blue-600">Vehicle Host</span>
              )}
              {profile.is_renter && (
                <span className="font-semibold text-purple-600">Verified Renter</span>
              )}
              {profile.address && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" /> {profile.address}
                  </span>
                </>
              )}
            </div>

            {profile.bio && (
              <p className="text-xs text-gray-600 italic max-w-xl pt-1">
                "{profile.bio}"
              </p>
            )}
          </div>
        </div>

        {/* Reputation & Honor Score Card */}
        <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
          <div className="text-left md:text-right space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Honor Reputation
            </span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold text-gray-900">{profile.honor_score}</span>
              <span className="text-xs text-gray-400">/ 100</span>
              <HonorScoreBadge score={profile.honor_score} />
            </div>
          </div>

          <Link href={`/messages?userId=${profile.id}`}>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <MessageSquare className="w-3.5 h-3.5" /> Message User
            </Button>
          </Link>
        </div>
      </div>

      {/* Community Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-xs text-center space-y-1">
          <span className="text-xl sm:text-2xl font-extrabold text-gray-900 block">
            {profile.active_listings_count}
          </span>
          <span className="text-xs text-gray-500 font-medium">Cars in Fleet</span>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-xs text-center space-y-1">
          <span className="text-xl sm:text-2xl font-extrabold text-emerald-600 block">
            {profile.completed_trips_count}
          </span>
          <span className="text-xs text-gray-500 font-medium">Completed Trips</span>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-xs text-center space-y-1">
          <div className="flex items-center justify-center gap-1">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-xl sm:text-2xl font-extrabold text-gray-900">
              {profile.rating_avg.toFixed(1)}
            </span>
          </div>
          <span className="text-xs text-gray-500 font-medium">Rating Score</span>
        </div>
      </div>

      {/* Host Active Vehicles Fleet */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Car className="w-5 h-5 text-blue-600" />
              Active Vehicles in Fleet ({profile.active_listings.length})
            </h2>
            <p className="text-xs text-gray-500">
              Vehicles currently listed and managed by {profile.full_name}.
            </p>
          </div>
        </div>

        {profile.active_listings.length === 0 ? (
          <div className="p-12 bg-gray-50/60 rounded-3xl border border-dashed border-gray-200 text-center text-xs text-gray-400">
            {profile.full_name} does not have any active vehicle listings at this time.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profile.active_listings.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-white rounded-3xl border border-gray-200/80 overflow-hidden shadow-sm hover:shadow-card transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[16/10] bg-gray-100">
                    <img
                      src={
                        vehicle.primary_image ||
                        "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1200&q=80"
                      }
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-gray-900 shadow-xs">
                      {formatCurrency(vehicle.price_per_day)} <span className="text-[10px] font-normal text-gray-500">/ day</span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="text-base font-extrabold text-gray-900">
                        {vehicle.brand} {vehicle.model}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <span>{vehicle.year}</span>
                        <span>•</span>
                        <span>{vehicle.vehicle_type}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 text-gray-800 font-semibold">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {vehicle.rating_avg.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{vehicle.pickup_location}</span>
                    </div>

                    {/* Geofence Display Parameter */}
                    <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 text-[11px] text-blue-900 flex items-center gap-2">
                      <Compass className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-medium truncate">
                        {vehicle.geofence_type === "CIRCULAR" && vehicle.geofence_radius_km
                          ? `Permitted Zone: ${vehicle.geofence_radius_km} km radius from ${vehicle.geofence_center_name || "City Center"}`
                          : "Geofence: Flexible (Coordinated upon booking)"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <Link href={`/vehicles/${vehicle.id}`}>
                    <Button variant="primary" size="sm" className="w-full text-xs font-bold">
                      View Vehicle & Book Trip
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
