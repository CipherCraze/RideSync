import React from "react";
import { Review } from "@/types";
import { RatingStars } from "@/components/ui/RatingStars";
import { HonorScoreBadge } from "@/components/ui/HonorScoreBadge";
import { formatDate } from "@/lib/utils";

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const reviewer = review.reviewer;

  return (
    <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-subtle space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={reviewer?.profile_picture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80"}
            alt={reviewer?.full_name || "User"}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-900">{reviewer?.full_name || "Verified Member"}</span>
              {reviewer && <HonorScoreBadge score={reviewer.honor_score} showIcon={false} />}
            </div>
            <span className="text-[11px] text-gray-400">{formatDate(review.created_at)}</span>
          </div>
        </div>

        <RatingStars rating={review.rating} size="sm" />
      </div>

      <p className="text-xs text-gray-700 leading-relaxed font-normal">{review.comment}</p>
    </div>
  );
}
