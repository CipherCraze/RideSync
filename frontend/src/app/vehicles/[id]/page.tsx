"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Calendar,
  Users,
  Fuel,
  Gauge,
  Star,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  ArrowLeft,
} from "lucide-react";
import { VehicleDetail, Review } from "@/types";
import { apiService } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { VehicleGallery } from "@/components/vehicles/VehicleGallery";
import { HonorScoreBadge } from "@/components/ui/HonorScoreBadge";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const vehicleId = parseInt(resolvedParams.id);
  const router = useRouter();
  const { user } = useAuth();

  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Booking widget state
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string>("");
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);
  const [unavailableSlots, setUnavailableSlots] = useState<{start_date: string; end_date: string}[]>([]);

  useEffect(() => {
    // Set default dates (tomorrow to +3 days)
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() + 1);
    const end = new Date(today);
    end.setDate(today.getDate() + 4);

    setStartDate(start.toISOString().slice(0, 16));
    setEndDate(end.toISOString().slice(0, 16));

    Promise.all([
      apiService.getVehicle(vehicleId),
      apiService.getVehicleReviews(vehicleId),
      apiService.getVehicleAvailability(vehicleId),
    ])
      .then(([vData, rData, aData]) => {
        setVehicle(vData);
        setReviews(rData);
        setUnavailableSlots(aData);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [vehicleId]);

  if (loading || !vehicle) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs text-gray-500">
        Loading vehicle details...
      </div>
    );
  }

  // Calculate rental cost
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  let totalDays = 0;
  let totalPrice = 0;

  let totalHours = 0;

  if (start && end && end > start) {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    totalHours = diffTime / (1000 * 60 * 60);
    totalDays = Math.max(0.1, totalHours / 24); // Show partial days
    totalPrice = totalDays * vehicle.price_per_day;
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push(`/login?redirect=/vehicles/${vehicle.id}`);
      return;
    }

    if (!startDate || !endDate) {
      setBookingError("Please select both start and end rental dates.");
      return;
    }

    if (totalDays <= 0) {
      setBookingError("End date must be after start date.");
      return;
    }

    setBookingLoading(true);
    setBookingError("");

    try {
      await apiService.createBooking({
        vehicle_id: vehicle.id,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
      });
      setBookingSuccess(true);
    } catch (err: any) {
      setBookingError(err.response?.data?.detail || "Failed to submit booking request.");
    } finally {
      setBookingLoading(false);
    }
  };

  const isOwner = user?.id === vehicle.owner_id;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Button */}
      <Link href="/vehicles" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Vehicles
      </Link>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {vehicle.vehicle_type}
            </span>
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">
              {vehicle.year}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {vehicle.brand} {vehicle.model}
          </h1>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
            <div className="flex items-center gap-1 text-gray-900 font-bold">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{vehicle.rating_avg.toFixed(1)}</span>
              <span className="text-gray-400 font-normal">({vehicle.rating_count} reviews)</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{vehicle.pickup_location}</span>
            </div>
          </div>
        </div>

        <div className="text-left md:text-right">
          <span className="text-3xl font-extrabold text-gray-900">
            {formatCurrency(vehicle.price_per_day)}
          </span>
          <span className="text-xs font-medium text-gray-500"> / day</span>
        </div>
      </div>

      {/* Gallery & Booking Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Gallery & Details */}
        <div className="lg:col-span-2 space-y-8">
          <VehicleGallery images={vehicle.images} />

          {/* Key Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-gray-50/80 rounded-2xl border border-gray-200/80 text-xs font-medium text-gray-700">
            <div className="space-y-1">
              <span className="text-gray-400 uppercase text-[10px] font-bold block">Capacity</span>
              <div className="flex items-center gap-1.5 font-bold text-gray-900">
                <Users className="w-4 h-4 text-blue-600" />
                <span>{vehicle.seats} Seats</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-gray-400 uppercase text-[10px] font-bold block">Fuel System</span>
              <div className="flex items-center gap-1.5 font-bold text-gray-900">
                <Fuel className="w-4 h-4 text-blue-600" />
                <span>{vehicle.fuel_type}</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-gray-400 uppercase text-[10px] font-bold block">Transmission</span>
              <div className="flex items-center gap-1.5 font-bold text-gray-900">
                <Gauge className="w-4 h-4 text-blue-600" />
                <span>{vehicle.transmission}</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-gray-400 uppercase text-[10px] font-bold block">Verification</span>
              <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified Listing</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-gray-900 uppercase tracking-wider text-xs">
              Vehicle Overview
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed font-normal bg-white p-5 rounded-2xl border border-gray-100 shadow-subtle">
              {vehicle.description}
            </p>
          </div>

          {/* Host Profile Box */}
          <div className="p-6 bg-blue-50/40 rounded-2xl border border-blue-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={vehicle.owner.profile_picture || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80"}
                  alt={vehicle.owner.full_name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-600/30"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-gray-900">{vehicle.owner.full_name}</h4>
                    {vehicle.owner.is_verified && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3 h-3" /> ID Verified
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">RideSync Host • Member</span>
                </div>
              </div>

              <HonorScoreBadge score={vehicle.owner.honor_score} />
            </div>

            {vehicle.owner.bio && (
              <p className="text-xs text-gray-600 italic">"{vehicle.owner.bio}"</p>
            )}
          </div>

          {/* Reviews Section */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">
                Verified Reviews ({reviews.length})
              </h3>
              <div className="flex items-center gap-1 text-xs font-bold text-gray-900">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{vehicle.rating_avg.toFixed(1)} / 5.0</span>
              </div>
            </div>

            {reviews.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No reviews written yet for this vehicle.</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Booking Card Widget */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-card space-y-6 sticky top-20">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <span className="text-2xl font-extrabold text-gray-900">
                  {formatCurrency(vehicle.price_per_day)}
                </span>
                <span className="text-xs text-gray-500"> / day</span>
              </div>
              <HonorScoreBadge score={vehicle.owner.honor_score} showIcon={false} />
            </div>

            {bookingSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-emerald-900 text-sm">Booking Request Sent!</h4>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  The owner {vehicle.owner.full_name} has received your request. You will be notified once confirmed.
                </p>
                <Link href="/my-rentals">
                  <Button variant="primary" size="sm" className="w-full mt-2">
                    View My Trips
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                {bookingError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                    {bookingError}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
                      Start Date
                    </label>
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
                      End Date
                    </label>
                    <input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                      required
                    />
                  </div>
                </div>

                {/* Price Breakdown */}
                {totalDays > 0 && (
                  <div className="p-3 bg-gray-50 rounded-xl space-y-2 text-xs border border-gray-100">
                    <div className="flex justify-between text-gray-600">
                      <span>
                        {formatCurrency(vehicle.price_per_day)} x {totalDays.toFixed(2)} day(s)
                      </span>
                      <span>{formatCurrency(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>RideSync Platform Service Fee</span>
                      <span className="text-emerald-600 font-semibold">$0.00</span>
                    </div>
                    <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-gray-900 text-sm">
                      <span>Total Estimated Cost</span>
                      <span className="text-blue-600">{formatCurrency(totalPrice)}</span>
                    </div>
                  </div>
                )}

                {isOwner ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl text-center font-medium">
                    This is your listed vehicle.
                  </div>
                ) : (
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    isLoading={bookingLoading}
                  >
                    Request Booking
                  </Button>
                )}
                
                {unavailableSlots.length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-xs font-bold text-gray-900 mb-2">Booked Timeslots</h4>
                    <div className="space-y-1">
                      {unavailableSlots.map((slot, idx) => (
                        <div key={idx} className="text-[11px] text-gray-500 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100 flex items-center justify-between">
                          <span>{new Date(slot.start_date).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
                          <span className="text-gray-300">-</span>
                          <span>{new Date(slot.end_date).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            )}

            <div className="text-[11px] text-gray-400 text-center leading-relaxed">
              Your Honor Score is evaluated on every request. No charge until host approves.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
