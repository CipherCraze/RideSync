import React from "react";
import Link from "next/link";
import { MapPin, Users, Fuel, Gauge, Star, ShieldCheck } from "lucide-react";
import { Vehicle } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { HonorScoreBadge } from "@/components/ui/HonorScoreBadge";
import { formatCurrency } from "@/lib/utils";

interface VehicleCardProps {
  vehicle: Vehicle;
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const primaryImage =
    vehicle.images.find((img) => img.is_primary)?.image_url ||
    vehicle.images[0]?.image_url ||
    "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1200&q=80";

  return (
    <Card hoverEffect className="group flex flex-col h-full">
      {/* Image Container */}
      <div className="relative aspect-16/10 w-full overflow-hidden bg-gray-100">
        <img
          src={primaryImage}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Badge Overlays */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <Badge variant="primary" className="bg-white/90 backdrop-blur-xs text-blue-700 shadow-sm font-semibold">
            {vehicle.vehicle_type}
          </Badge>
          {!vehicle.is_approved && (
            <Badge variant="warning" className="bg-amber-500/90 text-white shadow-sm font-semibold">
              Pending Approval
            </Badge>
          )}
        </div>

        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs px-3 py-1 rounded-xl shadow-md border border-gray-100 font-bold text-gray-900 text-sm">
          {formatCurrency(vehicle.price_per_day)}
          <span className="text-[11px] font-normal text-gray-500">/day</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="text-base font-bold text-gray-900 tracking-tight group-hover:text-blue-600 transition-colors line-clamp-1">
              {vehicle.brand} {vehicle.model}
            </h3>
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">
              {vehicle.year}
            </span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate">{vehicle.pickup_location}</span>
          </div>

          {/* Specs Pills */}
          <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-gray-50/80 rounded-xl mb-4 text-xs font-medium text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>{vehicle.seats} Seats</span>
            </div>
            <div className="flex items-center gap-1">
              <Fuel className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>{vehicle.fuel_type}</span>
            </div>
            <div className="flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>{vehicle.transmission}</span>
            </div>
          </div>
        </div>

        {/* Footer info: Rating & Host Honor Score */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-gray-900 font-semibold">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{vehicle.rating_avg.toFixed(1)}</span>
            <span className="text-gray-400 font-normal">({vehicle.rating_count})</span>
          </div>

          <Link href={`/vehicles/${vehicle.id}`} className="font-semibold text-blue-600 hover:text-blue-700">
            View Details →
          </Link>
        </div>
      </div>
    </Card>
  );
}
