"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { RatingStars } from "@/components/ui/RatingStars";
import { Button } from "@/components/ui/Button";
import { apiService } from "@/lib/api";

interface AddReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number;
  revieweeId?: number;
  vehicleId?: number;
  title: string;
  reviewType: "RENTER_TO_OWNER" | "OWNER_TO_RENTER" | "VEHICLE";
  onSuccess: () => void;
}

export function AddReviewModal({
  isOpen,
  onClose,
  bookingId,
  revieweeId,
  vehicleId,
  title,
  reviewType,
  onSuccess,
}: AddReviewModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError("Please write a short review comment.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await apiService.createReview({
        booking_id: bookingId,
        reviewee_id: revieweeId,
        vehicle_id: vehicleId,
        rating,
        comment,
        review_type: reviewType,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">{error}</div>}

        <div>
          <label className="block text-xs font-semibold uppercase text-gray-500 mb-2">Rating</label>
          <RatingStars rating={rating} size="lg" interactive onChange={setRating} />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">
            Your Review Comment
          </label>
          <textarea
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience regarding car cleanliness, communication, and punctuality..."
            className="w-full p-3 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
            Submit Review
          </Button>
        </div>
      </form>
    </Modal>
  );
}
