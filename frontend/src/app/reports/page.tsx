"use client";

import React, { useState } from "react";
import { ShieldAlert, Send } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiService } from "@/lib/api";

export default function ReportsPage() {
  const [reason, setReason] = useState("FAKE_LISTING");
  const [details, setDetails] = useState("");
  const [reportedUserId, setReportedUserId] = useState("");
  const [reportedVehicleId, setReportedVehicleId] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) {
      setError("Please describe the issue in detail.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await apiService.createReport({
        reason,
        details,
        reported_user_id: reportedUserId ? parseInt(reportedUserId) : undefined,
        reported_vehicle_id: reportedVehicleId ? parseInt(reportedVehicleId) : undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to submit report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="space-y-1 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center mb-2 border border-rose-100">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Report Violation or Safety Issue
        </h1>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          RideSync takes fraud, vehicle damage, and fake listings seriously. All reports are immediately reviewed by administrators.
        </p>
      </div>

      {success ? (
        <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-3">
          <h3 className="font-bold text-emerald-900 text-base">Report Submitted to Administration</h3>
          <p className="text-xs text-emerald-700 leading-relaxed">
            Thank you for helping maintain community safety. Our moderation team will investigate and take appropriate honor score or suspension actions.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSuccess(false);
              setDetails("");
            }}
          >
            Submit Another Report
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
              Violation Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-blue-600"
            >
              <option value="FAKE_LISTING">Fake Listing or False Specs</option>
              <option value="INAPPROPRIATE_BEHAVIOR">Inappropriate Behavior or Harassment</option>
              <option value="VEHICLE_DAMAGE">Unreported Vehicle Damage</option>
              <option value="FRAUD">Fraud or Payment Off-Platform</option>
              <option value="LATE_RETURN">Unannounced Late Return</option>
              <option value="OTHER">Other Policy Violation</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Reported User ID (Optional)"
              type="number"
              placeholder="e.g. 3"
              value={reportedUserId}
              onChange={(e) => setReportedUserId(e.target.value)}
            />
            <Input
              label="Reported Vehicle ID (Optional)"
              type="number"
              placeholder="e.g. 1"
              value={reportedVehicleId}
              onChange={(e) => setReportedVehicleId(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
              Detailed Explanation
            </label>
            <textarea
              rows={5}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide specific dates, booking numbers, or details regarding the policy violation..."
              className="w-full p-3 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
              required
            />
          </div>

          <Button type="submit" variant="danger" size="lg" className="w-full gap-2" isLoading={loading}>
            <Send className="w-4 h-4" /> Submit Violation Report
          </Button>
        </form>
      )}
    </div>
  );
}
