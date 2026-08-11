"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, ArrowRight, ShieldCheck, Car, FileText, AlertTriangle } from "lucide-react";
import { NotificationItem } from "@/types";
import { apiService } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = () => {
    setLoading(true);
    apiService
      .getNotifications()
      .then((nots) => setNotifications(nots))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    await apiService.markAllNotificationsRead();
    fetchNotifications();
  };

  const handleMarkRead = async (id: number) => {
    await apiService.markNotificationRead(id);
    fetchNotifications();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200/80">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600" /> Notifications Feed
          </h1>
          <p className="text-xs text-gray-500 mt-1">Real-time alerts for bookings, reviews, and honor scores</p>
        </div>

        {notifications.some((n) => !n.is_read) && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="gap-1 text-xs">
            <CheckCheck className="w-4 h-4 text-blue-600" /> Mark All Read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 space-y-2">
          <Bell className="w-8 h-8 text-gray-300 mx-auto" />
          <p className="text-sm font-bold text-gray-700">No notifications yet</p>
          <p className="text-xs text-gray-400">Activity updates regarding your bookings will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && handleMarkRead(n.id)}
              className={`p-4 rounded-2xl border transition-all ${
                n.is_read
                  ? "bg-white border-gray-100 text-gray-700"
                  : "bg-blue-50/40 border-blue-200 text-gray-900 shadow-subtle"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-gray-900">{n.title}</h4>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-gray-400 block pt-1">{formatDate(n.created_at)}</span>
                </div>

                {n.link_url && (
                  <Link href={n.link_url}>
                    <Button variant="ghost" size="sm" className="gap-1 text-blue-600">
                      View <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
