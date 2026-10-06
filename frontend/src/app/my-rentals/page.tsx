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
import { Badge } from "@/components/ui/Badge";
import { AlertTriangle, Receipt, User, ExternalLink } from "lucide-react";

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

  const handlePayment = async (bookingId: number) => {
    try {
      await apiService.processPayment(bookingId);
      alert("Payment successful!");
      fetchRentals();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Payment failed.");
    }
  };

  const viewReceipt = async (bookingId: number) => {
    try {
      const receipt = await apiService.getBookingReceipt(bookingId);
      if (receipt.length > 0) {
         alert(`Receipt:\nAmount: $${receipt[0].amount}\nStatus: ${receipt[0].status}\nDate: ${formatDate(receipt[0].created_at)}`);
      } else {
         alert("No receipt found.");
      }
    } catch (err: any) {
      alert("Failed to fetch receipt.");
    }
  };

  const handleProposeRadius = async (bookingId: number) => {
    const radiusStr = prompt("Enter permitted operational radius in km (e.g., 35):", "35");
    if (!radiusStr) return;
    const radius = parseFloat(radiusStr);
    if (isNaN(radius) || radius < 5 || radius > 300) {
      alert("Please enter a valid radius between 5 km and 300 km.");
      return;
    }
    try {
      await apiService.proposeBookingRadius(bookingId, radius);
      alert(`Proposed ${radius} km radius to host.`);
      fetchRentals();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to propose radius.");
    }
  };

  const handleRespondRadius = async (bookingId: number, action: "ACCEPT" | "REJECT") => {
    try {
      await apiService.respondBookingRadius(bookingId, action);
      alert(action === "ACCEPT" ? "Permitted radius accepted!" : "Radius proposal declined.");
      fetchRentals();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to respond to proposal.");
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-base text-gray-900">
                      {b.vehicle?.brand} {b.vehicle?.model}
                    </h3>
                    <BookingStatusBadge status={b.status} />
                    {b.payment_status === "PAID" && <Badge variant="default" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">Paid</Badge>}
                    {b.payment_status === "REFUNDED" && <Badge variant="outline" className="text-gray-500 border-gray-300">Refunded</Badge>}
                    {b.is_overdue && (
                       <Badge variant="danger" className="animate-pulse flex items-center gap-1">
                         <AlertTriangle className="w-3 h-3" /> Overdue
                       </Badge>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>
                      {formatDate(b.start_date)} - {formatDate(b.end_date)}
                    </span>
                  </p>

                  <div className="pt-1 flex items-center gap-3 text-xs">
                    <span className="text-gray-500">
                      Host:{" "}
                      <Link
                        href={`/profile/${b.owner_id}`}
                        className="font-bold text-gray-800 hover:text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        <span>{b.owner?.full_name}</span>
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                      </Link>
                    </span>
                    {b.owner && <HonorScoreBadge score={b.owner.honor_score} showIcon={false} />}
                  </div>

                  {/* Permitted Geofence Radius Info & Proposal */}
                  <div className="pt-2 flex items-center gap-2 flex-wrap text-xs">
                    <span className="inline-flex items-center gap-1 font-semibold text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-200">
                      📍 Permitted Radius: {b.permitted_radius_km || 25} km
                    </span>
                    {b.radius_proposal_status === "PENDING" && b.radius_proposal_by === "OWNER" && (
                      <span className="inline-flex items-center gap-1.5 font-medium text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-full">
                        Host proposed {b.proposed_radius_km} km
                        <button
                          onClick={() => handleRespondRadius(b.id, "ACCEPT")}
                          className="ml-1 text-emerald-700 font-bold hover:underline"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRespondRadius(b.id, "REJECT")}
                          className="ml-1 text-rose-700 font-bold hover:underline"
                        >
                          Decline
                        </button>
                      </span>
                    )}
                    {b.radius_proposal_status === "PENDING" && b.radius_proposal_by === "RENTER" && (
                      <span className="text-amber-600 font-medium italic">
                        (You proposed {b.proposed_radius_km} km — awaiting host)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Price & Action Buttons */}
              <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 pt-4 md:pt-0 border-t md:border-0 border-gray-100">
                <div className="text-left md:text-right">
                  <span className="text-xs text-gray-400 block font-medium">Total Cost</span>
                  <span className="text-xl font-extrabold text-gray-900">{formatCurrency(b.total_price)}</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {/* Propose Radius Button during confirmed or active bookings */}
                  {(b.status === "CONFIRMED" || b.status === "RENTAL_ACTIVE") && b.radius_proposal_status !== "PENDING" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleProposeRadius(b.id)}
                      className="text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                    >
                      Propose Radius
                    </Button>
                  )}

                  {b.payment_status === "PENDING" && (b.status === "CONFIRMED" || b.status === "PENDING") && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handlePayment(b.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Pay Now
                    </Button>
                  )}

                  {b.payment_status === "PAID" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewReceipt(b.id)}
                      className="gap-1 text-gray-600"
                    >
                      <Receipt className="w-4 h-4" /> Receipt
                    </Button>
                  )}

                  {b.status === "CONFIRMED" && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleUpdateStatus(b.id, "RENTAL_ACTIVE")}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      Confirm Pickup (Start Trip)
                    </Button>
                  )}

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
                    <>
                      <Link href={`/profile/${b.owner_id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold"
                        >
                          <User className="w-3.5 h-3.5 text-blue-600" />
                          <span>View Owner Profile</span>
                        </Button>
                      </Link>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedReviewBooking(b)}
                        className="gap-1 border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-50"
                      >
                        <Star className="w-3.5 h-3.5 fill-blue-600" /> Write Review (+5 Honor)
                      </Button>
                    </>
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
