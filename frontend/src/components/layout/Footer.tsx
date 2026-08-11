import React from "react";
import Link from "next/link";
import { Car, ShieldCheck, Heart, ArrowUpRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200/80 pt-16 pb-12 mt-20 text-gray-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-gray-100">
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                <Car className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="font-bold text-lg text-gray-900 tracking-tight">
                RideSync
              </span>
            </Link>
            <p className="text-xs text-gray-500 leading-relaxed">
              The next-generation peer-to-peer vehicle rental marketplace with community honor scoring, instant verification, and zero hidden fees.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200/60 w-fit font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Honor Score Guarantee Protected</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Marketplace
            </h4>
            <ul className="space-y-2.5 text-xs font-medium">
              <li>
                <Link href="/vehicles" className="hover:text-blue-600 transition-colors">
                  Explore Vehicles
                </Link>
              </li>
              <li>
                <Link href="/vehicles/new" className="hover:text-blue-600 transition-colors">
                  List Your Car
                </Link>
              </li>
              <li>
                <Link href="/vehicles?fuel_type=Electric" className="hover:text-blue-600 transition-colors">
                  Electric Fleet
                </Link>
              </li>
              <li>
                <Link href="/vehicles?vehicle_type=Luxury" className="hover:text-blue-600 transition-colors">
                  Luxury Vehicles
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Platform Trust & Rules
            </h4>
            <ul className="space-y-2.5 text-xs font-medium">
              <li>
                <Link href="/profile" className="hover:text-blue-600 transition-colors">
                  Honor Score System
                </Link>
              </li>
              <li>
                <Link href="/reports" className="hover:text-blue-600 transition-colors">
                  Report Violation
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-blue-600 transition-colors">
                  Community Rules
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-blue-600 transition-colors flex items-center gap-1">
                  Admin Portal <ArrowUpRight className="w-3 h-3 text-gray-400" />
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Honor Score Standard
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">
              Every RideSync user holds an Honor Score starting at 100 points. Trusted members unlock priority bookings and lower deposit tiers.
            </p>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60 text-xs">
              <span className="font-semibold text-gray-800">Trusted Tier: 95–100 pts</span>
              <span className="block text-[11px] text-gray-500 mt-0.5">Top 15% rated renters & hosts</span>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} RideSync Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-gray-600 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-gray-600 cursor-pointer">Terms of Service</span>
            <span className="hover:text-gray-600 cursor-pointer">Security Center</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
