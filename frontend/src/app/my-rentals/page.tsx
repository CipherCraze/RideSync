"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Car, Calendar, Star, ShieldCheck, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { Booking } from "@/types";
import { apiService } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { BookingStatusBadge } from "@/components/ui/BookingStatusBadge";
import { HonorScoreBadge } from "@/components/ui/HonorScoreBadge";
import { Button } from "@/components/ui/Button";
import { AddReviewModal } from "@/components/reviews/AddReviewModal";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function MyRentalsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("ALL");

  // Review modal state
  const [selectedReviewBooking, setSelectedReviewBooking] = useState<Booking | null>(null);

  const fetchRentals = () => {
    setLoading(true);
    apiService
      .getMyRentals()
      .then((data) => setBookings(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRentals();
  }, []);

  const handleUpdateStatus = async (bookingId: number, status: string) => {
    try {
      await apiService.updateBookingStatus(bookingId, { status });
      fetchRentals();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to update booking status.");
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "ACTIVE") return b.status === "CONFIRMED" || b.status === "RENTAL_ACTIVE";
    if (activeTab === "PENDING") return b.status === "PENDING";
    if (activeTab === "COMPLETED") return b.status === "COMPLETED" || b.status === "RETURNED";
    if (activeTab === "CANCELLED") return b.status === "CANCELLED" || b.status === "REJECTED";
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            My Trips & Rentals
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Track your active rentals, pending requests, trip history, and host reviews
          </p>
        </div>

        <Link href="/vehicles">
          <Button variant="outline" size="sm" className="gap-1">
            <Car className="w-4 h-4" /> Rent Another Vehicle
          </Button>
        </Link>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-100">
        {[
          { key: "ALL", label: "All Trips" },
          { key: "ACTIVE", label: "Active & Confirmed" },
          { key: "PENDING", label: "Pending Approval" },
          { key: "COMPLETED", label: "Completed" },
          { key: "CANCELLED", label: "Cancelled / Declined" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 space-y-3">
          <p className="text-sm font-bold text-gray-700">No trips found in this category</p>
          <p className="text-xs text-gray-400">Explore the marketplace to book your next trip.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
              {/* Vehicle & Trip Info */}
              <div className="flex items-start gap-4">
                <img
                  src={
                    b.vehicle?.images[0]?.image_url ||
                    "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1200&q=80"
                  }
                  alt={b.vehicle?.brand}
                  className="w-24 h-20 rounded-2xl object-cover shrink-0"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-gray-900">
                      {b.vehicle?.brand} {b.vehicle?.model}
                    </h3>
                    <BookingStatusBadge status={b.status} />
                  </div>

                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>
                      {formatDate(b.start_date)} - {formatDate(b.end_date)}
                    </span>
                  </p>

                  <div className="pt-1 flex items-center gap-3 text-xs">
                    <span className="text-gray-500">
                      Host: <strong className="text-gray-800">{b.owner?.full_name}</strong>
                    </span>
                    {b.owner && <HonorScoreBadge score={b.owner.honor_score} showIcon={false} />}
                  </div>
                </div>
              </div>

              {/* Price & Action Buttons */}
              <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 pt-4 md:pt-0 border-t md:border-0 border-gray-100">
                <div className="text-left md:text-right">
                  <span className="text-xs text-gray-400 block font-medium">Total Cost</span>
                  <span className="text-xl font-extrabold text-gray-900">{formatCurrency(b.total_price)}</span>
                </div>

                <div className="flex items-center gap-2">
                  {b.status === "RENTAL_ACTIVE" && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleUpdateStatus(b.id, "RETURNED")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Return Vehicle
                    </Button>
                  )}

                  {b.status === "PENDING" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(b.id, "CANCELLED")}
                      className="text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      Cancel Request
                    </Button>
                  )}

                  {(b.status === "COMPLETED" || b.status === "RETURNED") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedReviewBooking(b)}
                      className="gap-1 border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-50"
                    >
                      <Star className="w-3.5 h-3.5 fill-blue-600" /> Write Review (+5 Honor)
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedReviewBooking && (
        <AddReviewModal
          isOpen={!!selectedReviewBooking}
          onClose={() => setSelectedReviewBooking(null)}
          bookingId={selectedReviewBooking.id}
          revieweeId={selectedReviewBooking.owner_id}
          vehicleId={selectedReviewBooking.vehicle_id}
          title={`Review Host & Vehicle for ${selectedReviewBooking.vehicle?.brand} ${selectedReviewBooking.vehicle?.model}`}
          reviewType="RENTER_TO_OWNER"
          onSuccess={fetchRentals}
        />
      )}
    </div>
  );
}
