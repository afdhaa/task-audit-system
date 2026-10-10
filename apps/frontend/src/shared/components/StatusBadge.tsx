import React from "react";
import { TaskStatus, STATUS_LABELS, STATUS_BADGE_STYLES } from "../constants";

export interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

/**
 * Presentational badge component displaying task status with distinct color themes:
 * to_do (slate), pending (amber), in_progress (blue), and done (emerald).
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = "" }) => {
  const label = STATUS_LABELS[status] || status;
  const style = STATUS_BADGE_STYLES[status] || "bg-gray-100 text-gray-700 border-gray-300";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style} ${className}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-70"></span>
      {label}
    </span>
  );
};
