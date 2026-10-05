"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Car, Lock, Mail, User as UserIcon, Phone, UploadCloud, CheckCircle2, Image as ImageIcon, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { GoogleLogin } from "@react-oauth/google";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiService } from "@/lib/api";

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
];

export default function RegisterPage() {
  const router = useRouter();
  const { register, loginWithGoogle } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate format
    const validFormats = ["image/jpeg", "image/png", "image/webp"];
    if (!validFormats.includes(file.type)) {
      setError("Please upload a valid image file (JPEG, PNG, or WEBP).");
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image file is too large. Maximum allowed size is 5MB.");
      return;
    }

    setError("");
    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
  };

  const handleSelectPreset = (url: string) => {
    setAvatarFile(null);
    setAvatarPreview(url);
    setError("");
  };

  const clearAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!avatarPreview && !avatarFile) {
      setError("Please attach a profile photo (avatar/identification photo) to complete registration.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let finalAvatarUrl = avatarPreview;

      // If a local file was chosen, upload to server
      if (avatarFile) {
        setUploadingAvatar(true);
        const uploadRes = await apiService.uploadAvatar(avatarFile);
        finalAvatarUrl = uploadRes.url;
      }

      await register({
        full_name: fullName,
        email,
        phone,
        password,
        profile_picture: finalAvatarUrl,
      });

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed. Try a different email.");
    } finally {
      setLoading(false);
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-gray-50/50">
      <div className="w-full max-w-lg bg-white rounded-3xl p-8 border border-gray-200/80 shadow-card space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Car className="w-5 h-5 stroke-[2.5]" />
            </div>
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Create your Account
          </h1>
          <p className="text-xs text-gray-500">
            Fast setup for renters and hosts. No government document uploads or external verification hurdles.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile Picture Upload Section */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700">
              Profile Photo / Identification Avatar <span className="text-rose-500">*</span>
            </label>

            {avatarPreview ? (
              <div className="flex items-center gap-4 p-3 bg-blue-50/40 border border-blue-200/60 rounded-2xl">
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Photo attached & verified</span>
                  </div>
                  <p className="text-[11px] text-gray-500 truncate">
                    {avatarFile ? avatarFile.name : "Selected avatar profile image"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearAvatar}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-2xl p-5 text-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-blue-50/20"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-blue-100/70 group-hover:bg-blue-600 group-hover:text-white text-blue-600 flex items-center justify-center transition-colors">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-800">
                      Click to upload profile photo
                    </span>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      JPEG, PNG, or WEBP (Max 5MB)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Demo Avatars */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-gray-400">Or pick a quick demo avatar:</span>
              <div className="flex items-center gap-2">
                {PRESET_AVATARS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectPreset(url)}
                    className="relative rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <img
                      src={url}
                      alt={`Avatar option ${i + 1}`}
                      className="w-7 h-7 rounded-full object-cover hover:scale-110 transition-transform border border-gray-200"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Input
            label="Full Name"
            placeholder="Jane Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            leftIcon={<UserIcon className="w-4 h-4" />}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="jane@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <Input
            label="Phone Number"
            placeholder="+1 (555) 000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            leftIcon={<Phone className="w-4 h-4" />}
          />

          <Input
            label="Password"
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />

          <div className="p-3 bg-emerald-50/70 rounded-xl text-[11px] text-emerald-900 leading-relaxed border border-emerald-200/60 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <strong>Simplified Registration Active:</strong> Instant access enabled. All complex identity validation and document checks have been bypassed for seamless peer-to-peer testing.
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={loading || uploadingAvatar}
          >
            Create Account
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-gray-500">Or continue with</span>
          </div>
        </div>
        
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              if (credentialResponse.credential) {
                setLoading(true);
                try {
                  await loginWithGoogle(credentialResponse.credential);
                  router.push("/dashboard");
                } catch (err: any) {
                  setError(err.response?.data?.detail || "Google registration failed.");
                } finally {
                  setLoading(false);
                }
              }
            }}
            onError={() => {
              setError("Google Registration Failed");
            }}
            text="signup_with"
          />
        </div>

        <p className="text-center text-xs text-gray-500 pt-2">
          Already registered?{" "}
          <Link href="/login" className="font-bold text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
