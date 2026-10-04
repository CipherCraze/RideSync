"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Car,
  Bell,
  MessageSquare,
  Shield,
  User,
  PlusCircle,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  FileText,
  AlertTriangle,
  CheckCheck,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { HonorScoreBadge } from "@/components/ui/HonorScoreBadge";
import { Button } from "@/components/ui/Button";
import { apiService } from "@/lib/api";
import { NotificationItem } from "@/types";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [unreadChat, setUnreadChat] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Poll for notifications and unread messages every 5 seconds
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const notifRes = await apiService.getNotificationUnreadCount();
        setUnreadNotifications(notifRes.unread_count);

        const chatRes = await apiService.getChatUnreadCount();
        setUnreadChat(chatRes.unread_count);
      } catch (err) {
        // Silently catch network errors during polling
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [user, pathname]);

  // Load preview notifications when dropdown is opened
  const handleOpenNotifications = async () => {
    setShowNotificationDropdown(!showNotificationDropdown);
    if (!showNotificationDropdown) {
      try {
        const data = await apiService.getNotifications();
        setNotifications(data.slice(0, 5));
      } catch (err) {}
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiService.markAllNotificationsRead();
      setUnreadNotifications(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {}
  };

  const navLinks = [
    { name: "Explore Vehicles", href: "/vehicles" },
    { name: "How P2P Works", href: "/#how-it-works" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <Car className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-bold text-lg text-gray-900 tracking-tight flex items-center gap-1">
              RideSync
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            </span>
            <span className="block text-[10px] text-gray-400 font-semibold tracking-wider uppercase -mt-1">
              Peer-to-Peer Rental
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                pathname === link.href ? "text-blue-600 font-semibold" : "text-gray-600"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Right Section / Auth Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <Link href="/vehicles/new">
                <Button size="sm" variant="outline" className="hidden sm:inline-flex gap-1.5 border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-50">
                  <PlusCircle className="w-4 h-4" />
                  List Vehicle
                </Button>
              </Link>

              {/* Chat Button */}
              <Link
                href="/chat"
                className="relative p-2 text-gray-600 hover:text-blue-600 rounded-xl hover:bg-gray-100 transition-colors"
                title="Messages"
              >
                <MessageSquare className="w-5 h-5" />
                {unreadChat > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold text-white bg-blue-600 rounded-full ring-2 ring-white animate-pulse px-1">
                    {unreadChat > 9 ? "9+" : unreadChat}
                  </span>
                )}
              </Link>

              {/* Notification Button & Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={handleOpenNotifications}
                  className="relative p-2 text-gray-600 hover:text-blue-600 rounded-xl hover:bg-gray-100 transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold text-white bg-rose-500 rounded-full ring-2 ring-white animate-pulse px-1">
                      {unreadNotifications > 9 ? "9+" : unreadNotifications}
                    </span>
                  )}
                </button>

                {showNotificationDropdown && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900">Notifications</span>
                        {unreadNotifications > 0 && (
                          <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {unreadNotifications} new
                          </span>
                        )}
                      </div>
                      {unreadNotifications > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                          <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                      {notifications.length === 0 ? (
                        <div className="text-center py-8 text-xs text-gray-400">
                          No notifications to display
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-3 text-xs transition-colors hover:bg-gray-50 ${
                              n.is_read ? "opacity-75" : "bg-blue-50/30"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-gray-900">{n.title}</p>
                              {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1" />}
                            </div>
                            <p className="text-gray-600 line-clamp-2 mt-0.5">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="border-t border-gray-100 px-3 py-2 text-center">
                      <Link
                        href="/notifications"
                        onClick={() => setShowNotificationDropdown(false)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                      >
                        View all notifications &rarr;
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Menu Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                >
                  <img
                    src={user.profile_picture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80"}
                    alt={user.full_name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-600/20"
                  />
                  <div className="hidden lg:block text-left">
                    <span className="block text-xs font-semibold text-gray-900 leading-tight">
                      {user.full_name}
                    </span>
                    <HonorScoreBadge score={user.honor_score} showIcon={false} />
                  </div>
                </button>

                {showProfileMenu && (
                  <div
                    className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-200/80 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                    onMouseLeave={() => setShowProfileMenu(false)}
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{user.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      <div className="mt-2">
                        <HonorScoreBadge score={user.honor_score} />
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <LayoutDashboard className="w-4 h-4 text-gray-400" />
                        Dashboard
                      </Link>
                      <Link
                        href="/chat"
                        className="flex items-center justify-between px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <span className="flex items-center gap-2.5">
                          <MessageSquare className="w-4 h-4 text-gray-400" />
                          Messages & Chat
                        </span>
                        {unreadChat > 0 && (
                          <span className="bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                            {unreadChat}
                          </span>
                        )}
                      </Link>
                      <Link
                        href="/profile"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <User className="w-4 h-4 text-gray-400" />
                        My Profile & Trust Score
                      </Link>
                      <Link
                        href="/my-rentals"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <Car className="w-4 h-4 text-gray-400" />
                        My Trips & Rentals
                      </Link>
                      <Link
                        href="/booking-requests"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <FileText className="w-4 h-4 text-gray-400" />
                        Host Booking Requests
                      </Link>
                      <Link
                        href="/my-vehicles"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <PlusCircle className="w-4 h-4 text-gray-400" />
                        My Vehicle Listings
                      </Link>
                      <Link
                        href="/reports"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <AlertTriangle className="w-4 h-4 text-gray-400" />
                        Disputes & Reports
                      </Link>

                      {user.is_admin && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50/60 hover:bg-blue-100/70"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <ShieldCheck className="w-4 h-4 text-blue-600" />
                          Admin Command Panel
                        </Link>
                      )}
                    </div>

                    <div className="pt-1 border-t border-gray-100">
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
