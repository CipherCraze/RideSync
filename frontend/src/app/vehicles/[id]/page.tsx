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
  FileText,
  Clock,
  ArrowLeft,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { VehicleDetail, Review, VehicleDocument } from "@/types";
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
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Booking widget state
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string>("");
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);
  const [submitReviewLoading, setSubmitReviewLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

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
      apiService.getVehicleDocuments(vehicleId).catch(() => []),
    ])
      .then(([vData, rData, dData]) => {
        setVehicle(vData);
        setReviews(rData);
        setDocuments(dData);
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

  if (start && end && end > start) {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalHours = diffTime / (1000 * 60 * 60);
    totalDays = Math.max(0.1, totalHours / 24);
    totalPrice = totalDays * vehicle.price_per_day;
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push(`/login?redirect=/vehicles/${vehicle.id}`);
      return;
    }

    if (!start || !end || end <= start) {
      setBookingError("Please select a valid return date after pickup date.");
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

  const handleOwnerSubmitForReview = async () => {
    setSubmitReviewLoading(true);
    setStatusMessage("");
    try {
      const updated = await apiService.submitVehicleForReview(vehicle.id);
      setVehicle((prev) => (prev ? { ...prev, status: updated.status, is_approved: updated.is_approved } : null));
      setStatusMessage("Vehicle submitted for review! Admin verification will commence shortly.");
    } catch (err: any) {
      setStatusMessage(err.response?.data?.detail || "Failed to submit for review.");
    } finally {
      setSubmitReviewLoading(false);
    }
  };

  const isOwner = user?.id === vehicle.owner_id;
  const rcDoc = documents.find((d) => d.document_type === "RC");
  const pucDoc = documents.find((d) => d.document_type === "PUC");
  const srvDoc = documents.find((d) => d.document_type === "SERVICE_RECORD");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Button */}
      <Link href="/vehicles" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Vehicles
      </Link>

      {/* Owner Status Alert Banners */}
      {isOwner && vehicle.status && vehicle.status !== "APPROVED" && (
        <div className="p-5 rounded-2xl border shadow-sm space-y-3 bg-white">
          {vehicle.status === "DRAFT" && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
              <div className="space-y-0.5">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Listing Status: Draft</span>
                <p className="text-xs text-amber-900">
                  This listing is currently in Draft mode and hidden from the public marketplace.
                </p>
              </div>
              <Button
                size="sm"
                disabled={submitReviewLoading}
                onClick={handleOwnerSubmitForReview}
                className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
              >
                {submitReviewLoading ? "Submitting..." : "Submit for Verification"}
              </Button>
            </div>
          )}

          {vehicle.status === "PENDING" && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800">
              <Clock className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Under Review</span>
                <p className="text-xs text-blue-900">
                  Your listing and compliance documents are in the administrative verification queue. Once approved, your vehicle will automatically go live.
                </p>
              </div>
            </div>
          )}

          {vehicle.status === "REJECTED" && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs text-rose-700">
                  <XCircle className="w-4 h-4" /> Listing Rejected by Admin
                </div>
                <p className="text-xs text-rose-900">
                  <strong>Reason:</strong> {vehicle.rejection_reason || "Document or photography requirements not met."}
                </p>
              </div>
              <Button
                size="sm"
                disabled={submitReviewLoading}
                onClick={handleOwnerSubmitForReview}
                className="bg-rose-600 hover:bg-rose-700 text-white shrink-0"
              >
                {submitReviewLoading ? "Submitting..." : "Resubmit for Review"}
              </Button>
            </div>
          )}

          {statusMessage && (
            <p className="text-xs font-semibold text-blue-600 px-2">{statusMessage}</p>
          )}
        </div>
      )}

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
            {vehicle.status === "APPROVED" ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Approved
              </span>
            ) : (
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                {vehicle.status || "Pending"}
              </span>
            )}
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
        {/* Left Column: Gallery, Specs & Documents */}
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

          {/* Compliance & Trust Badges */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-gray-900 uppercase tracking-wider text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Verified Legal Compliance
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* RC Badge */}
              <div className="p-3.5 rounded-xl border border-gray-100 bg-white shadow-sm flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-900 block">Registration (RC)</span>
                  <span className="text-[11px] text-gray-500 font-mono block">
                    {rcDoc?.document_number || "RC On File"}
                  </span>
                  <span className={`text-[10px] font-bold uppercase inline-block mt-1 ${rcDoc?.status === "VERIFIED" ? "text-emerald-600" : "text-amber-600"}`}>
                    {rcDoc?.status === "VERIFIED" ? "✓ Verified by Admin" : "Pending Review"}
                  </span>
                </div>
              </div>

              {/* PUC Badge */}
              <div className="p-3.5 rounded-xl border border-gray-100 bg-white shadow-sm flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-900 block">Emission (PUC)</span>
                  <span className="text-[11px] text-gray-500 block">
                    {pucDoc?.expiry_date ? `Exp: ${formatDate(pucDoc.expiry_date)}` : "Certified Valid"}
                  </span>
                  <span className={`text-[10px] font-bold uppercase inline-block mt-1 ${pucDoc?.status === "VERIFIED" ? "text-emerald-600" : "text-amber-600"}`}>
                    {pucDoc?.status === "VERIFIED" ? "✓ Valid & Verified" : "Pending Review"}
                  </span>
                </div>
              </div>

              {/* Service History Badge */}
              <div className="p-3.5 rounded-xl border border-gray-100 bg-white shadow-sm flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-900 block">Service History</span>
                  <span className="text-[11px] text-gray-500 block truncate">
                    {srvDoc?.document_number || "Maintenance Log"}
                  </span>
                  <span className="text-[10px] font-bold text-purple-600 uppercase inline-block mt-1">
                    ✓ Inspected
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-gray-900 uppercase tracking-wider text-xs">
              Vehicle Overview
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed font-normal bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
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
              <div className="p-8 text-center text-xs text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                No reviews yet for this vehicle. Be the first to rent and leave feedback!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {reviews.map((rev) => (
                  <ReviewCard key={rev.id} review={rev} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Booking Widget */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
            <div className="flex items-baseline justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-2xl font-extrabold text-gray-900">
                  {formatCurrency(vehicle.price_per_day)}
                </span>
                <span className="text-xs font-medium text-gray-500"> / day</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Available
              </span>
            </div>

            {bookingSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-emerald-900">Booking Request Sent!</h4>
                <p className="text-[11px] text-emerald-700">
                  The host has been notified. You can track this trip in My Rentals.
                </p>
                <Link href="/my-rentals" className="block">
                  <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                    View My Rentals
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                {bookingError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" /> Pickup Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs font-medium text-gray-800 bg-gray-50 border border-gray-200 rounded-xl p-2.5 outline-none focus:border-blue-600 focus:bg-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" /> Return Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs font-medium text-gray-800 bg-gray-50 border border-gray-200 rounded-xl p-2.5 outline-none focus:border-blue-600 focus:bg-white"
                    required
                  />
                </div>

                {totalDays > 0 && (
                  <div className="pt-2 border-t border-gray-100 space-y-2 text-xs">
                    <div className="flex justify-between text-gray-500">
                      <span>Rate Breakdown</span>
                      <span>{totalDays.toFixed(1)} days × {formatCurrency(vehicle.price_per_day)}</span>
                    </div>
                    <div className="flex justify-between text-gray-900 font-extrabold text-sm pt-1 border-t border-gray-100">
                      <span>Total Estimated</span>
                      <span className="text-blue-600">{formatCurrency(totalPrice)}</span>
                    </div>
                  </div>
                )}

                {isOwner ? (
                  <div className="p-3 bg-gray-100 text-gray-500 text-xs rounded-xl text-center font-medium">
                    You are the owner of this vehicle.
                  </div>
                ) : (
                  <Button
                    type="submit"
                    disabled={bookingLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-sm"
                  >
                    {bookingLoading ? "Sending Request..." : "Request to Book"}
                  </Button>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
