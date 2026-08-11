"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { UserCheck, ShieldCheck, Edit, Mail, Phone, MapPin, FileText, CheckCircle2 } from "lucide-react";
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
  const [reviews, setReviews] = useState<Review[]>([]);
  const [honorHistory, setHonorHistory] = useState<HonorScoreHistory[]>([]);
  const [licenseInput, setLicenseInput] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setLicenseInput(user.driving_license_number || "");
      apiService.getUserReviews(user.id).then((r) => setReviews(r)).catch(() => {});
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
            <div className="pt-1">
              <HonorScoreBadge score={user.honor_score} />
            </div>
          </div>
        </div>

        <Link href="/profile/edit">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Edit className="w-4 h-4" /> Edit Profile
          </Button>
        </Link>
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

      {/* Bio & Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
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

        <div className="md:col-span-2 space-y-6">
          {/* Reviews Received */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-subtle space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Community Reviews ({reviews.length})
            </h3>

            {reviews.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No reviews received yet.</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
