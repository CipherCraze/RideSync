"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Users,
  Car,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Award,
  Ban,
  Search,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiService } from "@/lib/api";
import { AdminAnalytics, Vehicle, User, ReportItem } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { HonorScoreBadge } from "@/components/ui/HonorScoreBadge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [pendingVehicles, setPendingVehicles] = useState<Vehicle[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"VEHICLES" | "USERS" | "REPORTS" | "HONOR">("VEHICLES");

  // Honor score adjustment modal state
  const [selectedUserForHonor, setSelectedUserForHonor] = useState<User | null>(null);
  const [pointsChange, setPointsChange] = useState<number>(10);
  const [honorReason, setHonorReason] = useState<string>("");
  const [adjustingHonor, setAdjustingHonor] = useState(false);

  const fetchAdminData = () => {
    setLoading(true);
    Promise.all([
      apiService.getAdminAnalytics(),
      apiService.getPendingVehicles(),
      apiService.getPendingVerifications(),
      apiService.getAdminReports(),
    ])
      .then(([analyticsData, vehiclesData, usersData, reportsData]) => {
        setAnalytics(analyticsData);
        setPendingVehicles(vehiclesData);
        setPendingUsers(usersData);
        setReports(reportsData);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user && !user.is_admin) {
      router.push("/dashboard");
      return;
    }
    if (user?.is_admin) {
      fetchAdminData();
    }
  }, [user, router]);

  const handleApproveVehicle = async (id: number) => {
    try {
      await apiService.approveVehicle(id);
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to approve vehicle.");
    }
  };

  const handleVerifyUser = async (id: number) => {
    try {
      await apiService.verifyUser(id);
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to verify user.");
    }
  };

  const handleToggleSuspendUser = async (id: number) => {
    try {
      await apiService.suspendUser(id);
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to toggle user suspension.");
    }
  };

  const handleResolveReport = async (id: number, status: string) => {
    try {
      await apiService.updateAdminReport(id, { status, admin_notes: `Marked as ${status} by admin.` });
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to update report.");
    }
  };

  const handleAdjustHonorScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForHonor || !honorReason.trim()) return;

    setAdjustingHonor(true);
    try {
      await apiService.adjustHonorScore({
        user_id: selectedUserForHonor.id,
        points_change: Number(pointsChange),
        reason: honorReason,
      });
      setSelectedUserForHonor(null);
      setHonorReason("");
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to adjust honor score.");
    } finally {
      setAdjustingHonor(false);
    }
  };

  if (!user || !user.is_admin || loading) {
    return <div className="max-w-7xl mx-auto p-12 text-center text-xs text-gray-500">Loading admin command center...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-gray-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold mb-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" /> Platform Security & Administration
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Admin Command Dashboard
          </h1>
        </div>
      </div>

      {/* Analytics Overview Cards */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-subtle space-y-1">
            <span className="text-[11px] font-semibold uppercase text-gray-400">Total Registered Users</span>
            <span className="text-2xl font-extrabold text-gray-900 block">{analytics.total_users}</span>
            <span className="text-[11px] text-emerald-600 font-medium">{analytics.verified_users} Verified Drivers</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-subtle space-y-1">
            <span className="text-[11px] font-semibold uppercase text-gray-400">Total Listings</span>
            <span className="text-2xl font-extrabold text-gray-900 block">{analytics.total_vehicles}</span>
            <span className="text-[11px] text-amber-600 font-bold">{analytics.pending_vehicles} Pending Approval</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-subtle space-y-1">
            <span className="text-[11px] font-semibold uppercase text-gray-400">Active Rentals</span>
            <span className="text-2xl font-extrabold text-blue-600 block">{analytics.active_bookings}</span>
            <span className="text-[11px] text-gray-500">{analytics.completed_bookings} Completed</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-subtle space-y-1">
            <span className="text-[11px] font-semibold uppercase text-gray-400">Open Reports</span>
            <span className="text-2xl font-extrabold text-rose-600 block">{analytics.pending_reports}</span>
            <span className="text-[11px] text-gray-500">{analytics.total_reports} Total Filed</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-subtle space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold uppercase text-gray-400">Avg Honor Score</span>
            <span className="text-2xl font-extrabold text-gray-900 block">{analytics.average_honor_score} Pts</span>
            <span className="text-[11px] text-emerald-600 font-bold">Trusted Community</span>
          </div>
        </div>
      )}

      {/* Control Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("VEHICLES")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === "VEHICLES"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Vehicle Approvals ({pendingVehicles.length})
        </button>

        <button
          onClick={() => setActiveTab("USERS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === "USERS"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          License Verification Queue ({pendingUsers.length})
        </button>

        <button
          onClick={() => setActiveTab("REPORTS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === "REPORTS"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Violation Reports ({reports.filter((r) => r.status === "PENDING").length})
        </button>

        <button
          onClick={() => setActiveTab("HONOR")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === "HONOR"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Honor Score Adjustment Tool
        </button>
      </div>

      {/* Tab 1: Vehicle Approval Queue */}
      {activeTab === "VEHICLES" && (
        <div className="space-y-4">
          {pendingVehicles.length === 0 ? (
            <div className="text-center py-16 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 text-xs text-gray-400">
              No vehicles pending approval. All listings are verified live.
            </div>
          ) : (
            pendingVehicles.map((v) => (
              <div
                key={v.id}
                className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={v.images[0]?.image_url || "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1200&q=80"}
                    alt={v.brand}
                    className="w-24 h-20 rounded-2xl object-cover shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-gray-900">
                        {v.brand} {v.model} ({v.year})
                      </h3>
                      <Badge variant="warning">Pending Approval</Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      Host: <strong>{v.owner?.full_name}</strong> • {v.pickup_location}
                    </p>
                    <p className="text-xs text-blue-600 font-bold">{formatCurrency(v.price_per_day)}/day</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleApproveVehicle(v.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve & Publish
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: User Verification Queue */}
      {activeTab === "USERS" && (
        <div className="space-y-4">
          {pendingUsers.length === 0 ? (
            <div className="text-center py-16 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 text-xs text-gray-400">
              No pending license verification requests.
            </div>
          ) : (
            pendingUsers.map((u) => (
              <div
                key={u.id}
                className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={u.profile_picture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80"}
                    alt={u.full_name}
                    className="w-14 h-14 rounded-full object-cover shrink-0"
                  />
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900">{u.full_name}</h3>
                    <p className="text-xs text-gray-500">{u.email} • {u.phone || "No phone"}</p>
                    <div className="mt-1 font-mono text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded w-fit">
                      License #: {u.driving_license_number}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleVerifyUser(u.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Verify & Reward +10 Pts
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleSuspendUser(u.id)}
                    className="text-rose-600 border-rose-200 hover:bg-rose-50"
                  >
                    <Ban className="w-4 h-4" /> Suspend
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Violation Reports */}
      {activeTab === "REPORTS" && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="text-center py-16 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 text-xs text-gray-400">
              No violation reports recorded.
            </div>
          ) : (
            reports.map((r) => (
              <div key={r.id} className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={r.status === "PENDING" ? "warning" : "success"}>{r.status}</Badge>
                    <span className="text-xs font-bold text-gray-900">{r.reason}</span>
                  </div>
                  <span className="text-[11px] text-gray-400">{formatDate(r.created_at)}</span>
                </div>

                <p className="text-xs text-gray-700 leading-relaxed font-normal bg-gray-50 p-3 rounded-xl">
                  "{r.details}"
                </p>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <span className="text-gray-500">
                    Filed by: <strong>{r.reporter?.full_name}</strong>
                  </span>

                  {r.status === "PENDING" && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolveReport(r.id, "DISMISSED")}
                        className="text-gray-600"
                      >
                        Dismiss
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleResolveReport(r.id, "RESOLVED")}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        Resolve Report
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 4: Honor Score Adjustment Tool */}
      {activeTab === "HONOR" && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-subtle space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-900">Honor Score Manual Adjustment Engine</h3>
            <p className="text-xs text-gray-500">
              Manually add or deduct honor score points for any user with mandatory audit reason logging.
            </p>
          </div>

          <form onSubmit={handleAdjustHonorScoreSubmit} className="space-y-4 max-w-xl">
            <Input
              label="Target User ID"
              type="number"
              placeholder="Enter User ID (e.g. 2)"
              onChange={(e) => setSelectedUserForHonor({ id: parseInt(e.target.value) } as any)}
              required
            />

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Points Delta (+ / -)
              </label>
              <input
                type="number"
                value={pointsChange}
                onChange={(e) => setPointsChange(parseInt(e.target.value))}
                placeholder="e.g. +10 or -15"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-blue-600 font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Audit Reason Description
              </label>
              <textarea
                rows={3}
                value={honorReason}
                onChange={(e) => setHonorReason(e.target.value)}
                placeholder="e.g. Outstanding community contribution / Unresolved damage dispute..."
                className="w-full p-3 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-blue-600"
                required
              />
            </div>

            <Button type="submit" variant="primary" size="md" isLoading={adjustingHonor}>
              Apply Honor Score Adjustment
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
