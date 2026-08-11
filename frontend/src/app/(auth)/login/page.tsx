"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Car, Lock, Mail, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccount = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    setLoading(true);
    setError("");
    try {
      await login(demoEmail, "password123");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to log in as demo account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gray-50/50">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-gray-200/80 shadow-card space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Car className="w-5 h-5 stroke-[2.5]" />
            </div>
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Welcome back to RideSync
          </h1>
          <p className="text-xs text-gray-500">
            Sign in to manage your vehicles, bookings, and honor score
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="alex.owner@ridesync.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />

          <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={loading}>
            Sign In
          </Button>
        </form>

        {/* Demo Accounts Quick Login */}
        <div className="pt-4 border-t border-gray-100 space-y-2">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 text-center">
            Instant Demo Logins
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleDemoAccount("alex.owner@ridesync.com")}
              className="p-2.5 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 text-left transition-colors"
            >
              <span className="font-bold text-gray-900 block">Alex Morgan</span>
              <span className="text-[10px] text-gray-500 block">Verified Host (98 Pts)</span>
            </button>
            <button
              onClick={() => handleDemoAccount("sarah.renter@ridesync.com")}
              className="p-2.5 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 text-left transition-colors"
            >
              <span className="font-bold text-gray-900 block">Sarah Chen</span>
              <span className="text-[10px] text-gray-500 block">Trusted Renter (95 Pts)</span>
            </button>
          </div>
          <button
            onClick={() => handleDemoAccount("admin@ridesync.com")}
            className="w-full p-2.5 rounded-xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50 text-left transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-blue-900 block text-xs">Alexander Vance (Admin)</span>
                <span className="text-[10px] text-blue-600 block">Full Administrator Privileges</span>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-600" />
            </div>
          </button>
        </div>

        <p className="text-center text-xs text-gray-500 pt-2">
          Don't have an account?{" "}
          <Link href="/register" className="font-bold text-blue-600 hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
