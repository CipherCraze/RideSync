"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, Bell, Shield, User, PlusCircle, LogOut, LayoutDashboard, ShieldCheck, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { HonorScoreBadge } from "@/components/ui/HonorScoreBadge";
import { Button } from "@/components/ui/Button";
import { apiService } from "@/lib/api";
import { NotificationItem } from "@/types";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      apiService.getNotifications().then((nots) => {
        const unread = nots.filter((n) => !n.is_read).length;
        setUnreadCount(unread);
      }).catch(() => {});
    }
  }, [user, pathname]);

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
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/vehicles/new">
                <Button size="sm" variant="outline" className="hidden sm:inline-flex gap-1.5 border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-50">
                  <PlusCircle className="w-4 h-4" />
                  List Vehicle
                </Button>
              </Link>

              {/* Notification Button */}
              <Link href="/notifications" className="relative p-2 text-gray-600 hover:text-blue-600 rounded-xl hover:bg-gray-100 transition-colors">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
                )}
              </Link>

              {/* User Profile Menu Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
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
                        href="/profile"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <User className="w-4 h-4 text-gray-400" />
                        My Profile & License
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
