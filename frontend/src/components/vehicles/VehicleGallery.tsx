"use client";

import React, { useState } from "react";
import { VehicleImage } from "@/types";
import { Camera } from "lucide-react";

interface VehicleGalleryProps {
  images: VehicleImage[];
}

const formatAngle = (angle?: string) => {
  if (!angle) return "View";
  switch (angle) {
    case "FRONT":
      return "Front Angle";
    case "REAR":
      return "Rear Angle";
    case "SIDE_LEFT":
      return "Left Profile";
    case "SIDE_RIGHT":
      return "Right Profile";
    case "INTERIOR":
      return "Interior";
    case "DASHBOARD":
      return "Dashboard";
    default:
      return "Exterior";
  }
};

export function VehicleGallery({ images }: VehicleGalleryProps) {
  const defaultUrl =
    images.length > 0
      ? images[0].image_url
      : "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1200&q=80";

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const activeImage = images[activeIndex]?.image_url || defaultUrl;
  const activeAngle = images[activeIndex]?.angle;

  return (
    <div className="space-y-3">
      {/* Featured Main Image */}
      <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-200/80 shadow-sm">
        <img
          src={activeImage}
          alt="Vehicle feature view"
          className="w-full h-full object-cover transition-all duration-300"
        />
        {activeAngle && (
          <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-md">
            <Camera className="w-3.5 h-3.5 text-blue-400" />
            <span>{formatAngle(activeAngle)}</span>
          </div>
        )}
      </div>

      {/* Thumbnails with Angle Pills */}
      {images.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`group relative w-28 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all flex flex-col justify-end p-1 text-left ${
                activeIndex === idx
                  ? "border-blue-600 ring-2 ring-blue-600/20 scale-102"
                  : "border-transparent opacity-75 hover:opacity-100"
              }`}
            >
              <img
                src={img.image_url}
                alt={`Thumbnail ${idx + 1}`}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <span className="relative z-10 text-[9px] font-bold text-white uppercase tracking-wider truncate">
                {formatAngle(img.angle)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
