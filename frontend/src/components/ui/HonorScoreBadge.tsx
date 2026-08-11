import React from "react";
import { ShieldCheck, Award, AlertTriangle, ShieldAlert } from "lucide-react";
import { getHonorCategoryInfo } from "@/lib/utils";

interface HonorScoreBadgeProps {
  score: number;
  showIcon?: boolean;
  showScore?: boolean;
}

export function HonorScoreBadge({ score, showIcon = true, showScore = true }: HonorScoreBadgeProps) {
  const info = getHonorCategoryInfo(score);

  const icons = {
    Trusted: ShieldCheck,
    Good: Award,
    Warning: AlertTriangle,
    Restricted: ShieldAlert,
  };

  const IconComponent = icons[info.label as keyof typeof icons] || ShieldCheck;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${info.badgeClass}`}
      title={info.description}
    >
      {showIcon && <IconComponent className="w-3.5 h-3.5 shrink-0" />}
      <span>{info.label}</span>
      {showScore && <span className="opacity-80">({score})</span>}
    </span>
  );
}
