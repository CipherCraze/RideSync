"use client";

import React, { useState } from "react";
import { VehicleImage } from "@/types";

interface VehicleGalleryProps {
  images: VehicleImage[];
}

export function VehicleGallery({ images }: VehicleGalleryProps) {
  const defaultUrl =
    images.length > 0
      ? images[0].image_url
      : "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1200&q=80";

  const [activeImage, setActiveImage] = useState<string>(defaultUrl);

  return (
    <div className="space-y-3">
      {/* Featured Main Image */}
      <div className="relative aspect-16/9 w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-200/80 shadow-subtle">
        <img
          src={activeImage}
          alt="Vehicle feature view"
          className="w-full h-full object-cover transition-all duration-300"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveImage(img.image_url)}
              className={`relative w-24 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                activeImage === img.image_url
                  ? "border-blue-600 ring-2 ring-blue-600/20 scale-105"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img
                src={img.image_url}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
