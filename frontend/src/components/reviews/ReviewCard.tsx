import React from "react";
import Link from "next/link";
import { Review } from "@/types";
import { RatingStars } from "@/components/ui/RatingStars";
import { HonorScoreBadge } from "@/components/ui/HonorScoreBadge";
import { formatDate } from "@/lib/utils";
import { Flag } from "lucide-react";

interface ReviewCardProps {
  review: Review;
  showReportOption?: boolean;
}

export function ReviewCard({ review, showReportOption = true }: ReviewCardProps) {
  const reviewer = review.reviewer;

  return (
    <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-xs space-y-2 hover:border-gray-200 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={reviewer?.profile_picture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80"}
            alt={reviewer?.full_name || "User"}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-100"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-900">{reviewer?.full_name || "Verified Member"}</span>
              {reviewer && <HonorScoreBadge score={reviewer.honor_score} showIcon={false} />}
            </div>
            <span className="text-[10px] text-gray-400">{formatDate(review.created_at)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <RatingStars rating={review.rating} size="sm" />
          {showReportOption && (
            <Link
              href={`/reports?review_id=${review.id}`}
              className="text-gray-400 hover:text-rose-600 transition-colors p-1"
              title="Report abusive review"
            >
              <Flag className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-700 leading-relaxed font-normal">{review.comment}</p>
    </div>
  );
}
