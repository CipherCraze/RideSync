"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  UserCheck,
  ShieldCheck,
  Edit,
  Mail,
  Phone,
  MapPin,
  FileText,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  History,
  Star,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { HonorScoreBadge } from "@/components/ui/HonorScoreBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { apiService } from "@/lib/api";
import { Review, HonorScoreHistory } from "@/types";
import { formatDate } from "@/lib/utils";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [receivedReviews, setReceivedReviews] = useState<Review[]>([]);
  const [givenReviews, setGivenReviews] = useState<Review[]>([]);
  const [honorHistory, setHonorHistory] = useState<HonorScoreHistory[]>([]);
  const [activeTab, setActiveTab] = useState<"received" | "given" | "honor">("received");
  const [licenseInput, setLicenseInput] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setLicenseInput(user.driving_license_number || "");
      apiService.getReviewsReceived().then((r) => setReceivedReviews(r)).catch(() => {});
      apiService.getReviewsGiven().then((r) => setGivenReviews(r)).catch(() => {});
      apiService.getHonorHistory().then((h) => setHonorHistory(h)).catch(() => {});
    }
  }, [user]);

  if (!user) return <div className="p-8 text-center text-xs text-gray-500">Loading profile...</div>;

  const handleRequestVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseInput.trim()) return;
    setVerifying(true);
    try {
      await apiService.requestVerification({ driving_license_number: licenseInput });
      await refreshUser();
      setVerifySuccess(true);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to request verification.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={user.profile_picture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80"}
            alt={user.full_name}
            className="w-20 h-20 rounded-full object-cover ring-4 ring-blue-600/20 shrink-0"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-gray-900">{user.full_name}</h1>
              {user.is_verified && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified Driver
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">{user.email} • Member since {formatDate(user.created_at)}</p>
            <div className="pt-1 flex items-center gap-2">
              <HonorScoreBadge score={user.honor_score} />
              <span className="text-[11px] text-gray-400">Trust Rating</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/chat">
            <Button variant="outline" size="sm" className="gap-1.5">
              <MessageSquare className="w-4 h-4" /> Messages
            </Button>
          </Link>
          <Link href="/profile/edit">
            <Button variant="primary" size="sm" className="gap-1.5">
              <Edit className="w-4 h-4" /> Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Driver License Verification Box */}
      {!user.is_verified && (
        <div className="bg-blue-50/60 rounded-3xl p-6 border border-blue-100 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Identity & Driver License Verification</h3>
              <p className="text-xs text-gray-600">
                Submit your official driver's license number. Once verified by an admin, you earn +10 Honor Score points!
              </p>
            </div>
          </div>

          {verifySuccess ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium">
              Verification request submitted successfully! Pending admin approval.
            </div>
          ) : (
            <form onSubmit={handleRequestVerification} className="flex flex-col sm:flex-row items-center gap-3">
              <Input
                placeholder="License Number (e.g. DL-CA-992014)"
                value={licenseInput}
                onChange={(e) => setLicenseInput(e.target.value)}
                className="bg-white"
                required
              />
              <Button type="submit" variant="primary" size="md" isLoading={verifying} className="w-full sm:w-auto whitespace-nowrap">
                Submit For Verification
              </Button>
            </form>
          )}
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Account Details & Trust Meter */}
        <div className="md:col-span-1 space-y-6">
          {/* Trust Meter */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-subtle space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Trust & Reputation</h3>
            <div className="p-4 bg-gray-50 rounded-2xl text-center space-y-2">
              <span className="text-3xl font-extrabold text-gray-900">{user.honor_score}</span>
              <span className="text-xs text-gray-400 block -mt-1">out of 100 points</span>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    user.honor_score >= 95
                      ? "bg-emerald-500"
                      : user.honor_score >= 80
                      ? "bg-blue-600"
                      : user.honor_score >= 60
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`}
                  style={{ width: `${user.honor_score}%` }}
                />
              </div>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Honor scores reflect your on-time vehicle returns, accurate listings, and positive community behavior.
            </p>
          </div>

          {/* Account Details */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-subtle space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Account Details</h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2 text-gray-700">
                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                <span>{user.phone || "No phone added"}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                <span>{user.address || "No address added"}</span>
              </div>
            </div>

            {user.bio && (
              <div className="pt-3 border-t border-gray-100 text-xs text-gray-600">
                <strong className="block text-gray-900 mb-1">About Me</strong>
                <p className="leading-relaxed">"{user.bio}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Tabbed Sections (Received, Given, Honor History) */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-subtle overflow-hidden">
            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-200/80 bg-gray-50/50">
              <button
                onClick={() => setActiveTab("received")}
                className={`flex-1 py-3.5 text-xs font-bold transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
                  activeTab === "received"
                    ? "border-blue-600 text-blue-600 bg-white"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                Received Reviews ({receivedReviews.length})
              </button>
              <button
                onClick={() => setActiveTab("given")}
                className={`flex-1 py-3.5 text-xs font-bold transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
                  activeTab === "given"
                    ? "border-blue-600 text-blue-600 bg-white"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Given Reviews ({givenReviews.length})
              </button>
              <button
                onClick={() => setActiveTab("honor")}
                className={`flex-1 py-3.5 text-xs font-bold transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
                  activeTab === "honor"
                    ? "border-blue-600 text-blue-600 bg-white"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <History className="w-3.5 h-3.5" />
                Honor Audit Log ({honorHistory.length})
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-6">
              {activeTab === "received" && (
                <div className="space-y-3">
                  {receivedReviews.length === 0 ? (
                    <div className="text-center py-12 text-xs text-gray-400">
                      No community reviews received yet.
                    </div>
                  ) : (
                    receivedReviews.map((r) => <ReviewCard key={r.id} review={r} />)
                  )}
                </div>
              )}

              {activeTab === "given" && (
                <div className="space-y-3">
                  {givenReviews.length === 0 ? (
                    <div className="text-center py-12 text-xs text-gray-400">
                      You haven't written any reviews yet. Complete a rental to leave feedback!
                    </div>
                  ) : (
                    givenReviews.map((r) => (
                      <div key={r.id} className="p-4 bg-gray-50/60 rounded-2xl border border-gray-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-900">
                            {r.review_type === "RENTER_TO_OWNER" ? "Reviewed Host" : "Reviewed Renter"}
                          </span>
                          <span className="text-[10px] text-gray-400">{formatDate(r.created_at)}</span>
                        </div>
                        <p className="text-xs text-gray-700 italic">"{r.comment}"</p>
                        <div className="text-[11px] text-blue-600 font-semibold">
                          Trip #{r.booking_id} • Rating: {r.rating} / 5
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "honor" && (
                <div className="space-y-4">
                  <div className="text-xs text-gray-500">
                    Full immutable audit history of honor score adjustments.
                  </div>
                  {honorHistory.length === 0 ? (
                    <div className="text-center py-12 text-xs text-gray-400">
                      No honor score adjustments recorded.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {honorHistory.map((h) => {
                        const changeVal = h.change ?? h.points_change ?? 0;
                        const isPos = changeVal > 0;
                        const isZero = changeVal === 0;

                        return (
                          <div key={h.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                            <div className="space-y-1">
                              <p className="font-semibold text-gray-900">{h.reason}</p>
                              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                <span>{formatDate(h.created_at)}</span>
                                {h.reference_type && (
                                  <span className="bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded font-mono">
                                    {h.reference_type}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="text-right flex-shrink-0">
                              <span
                                className={`inline-flex items-center gap-1 font-bold ${
                                  isZero
                                    ? "text-gray-500"
                                    : isPos
                                    ? "text-emerald-600"
                                    : "text-rose-600"
                                }`}
                              >
                                {isPos && <TrendingUp className="w-3.5 h-3.5" />}
                                {!isPos && !isZero && <TrendingDown className="w-3.5 h-3.5" />}
                                {isPos ? `+${changeVal}` : changeVal} pts
                              </span>
                              <span className="block text-[10px] text-gray-400">
                                Score: {h.new_score}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
