"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Check, X, Calendar, UserCheck, ShieldCheck, Car, Star } from "lucide-react";
import { Booking } from "@/types";
import { apiService } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { BookingStatusBadge } from "@/components/ui/BookingStatusBadge";
import { HonorScoreBadge } from "@/components/ui/HonorScoreBadge";
import { Button } from "@/components/ui/Button";
import { AddReviewModal } from "@/components/reviews/AddReviewModal";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function BookingRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReviewBooking, setSelectedReviewBooking] = useState<Booking | null>(null);

  const fetchRequests = () => {
    setLoading(true);
    apiService
      .getIncomingRequests()
      .then((data) => setRequests(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdateStatus = async (bookingId: number, status: string) => {
    try {
      await apiService.updateBookingStatus(bookingId, { status });
      fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to update status.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="pb-6 border-b border-gray-200/80">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Host Booking Requests
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Review incoming trip requests from community renters. Inspect honor scores and confirm bookings.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 space-y-3">
          <p className="text-sm font-bold text-gray-700">No rental requests received yet</p>
          <p className="text-xs text-gray-400">Make sure your listed vehicles are active and priced competitively.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
              {/* Renter & Vehicle Specs */}
              <div className="flex items-start gap-4">
                <img
                  src={
                    req.renter?.profile_picture ||
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80"
                  }
                  alt={req.renter?.full_name}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-blue-600/20 shrink-0"
                />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-gray-900">{req.renter?.full_name}</h3>
                    {req.renter && <HonorScoreBadge score={req.renter.honor_score} />}
                  </div>

                  <p className="text-xs font-semibold text-blue-600">
                    Vehicle: {req.vehicle?.brand} {req.vehicle?.model} ({formatCurrency(req.total_price)})
                  </p>

                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>
                      {formatDate(req.start_date)} - {formatDate(req.end_date)}
                    </span>
                  </p>
                </div>
              </div>

              {/* Status & Actions */}
              <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 pt-4 md:pt-0 border-t md:border-0 border-gray-100">
                <BookingStatusBadge status={req.status} />

                <div className="flex items-center gap-2">
                  {req.status === "PENDING" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(req.id, "REJECTED")}
                        className="text-rose-600 border-rose-200 hover:bg-rose-50 gap-1"
                      >
                        <X className="w-4 h-4" /> Decline
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleUpdateStatus(req.id, "CONFIRMED")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                      >
                        <Check className="w-4 h-4" /> Accept Request
                      </Button>
                    </>
                  )}

                  {req.status === "CONFIRMED" && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleUpdateStatus(req.id, "RENTAL_ACTIVE")}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Start Active Rental
                    </Button>
                  )}

                  {req.status === "RETURNED" && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleUpdateStatus(req.id, "COMPLETED")}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      Complete & Finalize Rental (+5 Pts)
                    </Button>
                  )}

                  {req.status === "COMPLETED" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedReviewBooking(req)}
                      className="gap-1 border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-50"
                    >
                      <Star className="w-3.5 h-3.5 fill-blue-600" /> Review Renter
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedReviewBooking && (
        <AddReviewModal
          isOpen={!!selectedReviewBooking}
          onClose={() => setSelectedReviewBooking(null)}
          bookingId={selectedReviewBooking.id}
          revieweeId={selectedReviewBooking.renter_id}
          title={`Review Renter ${selectedReviewBooking.renter?.full_name}`}
          reviewType="OWNER_TO_RENTER"
          onSuccess={fetchRequests}
        />
      )}
    </div>
  );
}
