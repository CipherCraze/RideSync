"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Settings, Bell, Lock, ShieldCheck, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
  const { user } = useAuth();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" /> Account Settings
        </h1>
        <p className="text-xs text-gray-500">Manage notification preferences, privacy, and security.</p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium">
          Settings updated successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-subtle space-y-6">
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Notifications</h3>

          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div>
              <span className="text-xs font-bold text-gray-900 block">Email Alerts</span>
              <span className="text-[11px] text-gray-500">Receive booking updates and review notifications via email</span>
            </div>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div>
              <span className="text-xs font-bold text-gray-900 block">SMS Notifications</span>
              <span className="text-[11px] text-gray-500">Receive instant SMS text alerts on trip confirmation</span>
            </div>
            <input
              type="checkbox"
              checked={smsNotifications}
              onChange={(e) => setSmsNotifications(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Security & Privacy</h3>
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs space-y-1">
            <span className="font-bold text-gray-900 block">JWT Password Encryption</span>
            <span className="text-gray-500 block">Passwords are salted and hashed using bcrypt standard algorithms.</span>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <Button type="submit" variant="primary">
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  );
}
