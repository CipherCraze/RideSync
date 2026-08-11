"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Car,
  FileText,
  Bell,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { HonorScoreBadge } from "@/components/ui/HonorScoreBadge";
import { BookingStatusBadge } from "@/components/ui/BookingStatusBadge";
import { Button } from "@/components/ui/Button";
import { apiService } from "@/lib/api";
import { Booking, HonorScoreHistory } from "@/types";
import { formatCurrency, formatDate, getHonorCategoryInfo } from "@/lib/utils";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [myRentals, setMyRentals] = useState<Booking[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<Booking[]>([]);
  const [honorHistory, setHonorHistory] = useState<HonorScoreHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/dashboard");
      return;
    }

    if (user) {
      Promise.all([
        apiService.getMyRentals(),
        apiService.getIncomingRequests(),
        apiService.getHonorHistory(),
      ])
        .then(([rentalsData, requestsData, honorData]) => {
          setMyRentals(rentalsData);
          setIncomingRequests(requestsData);
          setHonorHistory(honorData);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  if (authLoading || loading || !user) {
    return <div className="max-w-7xl mx-auto p-12 text-center text-xs text-gray-500">Loading dashboard...</div>;
  }

  const honorInfo = getHonorCategoryInfo(user.honor_score);
  const activeRentals = myRentals.filter((b) => b.status === "RENTAL_ACTIVE" || b.status === "CONFIRMED");
  const pendingRequests = incomingRequests.filter((b) => b.status === "PENDING");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Welcome back, {user.full_name}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage your peer-to-peer rentals, host requests, and community reputation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/vehicles/new">
            <Button variant="primary" size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" /> List Vehicle
            </Button>
          </Link>
        </div>
      </div>

      {/* Driver License Verification Callout */}
      {!user.is_verified && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900">Verify Your Driving License</h4>
              <p className="text-xs text-gray-600">
                Submit your driving license number to unlock verified host status and claim +10 Honor Score points.
              </p>
            </div>
          </div>
          <Link href="/profile">
            <Button variant="outline" size="sm" className="bg-white border-blue-300 text-blue-700 hover:bg-blue-50">
              Verify License Now
            </Button>
          </Link>
        </div>
      )}

      {/* Honor Score Feature Card */}
      <div className="bg-gradient-to-r from-gray-900 via-slate-900 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
              Community Honor Rating
            </span>
            <div className="flex items-center gap-3">
              <span className="text-4xl font-extrabold">{user.honor_score}</span>
              <span className="text-xs text-gray-400">/ 100 Points</span>
              <HonorScoreBadge score={user.honor_score} />
            </div>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <span className="text-xs font-semibold text-gray-300 block">{honorInfo.label} Standing</span>
            <span className="text-[11px] text-gray-400 max-w-xs block leading-relaxed">
              {honorInfo.description}
            </span>
          </div>
        </div>

        {/* Honor Score Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-400 font-medium">
            <span>Restricted (&lt;60)</span>
            <span>Warning (60-79)</span>
            <span>Good (80-94)</span>
            <span className="text-emerald-400 font-bold">Trusted (95-100)</span>
          </div>
          <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                user.honor_score >= 95
                  ? "bg-emerald-400 shadow-sm"
                  : user.honor_score >= 80
                  ? "bg-blue-500"
                  : user.honor_score >= 60
                  ? "bg-amber-400"
                  : "bg-rose-500"
              }`}
              style={{ width: `${user.honor_score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Active Trips</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">{activeRentals.length}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Car className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Incoming Requests</span>
            <span className="text-2xl font-extrabold text-blue-600 mt-1 block">{pendingRequests.length}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Vehicles Listed</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">{user.vehicles_count}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Reviews Received</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">{user.reviews_count}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Trips & Honor History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Rentals as Renter */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900">My Recent Trips</h3>
            <Link href="/my-rentals" className="text-xs font-bold text-blue-600 hover:underline">
              View All
            </Link>
          </div>

          {myRentals.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center italic">No trip bookings placed yet.</p>
          ) : (
            <div className="space-y-3">
              {myRentals.slice(0, 3).map((b) => (
                <div key={b.id} className="p-3.5 bg-gray-50/70 rounded-2xl border border-gray-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-gray-900 block text-sm">
                      {b.vehicle?.brand} {b.vehicle?.model}
                    </span>
                    <span className="text-gray-500 block text-[11px] mt-0.5">
                      {formatDate(b.start_date)} - {formatDate(b.end_date)}
                    </span>
                  </div>

                  <div className="text-right space-y-1">
                    <BookingStatusBadge status={b.status} />
                    <span className="block font-bold text-gray-900">{formatCurrency(b.total_price)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Honor Score Ledger / Audit Logs */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900">Honor Score Audit Log</h3>
            <span className="text-xs text-gray-400">Official Trail</span>
          </div>

          {honorHistory.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center italic">No audit records yet.</p>
          ) : (
            <div className="space-y-3">
              {honorHistory.slice(0, 4).map((h) => (
                <div key={h.id} className="p-3 bg-gray-50/70 rounded-2xl border border-gray-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-gray-800 block">{h.reason}</span>
                    <span className="text-[10px] text-gray-400 block">{formatDate(h.created_at)}</span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-extrabold text-sm ${
                        h.points_change > 0
                          ? "text-emerald-600"
                          : h.points_change < 0
                          ? "text-rose-600"
                          : "text-gray-500"
                      }`}
                    >
                      {h.points_change > 0 ? `+${h.points_change}` : h.points_change} Pts
                    </span>
                    <span className="block text-[10px] text-gray-500">Score: {h.new_score}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
