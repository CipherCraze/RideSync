"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit3, Trash2, Eye, Car, CheckCircle2, Clock } from "lucide-react";
import { Vehicle } from "@/types";
import { apiService } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";

export default function MyVehiclesPage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyVehicles = () => {
    setLoading(true);
    apiService
      .getMyListings()
      .then((data) => setVehicles(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMyVehicles();
  }, []);

  const handleDelete = async (vehicleId: number) => {
    if (confirm("Are you sure you want to delete this vehicle listing?")) {
      try {
        await apiService.deleteVehicle(vehicleId);
        fetchMyVehicles();
      } catch (err: any) {
        alert(err.response?.data?.detail || "Failed to delete vehicle.");
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            My Vehicle Listings
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage your listed fleet, availability status, daily rates, and approvals
          </p>
        </div>

        <Link href="/vehicles/new">
          <Button variant="primary" size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" /> List New Vehicle
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 mx-auto flex items-center justify-center">
            <Car className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No vehicles listed yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Earn extra income by listing your car for trusted community members.
          </p>
          <Link href="/vehicles/new">
            <Button variant="primary" size="sm">
              List Your Vehicle
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {vehicles.map((v) => {
            const primaryImg = v.images[0]?.image_url || "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1200&q=80";
            return (
              <div key={v.id} className="bg-white rounded-2xl border border-gray-200/80 shadow-subtle overflow-hidden flex flex-col justify-between">
                <div className="relative aspect-16/10 bg-gray-100">
                  <img src={primaryImg} alt={`${v.brand} ${v.model}`} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {v.status === "APPROVED" || (v.is_approved && !v.status) ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full shadow-sm">
                        <CheckCircle2 className="w-3 h-3" /> Live
                      </span>
                    ) : v.status === "DRAFT" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-gray-700 text-white px-2.5 py-0.5 rounded-full shadow-sm">
                        Draft
                      </span>
                    ) : v.status === "REJECTED" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-rose-600 text-white px-2.5 py-0.5 rounded-full shadow-sm">
                        Action Needed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-600 text-white px-2.5 py-0.5 rounded-full shadow-sm">
                        <Clock className="w-3 h-3" /> Under Review
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-xl text-xs font-bold text-gray-900 shadow-sm">
                    {formatCurrency(v.price_per_day)}/day
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="font-bold text-base text-gray-900">
                      {v.brand} {v.model} ({v.year})
                    </h3>
                    <p className="text-xs text-gray-500 truncate">{v.pickup_location}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t border-gray-100">
                    <span>{v.seats} Seats • {v.fuel_type}</span>
                    <span className="font-bold text-amber-500">★ {v.rating_avg.toFixed(1)}</span>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <Link href={`/vehicles/${v.id}`}>
                      <Button variant="ghost" size="sm" className="gap-1 text-gray-600">
                        <Eye className="w-3.5 h-3.5" /> View
                      </Button>
                    </Link>

                    <div className="flex items-center gap-1">
                      <Link href={`/vehicles/${v.id}/edit`}>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </Button>
                      </Link>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(v.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
