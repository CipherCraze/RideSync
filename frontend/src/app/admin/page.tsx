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
  Camera,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiService } from "@/lib/api";
import { AdminAnalytics, Vehicle, User, ReportItem, VehicleDocument } from "@/types";
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
  const [pendingDocuments, setPendingDocuments] = useState<VehicleDocument[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"VEHICLES" | "DOCUMENTS" | "USERS" | "REPORTS" | "HONOR">("VEHICLES");

  // Report filter and resolution state
  const [reportStatusFilter, setReportStatusFilter] = useState<string>("ALL");
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [resolveStatus, setResolveStatus] = useState<string>("RESOLVED");
  const [adminNote, setAdminNote] = useState<string>("");
  const [penaltyPoints, setPenaltyPoints] = useState<number>(0);
  const [hideAbusiveReview, setHideAbusiveReview] = useState<boolean>(false);
  const [resolvingReport, setResolvingReport] = useState<boolean>(false);

  // Vehicle Rejection Modal
  const [selectedVehicleForReject, setSelectedVehicleForReject] = useState<Vehicle | null>(null);
  const [vehicleRejectReason, setVehicleRejectReason] = useState<string>("");
  const [rejectingVehicle, setRejectingVehicle] = useState(false);

  // Document Rejection Modal
  const [selectedDocForReject, setSelectedDocForReject] = useState<VehicleDocument | null>(null);
  const [docRejectReason, setDocRejectReason] = useState<string>("");
  const [rejectingDoc, setRejectingDoc] = useState(false);

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
      apiService.getPendingDocuments().catch(() => []),
      apiService.getPendingVerifications(),
      apiService.getAdminReports(),
    ])
      .then(([analyticsData, vehiclesData, docsData, usersData, reportsData]) => {
        setAnalytics(analyticsData);
        setPendingVehicles(vehiclesData);
        setPendingDocuments(docsData);
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

  const handleRejectVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleForReject || !vehicleRejectReason.trim()) return;

    setRejectingVehicle(true);
    try {
      await apiService.rejectVehicle(selectedVehicleForReject.id, vehicleRejectReason);
      setSelectedVehicleForReject(null);
      setVehicleRejectReason("");
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to reject vehicle.");
    } finally {
      setRejectingVehicle(false);
    }
  };

  const handleVerifyDocument = async (docId: number) => {
    try {
      await apiService.verifyDocument(docId);
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to verify document.");
    }
  };

  const handleRejectDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocForReject || !docRejectReason.trim()) return;

    setRejectingDoc(true);
    try {
      await apiService.rejectDocument(selectedDocForReject.id, docRejectReason);
      setSelectedDocForReject(null);
      setDocRejectReason("");
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to reject document.");
    } finally {
      setRejectingDoc(false);
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

  const handleSuspendUser = async (id: number) => {
    try {
      await apiService.suspendUser(id);
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to change user suspension status.");
    }
  };

  const handleResolveReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    setResolvingReport(true);
    try {
      await apiService.updateAdminReport(selectedReport.id, {
        status: resolveStatus,
        admin_notes: adminNote,
        honor_score_penalty: Number(penaltyPoints),
        hide_review: hideAbusiveReview,
      });

      setSelectedReport(null);
      setAdminNote("");
      setPenaltyPoints(0);
      setHideAbusiveReview(false);
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to update report resolution.");
    } finally {
      setResolvingReport(false);
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-1">
            <span className="text-[11px] font-semibold uppercase text-gray-400">Total Users</span>
            <span className="text-2xl font-extrabold text-gray-900 block">{analytics.total_users}</span>
            <span className="text-[11px] text-emerald-600 font-medium">{analytics.verified_users} Verified Drivers</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-1">
            <span className="text-[11px] font-semibold uppercase text-gray-400">Vehicle Approvals</span>
            <span className="text-2xl font-extrabold text-gray-900 block">{pendingVehicles.length}</span>
            <span className="text-[11px] text-amber-600 font-bold">Pending Review</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-1">
            <span className="text-[11px] font-semibold uppercase text-gray-400">Document Queue</span>
            <span className="text-2xl font-extrabold text-purple-600 block">{pendingDocuments.length}</span>
            <span className="text-[11px] text-purple-600 font-medium">Pending Verification</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-1">
            <span className="text-[11px] font-semibold uppercase text-gray-400">Open Disputes</span>
            <span className="text-2xl font-extrabold text-rose-600 block">{analytics.pending_reports}</span>
            <span className="text-[11px] text-gray-500">{analytics.total_reports} Total Filed</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold uppercase text-gray-400">Avg Honor Score</span>
            <span className="text-2xl font-extrabold text-gray-900 block">{analytics.average_honor_score} Pts</span>
            <span className="text-[11px] text-emerald-600 font-bold">Platform Trust Meter</span>
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
          onClick={() => setActiveTab("DOCUMENTS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === "DOCUMENTS"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Document Queue ({pendingDocuments.length})
        </button>

        <button
          onClick={() => setActiveTab("USERS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === "USERS"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Driver Identity Queue ({pendingUsers.length})
        </button>

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
          Honor Adjustment Engine
        </button>
      </div>

      {/* Tab: Vehicle Approvals */}
      {activeTab === "VEHICLES" && (
        <div className="space-y-6">
          {pendingVehicles.length === 0 ? (
            <div className="text-center py-16 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 text-xs text-gray-400">
              No vehicle listings pending approval.
            </div>
          ) : (
            pendingVehicles.map((v) => (
              <div key={v.id} className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        {v.vehicle_type}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600">
                        {v.year}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                        Status: {v.status || "PENDING"}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {v.brand} {v.model}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Location: {v.pickup_location} • Daily Rate: {formatCurrency(v.price_per_day)} • Owner ID: #{v.owner_id}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-rose-300 text-rose-700 hover:bg-rose-50"
                      onClick={() => setSelectedVehicleForReject(v)}
                    >
                      <XCircle className="w-4 h-4 mr-1 text-rose-600" />
                      Reject Listing
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleApproveVehicle(v.id)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Approve Listing
                    </Button>
                  </div>
                </div>

                {/* Multi-angle Photos Inspection */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-blue-600" /> Submitted Multi-Angle Photos ({v.images.length})
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                    {v.images.map((img, idx) => (
                      <div key={idx} className="relative rounded-xl overflow-hidden aspect-[4/3] bg-gray-100 border border-gray-200">
                        <img src={img.image_url} alt={`Vehicle view ${idx}`} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[9px] font-bold px-2 py-0.5 rounded">
                          {img.angle || "VIEW"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submitted Compliance Documents */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-purple-600" /> Compliance Documents ({v.documents?.length || 0})
                  </span>
                  {(!v.documents || v.documents.length === 0) ? (
                    <p className="text-xs text-gray-400 italic">No legal documents attached to this listing yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {v.documents.map((doc) => (
                        <div key={doc.id} className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/60 flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-gray-900 block">{doc.document_type}</span>
                            <span className="text-[11px] text-gray-500 font-mono block">
                              {doc.document_number || "No Ref #"}
                            </span>
                            {doc.expiry_date && (
                              <span className="text-[10px] text-gray-600 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-gray-400" /> Exp: {formatDate(doc.expiry_date)}
                              </span>
                            )}
                            <span className={`text-[10px] font-bold uppercase inline-block ${doc.status === "VERIFIED" ? "text-emerald-600" : doc.status === "REJECTED" ? "text-rose-600" : "text-amber-600"}`}>
                              {doc.status}
                            </span>
                          </div>
                          <a
                            href={doc.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-white border border-gray-200 text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Inspect Document"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Document Queue */}
      {activeTab === "DOCUMENTS" && (
        <div className="space-y-4">
          {pendingDocuments.length === 0 ? (
            <div className="text-center py-16 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 text-xs text-gray-400">
              No compliance documents pending verification in the queue.
            </div>
          ) : (
            pendingDocuments.map((doc) => (
              <div key={doc.id} className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700">
                      {doc.document_type}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700">
                      Status: {doc.status}
                    </span>
                    <span className="text-xs text-gray-400">Vehicle #{doc.vehicle_id}</span>
                  </div>
                  <div className="text-xs text-gray-700 font-medium pt-1">
                    {doc.document_number && <span>Ref #: <strong className="font-mono text-gray-900">{doc.document_number}</strong> • </span>}
                    {doc.expiry_date && <span>Expiry Date: <strong className="text-blue-600">{formatDate(doc.expiry_date)}</strong> • </span>}
                    <span>Uploaded: {formatDate(doc.uploaded_at)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={doc.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                    Inspect File
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-rose-300 text-rose-700 hover:bg-rose-50"
                    onClick={() => setSelectedDocForReject(doc)}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleVerifyDocument(doc.id)}
                  >
                    Verify
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Driver Verification Queue */}
      {activeTab === "USERS" && (
        <div className="space-y-4">
          {pendingUsers.length === 0 ? (
            <div className="text-center py-16 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 text-xs text-gray-400">
              No user license verification requests pending.
            </div>
          ) : (
            pendingUsers.map((u) => (
              <div key={u.id} className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={u.profile_picture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80"}
                    alt={u.full_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">{u.full_name}</h4>
                    <p className="text-xs text-gray-500 font-mono">
                      License: {u.driving_license_number || "Not provided"} • {u.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-rose-300 text-rose-700 hover:bg-rose-50"
                    onClick={() => handleSuspendUser(u.id)}
                  >
                    <Ban className="w-3.5 h-3.5 mr-1" /> Suspend
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handleVerifyUser(u.id)}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Verify Identity (+10 Pts)
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Reports & Moderation */}
      {activeTab === "REPORTS" && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            {["ALL", "OPEN", "RESOLVED", "DISMISSED"].map((status) => (
              <button
                key={status}
                onClick={() => setReportStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  reportStatusFilter === status
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {filteredReports.length === 0 ? (
            <div className="text-center py-16 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 text-xs text-gray-400">
              No reports found in this category.
            </div>
          ) : (
            filteredReports.map((r) => (
              <div key={r.id} className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-4 pb-3 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700">
                        {r.reason}
                      </span>
                      <span className="text-xs font-bold text-gray-400">Case #{r.id}</span>
                      <span className="text-xs text-gray-400">• Filed {formatDate(r.created_at)}</span>
                    </div>
                    <p className="text-xs text-gray-800 font-medium mt-2">{r.details || r.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${r.status === "RESOLVED" ? "bg-emerald-50 text-emerald-700" : r.status === "DISMISSED" ? "bg-gray-100 text-gray-600" : "bg-amber-50 text-amber-700"}`}>
                      {r.status}
                    </span>
                    {r.status === "PENDING" && (
                      <Button variant="outline" size="sm" onClick={() => setSelectedReport(r)}>
                        Resolve Case
                      </Button>
                    )}
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

      {/* Tab: Honor Adjustment Engine */}
      {activeTab === "HONOR" && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm space-y-6">
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

      {/* Modal: Reject Vehicle */}
      {selectedVehicleForReject && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedVehicleForReject(null)}
          title={`Reject Listing: ${selectedVehicleForReject.brand} ${selectedVehicleForReject.model}`}
        >
          <form onSubmit={handleRejectVehicleSubmit} className="space-y-4 pt-2">
            <p className="text-xs text-gray-500">
              Provide actionable feedback to the vehicle host. The listing will be set to <strong>REJECTED</strong> and the owner will receive this feedback.
            </p>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Rejection Reason *
              </label>
              <textarea
                rows={3}
                value={vehicleRejectReason}
                onChange={(e) => setVehicleRejectReason(e.target.value)}
                placeholder="e.g. PUC certificate is expired / Please upload clearer interior photos showing the dashboard..."
                className="w-full p-3 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-rose-600"
                required
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedVehicleForReject(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-rose-600 hover:bg-rose-700 text-white" isLoading={rejectingVehicle}>
                Confirm Rejection
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Reject Document */}
      {selectedDocForReject && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedDocForReject(null)}
          title={`Reject ${selectedDocForReject.document_type} Document`}
        >
          <form onSubmit={handleRejectDocSubmit} className="space-y-4 pt-2">
            <p className="text-xs text-gray-500">
              Please enter the reason for rejecting this {selectedDocForReject.document_type}.
            </p>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Rejection Reason *
              </label>
              <textarea
                rows={3}
                value={docRejectReason}
                onChange={(e) => setDocRejectReason(e.target.value)}
                placeholder="e.g. Document image is blurry / Certificate expired / Registration number does not match..."
                className="w-full p-3 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-rose-600"
                required
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedDocForReject(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-rose-600 hover:bg-rose-700 text-white" isLoading={rejectingDoc}>
                Reject Document
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Resolve Report */}
      {selectedReport && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedReport(null)}
          title={`Resolve Report Case #${selectedReport.id}`}
        >
          <form onSubmit={handleResolveReportSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Resolution Status</label>
              <select
                value={resolveStatus}
                onChange={(e) => setResolveStatus(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-blue-600"
              >
                <option value="RESOLVED">RESOLVED</option>
                <option value="DISMISSED">DISMISSED</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Admin Notes</label>
              <textarea
                rows={3}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Enter internal resolution notes..."
                className="w-full p-3 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
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
