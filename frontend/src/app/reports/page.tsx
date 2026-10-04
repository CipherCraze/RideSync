"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldAlert, Send, Clock, CheckCircle2, XCircle, AlertCircle, FileText } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiService } from "@/lib/api";
import { ReportItem } from "@/types";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

function ReportsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const [reason, setReason] = useState("INAPPROPRIATE_BEHAVIOR");
  const [details, setDetails] = useState("");
  const [reportedUserId, setReportedUserId] = useState("");
  const [reportedVehicleId, setReportedVehicleId] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [reviewId, setReviewId] = useState("");

  const [myReports, setMyReports] = useState<ReportItem[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const qUserId = searchParams.get("reported_user_id");
    const qVehicleId = searchParams.get("reported_vehicle_id");
    const qBookingId = searchParams.get("booking_id");
    const qReviewId = searchParams.get("review_id");

    if (qUserId) setReportedUserId(qUserId);
    if (qVehicleId) setReportedVehicleId(qVehicleId);
    if (qBookingId) setBookingId(qBookingId);
    if (qReviewId) {
      setReviewId(qReviewId);
      setReason("ABUSIVE_REVIEW");
    }
  }, [searchParams]);

  const loadMyReports = () => {
    if (!user) return;
    setLoadingReports(true);
    apiService
      .getMyReports()
      .then((data) => setMyReports(data))
      .catch(() => {})
      .finally(() => setLoadingReports(false));
  };

  useEffect(() => {
    loadMyReports();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) {
      setError("Please describe the issue in detail.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await apiService.createReport({
        reason,
        details,
        description: details,
        reported_user_id: reportedUserId ? parseInt(reportedUserId) : undefined,
        reported_vehicle_id: reportedVehicleId ? parseInt(reportedVehicleId) : undefined,
        booking_id: bookingId ? parseInt(bookingId) : undefined,
        review_id: reviewId ? parseInt(reviewId) : undefined,
      });
      setSuccess(true);
      loadMyReports();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RESOLVED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Resolved
          </span>
        );
      case "UNDER_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            <Clock className="w-3 h-3" /> Under Review
          </span>
        );
      case "REJECTED":
      case "DISMISSED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            <AlertCircle className="w-3 h-3" /> Open
          </span>
        );
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div className="space-y-1 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center mb-2 border border-rose-100">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Trust, Safety & Dispute Center
        </h1>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          RideSync takes community trust, safety, and mutual respect seriously. Submit any concern for rapid admin moderation.
        </p>
      </div>

      {success ? (
        <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-3">
          <h3 className="font-bold text-emerald-900 text-base">Dispute / Report Filed Successfully</h3>
          <p className="text-xs text-emerald-700 leading-relaxed">
            Your ticket is registered with our administration team. You will receive real-time notifications as its status updates.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSuccess(false);
              setDetails("");
            }}
          >
            File Another Report
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-subtle space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
              Dispute Category
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-blue-600"
            >
              <option value="INAPPROPRIATE_BEHAVIOR">Inappropriate Behavior or Hostility</option>
              <option value="ABUSIVE_REVIEW">Abusive, False or Defamatory Review</option>
              <option value="LATE_RETURN">Unannounced Late Vehicle Return</option>
              <option value="VEHICLE_DAMAGE">Vehicle Damage or Dirty Return</option>
              <option value="FAKE_LISTING">Misleading Specs or Fake Listing</option>
              <option value="FRAUD">Fraud or Off-Platform Solicitation</option>
              <option value="OTHER">Other Policy Issue</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Reported User ID (Optional)"
              type="number"
              placeholder="User ID"
              value={reportedUserId}
              onChange={(e) => setReportedUserId(e.target.value)}
            />
            <Input
              label="Associated Booking / Trip # (Optional)"
              type="number"
              placeholder="Booking ID"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
            />
            <Input
              label="Reported Review ID (Optional)"
              type="number"
              placeholder="Review ID"
              value={reviewId}
              onChange={(e) => setReviewId(e.target.value)}
            />
            <Input
              label="Vehicle ID (Optional)"
              type="number"
              placeholder="Vehicle ID"
              value={reportedVehicleId}
              onChange={(e) => setReportedVehicleId(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
              Detailed Description
            </label>
            <textarea
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe what occurred with specific timestamps or booking details..."
              className="w-full p-3 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
              required
            />
          </div>

          <Button type="submit" variant="danger" size="md" className="w-full gap-2" isLoading={submitting}>
            <Send className="w-4 h-4" /> Submit for Admin Review
          </Button>
        </form>
      )}

      {/* User's Filed Reports Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-subtle space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" /> My Filed Reports & Tickets ({myReports.length})
        </h2>

        {loadingReports ? (
          <div className="py-8 text-center text-xs text-gray-400">Loading your reports...</div>
        ) : myReports.length === 0 ? (
          <p className="text-xs text-gray-400 italic">You have no active or historical disputes filed.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {myReports.map((r) => (
              <div key={r.id} className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-gray-900">Ticket #{r.id}</span>
                    <span className="text-xs text-gray-600 font-medium">({r.reason})</span>
                  </div>
                  {getStatusBadge(r.status)}
                </div>

                <p className="text-xs text-gray-700 leading-relaxed font-normal">
                  {r.details || r.description}
                </p>

                {r.admin_notes && (
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-blue-900 space-y-1">
                    <span className="font-bold block text-[10px] text-blue-600 uppercase tracking-wider">
                      Admin Resolution Note
                    </span>
                    <p className="text-xs text-blue-800">{r.admin_notes}</p>
                  </div>
                )}

                <div className="text-[10px] text-gray-400 pt-1">
                  Filed on {formatDate(r.created_at)}
                  {r.resolved_at && ` • Resolved on ${formatDate(r.resolved_at)}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-4 py-12 text-center text-sm text-gray-500">
          Loading Dispute Center...
        </div>
      }
    >
      <ReportsContent />
    </Suspense>
  );
}
