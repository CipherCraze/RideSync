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
  EyeOff,
  Eye,
  Clock,
  ExternalLink,
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
  const [activeTab, setActiveTab] = useState<"VEHICLES" | "USERS" | "REPORTS" | "HONOR">("REPORTS");

  // Report filter and resolution state
  const [reportStatusFilter, setReportStatusFilter] = useState<string>("ALL");
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [resolveStatus, setResolveStatus] = useState<string>("RESOLVED");
  const [adminNote, setAdminNote] = useState<string>("");
  const [penaltyPoints, setPenaltyPoints] = useState<number>(0);
  const [hideAbusiveReview, setHideAbusiveReview] = useState<boolean>(false);
  const [resolvingReport, setResolvingReport] = useState<boolean>(false);

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

  const handleOpenResolveModal = (report: ReportItem) => {
    setSelectedReport(report);
    setResolveStatus("RESOLVED");
    setAdminNote(report.admin_notes || "");
    setPenaltyPoints(0);
    setHideAbusiveReview(!!report.review_id);
  };

  const handleResolveReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    setResolvingReport(true);
    try {
      await apiService.updateAdminReport(selectedReport.id, {
        status: resolveStatus,
        admin_notes: adminNote.trim() || undefined,
        honor_score_penalty: penaltyPoints > 0 ? penaltyPoints : undefined,
        hide_review: hideAbusiveReview,
      });

      setSelectedReport(null);
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to update report status.");
    } finally {
      setResolvingReport(false);
    }
  };

  const handleToggleHideReview = async (reviewId: number, currentlyHidden: boolean) => {
    try {
      await apiService.moderateReview(reviewId, !currentlyHidden);
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to moderate review.");
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

  const filteredReports = reports.filter((r) => {
    if (reportStatusFilter === "ALL") return true;
    if (reportStatusFilter === "OPEN") return r.status === "OPEN" || r.status === "PENDING";
    return r.status === reportStatusFilter;
  });

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
            <span className="text-[11px] font-semibold uppercase text-gray-400">Total Users</span>
            <span className="text-2xl font-extrabold text-gray-900 block">{analytics.total_users}</span>
            <span className="text-[11px] text-emerald-600 font-medium">{analytics.verified_users} Verified Drivers</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-subtle space-y-1">
            <span className="text-[11px] font-semibold uppercase text-gray-400">Vehicle Approvals</span>
            <span className="text-2xl font-extrabold text-gray-900 block">{analytics.pending_vehicles}</span>
            <span className="text-[11px] text-amber-600 font-bold">Pending Review</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-subtle space-y-1">
            <span className="text-[11px] font-semibold uppercase text-gray-400">Active Bookings</span>
            <span className="text-2xl font-extrabold text-blue-600 block">{analytics.active_bookings}</span>
            <span className="text-[11px] text-gray-500">{analytics.completed_bookings} Completed</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-subtle space-y-1">
            <span className="text-[11px] font-semibold uppercase text-gray-400">Open Disputes</span>
            <span className="text-2xl font-extrabold text-rose-600 block">{analytics.pending_reports}</span>
            <span className="text-[11px] text-gray-500">{analytics.total_reports} Total Filed</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-subtle space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold uppercase text-gray-400">Avg Honor Score</span>
            <span className="text-2xl font-extrabold text-gray-900 block">{analytics.average_honor_score} Pts</span>
            <span className="text-[11px] text-emerald-600 font-bold">Platform Trust Meter</span>
          </div>
        </div>
      )}

      {/* Control Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("REPORTS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === "REPORTS"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Reports & Moderation ({reports.length})
        </button>

        <button
          onClick={() => setActiveTab("HONOR")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === "HONOR"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Honor Score Engine
        </button>

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
          Driver Verifications ({pendingUsers.length})
        </button>
      </div>

      {/* Tab: Reports & Review Moderation */}
      {activeTab === "REPORTS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-bold text-gray-900">User Disputes & Moderation Tickets</h3>
            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs">
              {["ALL", "OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setReportStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    reportStatusFilter === st
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <div className="text-center py-16 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 text-xs text-gray-400">
              No reports found in this category.
            </div>
          ) : (
            filteredReports.map((r) => (
              <div key={r.id} className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-subtle space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        r.status === "RESOLVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : r.status === "UNDER_REVIEW"
                          ? "bg-blue-100 text-blue-800"
                          : r.status === "REJECTED" || r.status === "DISMISSED"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {r.status}
                    </span>
                    <span className="text-xs font-bold text-gray-900">Ticket #{r.id} • {r.reason}</span>
                  </div>
                  <span className="text-[11px] text-gray-400">{formatDate(r.created_at)}</span>
                </div>

                <div className="p-3 bg-gray-50 rounded-2xl text-xs space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Complaint Description</span>
                  <p className="text-gray-800 leading-relaxed font-normal">"{r.details || r.description}"</p>
                </div>

                {/* Associated Review Inspection */}
                {r.review && (
                  <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/70 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span className="font-bold text-amber-900">Reported Review #{r.review.id}</span>
                        {r.review.is_hidden && (
                          <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.2 rounded">
                            HIDDEN BY MODERATOR
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-amber-700">★ {r.review.rating}/5</span>
                    </div>
                    <p className="text-amber-950 italic">"{r.review.comment}"</p>
                    <div className="flex items-center justify-between text-[11px] text-amber-800 pt-1">
                      <span>Author ID: {r.review.reviewer_id}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleHideReview(r.review!.id, !!r.review!.is_hidden)}
                        className="text-xs gap-1 border-amber-300 hover:bg-amber-100"
                      >
                        {r.review.is_hidden ? (
                          <>
                            <Eye className="w-3.5 h-3.5" /> Unhide Review
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-rose-600" /> Hide / Remove Review
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 text-xs flex-wrap gap-2">
                  <div className="space-y-0.5 text-gray-500">
                    <div>
                      Reporter: <strong className="text-gray-900">{r.reporter?.full_name || `User #${r.reporter_id}`}</strong>
                    </div>
                    {r.reported_user && (
                      <div>
                        Reported User: <strong className="text-gray-900">{r.reported_user.full_name}</strong> (Honor: {r.reported_user.honor_score})
                      </div>
                    )}
                    {r.booking_id && (
                      <div>
                        Associated Trip: <strong className="text-blue-600">Booking #{r.booking_id}</strong>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenResolveModal(r)}
                      className="text-xs"
                    >
                      Process & Moderate Ticket
                    </Button>
                  </div>
                </div>

                {r.admin_notes && (
                  <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-100 text-xs text-blue-900">
                    <span className="font-bold text-[10px] text-blue-600 uppercase block">Admin Resolution Log</span>
                    {r.admin_notes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Honor Score Adjustment Tool */}
      {activeTab === "HONOR" && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-subtle space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-900">Honor Score Manual Adjustment Engine</h3>
            <p className="text-xs text-gray-500">
              Apply authorized honor score adjustments with full immutable audit history logging.
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
                placeholder="e.g. Confirmed late vehicle return penalty / Exemplary customer service bonus..."
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

      {/* Tab: Vehicle Approvals */}
      {activeTab === "VEHICLES" && (
        <div className="space-y-4">
          {pendingVehicles.length === 0 ? (
            <div className="text-center py-16 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 text-xs text-gray-400">
              No vehicle listings pending approval.
            </div>
          ) : (
            pendingVehicles.map((v) => (
              <div key={v.id} className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-subtle flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-gray-900">{v.brand} {v.model} ({v.year})</h4>
                  <p className="text-xs text-gray-500">{v.pickup_location} • {formatCurrency(v.price_per_day)}/day</p>
                </div>
                <Button variant="primary" size="sm" onClick={() => handleApproveVehicle(v.id)}>
                  Approve Listing
                </Button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Driver Verifications */}
      {activeTab === "USERS" && (
        <div className="space-y-4">
          {pendingUsers.length === 0 ? (
            <div className="text-center py-16 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 text-xs text-gray-400">
              No pending driver verification requests.
            </div>
          ) : (
            pendingUsers.map((u) => (
              <div key={u.id} className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-subtle flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-gray-900">{u.full_name}</h4>
                  <p className="text-xs text-gray-500">{u.email} • License: {u.driving_license_number}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="primary" size="sm" onClick={() => handleVerifyUser(u.id)}>
                    Verify Driver (+10 Pts)
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleToggleSuspendUser(u.id)} className="text-rose-600">
                    Suspend
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Moderate Report Modal */}
      {selectedReport && (
        <Modal
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          title={`Moderate Dispute #${selectedReport.id}`}
        >
          <form onSubmit={handleResolveReportSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Resolution Status
              </label>
              <select
                value={resolveStatus}
                onChange={(e) => setResolveStatus(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-blue-600"
              >
                <option value="RESOLVED">RESOLVED (Action Taken)</option>
                <option value="UNDER_REVIEW">UNDER_REVIEW (Investigation in Progress)</option>
                <option value="REJECTED">REJECTED (No Violation Found)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Admin Notes & Findings
              </label>
              <textarea
                rows={3}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Explain the outcome, rationale, and resolution details..."
                className="w-full p-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-blue-600"
                required
              />
            </div>

            {selectedReport.reported_user_id && (
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                  Honor Score Penalty on Reported User (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={penaltyPoints}
                  onChange={(e) => setPenaltyPoints(parseInt(e.target.value) || 0)}
                  placeholder="e.g. 10 or 15 points to deduct"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-blue-600"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Deducts specified points from user #{selectedReport.reported_user_id} and generates audit log.
                </span>
              </div>
            )}

            {selectedReport.review_id && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl">
                <input
                  type="checkbox"
                  id="hideReviewCheck"
                  checked={hideAbusiveReview}
                  onChange={(e) => setHideAbusiveReview(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="hideReviewCheck" className="text-xs font-bold text-rose-900 cursor-pointer">
                  Hide/Remove abusive review #{selectedReport.review_id} from public display
                </label>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedReport(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={resolvingReport}>
                Submit Resolution
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
