import React from "react";
import { Badge } from "./Badge";

interface BookingStatusBadgeProps {
  status: string;
}

export function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  const config: Record<string, { label: string; variant: "default" | "primary" | "secondary" | "success" | "warning" | "danger" | "outline" }> = {
    PENDING: { label: "Pending Approval", variant: "warning" },
    CONFIRMED: { label: "Booking Confirmed", variant: "primary" },
    REJECTED: { label: "Declined", variant: "danger" },
    RENTAL_ACTIVE: { label: "Rental Active", variant: "success" },
    RETURNED: { label: "Vehicle Returned", variant: "primary" },
    COMPLETED: { label: "Completed", variant: "success" },
    CANCELLED: { label: "Cancelled", variant: "danger" },
  };

  const current = config[status.toUpperCase()] || { label: status, variant: "default" };

  return <Badge variant={current.variant}>{current.label}</Badge>;
}
