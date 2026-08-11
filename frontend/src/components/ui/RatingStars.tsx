import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  count?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export function RatingStars({
  rating,
  max = 5,
  size = "md",
  showCount = false,
  count,
  interactive = false,
  onChange,
}: RatingStarsProps) {
  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= Math.round(rating);
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange && onChange(starValue)}
            className={cn(
              "transition-transform",
              interactive ? "hover:scale-110 cursor-pointer" : "cursor-default"
            )}
          >
            <Star
              className={cn(
                iconSizes[size],
                isFilled
                  ? "fill-amber-400 text-amber-400"
                  : "fill-gray-100 text-gray-300"
              )}
            />
          </button>
        );
      })}
      <span className="ml-1 text-xs font-semibold text-gray-700">
        {rating.toFixed(1)}
      </span>
      {showCount && count !== undefined && (
        <span className="text-xs text-gray-400">({count})</span>
      )}
    </div>
  );
}
