"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Phone, MapPin, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiService } from "@/lib/api";

export default function EditProfilePage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setPhone(user.phone || "");
      setProfilePicture(user.profile_picture || "");
      setAddress(user.address || "");
      setBio(user.bio || "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await apiService.updateProfile({
        full_name: fullName,
        phone,
        profile_picture: profilePicture,
        address,
        bio,
      });
      await refreshUser();
      router.push("/profile");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Link href="/profile" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Profile
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Edit Profile</h1>
        <p className="text-xs text-gray-500">Update your contact information, bio, and avatar.</p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-subtle space-y-4">
        <Input
          label="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          leftIcon={<User className="w-4 h-4" />}
          required
        />

        <Input
          label="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          leftIcon={<Phone className="w-4 h-4" />}
        />

        <Input
          label="Profile Picture URL"
          placeholder="https://images.unsplash.com/..."
          value={profilePicture}
          onChange={(e) => setProfilePicture(e.target.value)}
          leftIcon={<ImageIcon className="w-4 h-4" />}
        />

        <Input
          label="Address / City"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          leftIcon={<MapPin className="w-4 h-4" />}
        />

        <div>
          <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
            Bio / Personal Note
          </label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Share a short bio with hosts and renters..."
            className="w-full p-3 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
          />
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
          <Link href="/profile">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" variant="primary" isLoading={loading}>
            Save Profile
          </Button>
        </div>
      </form>
    </div>
  );
}
