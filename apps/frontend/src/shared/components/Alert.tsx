import React from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export type AlertType = "success" | "error" | "info" | "warning";

export interface AlertProps {
  type: AlertType;
  message: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const ALERT_STYLES: Record<AlertType, { container: string; icon: string }> = {
  success: {
    container: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: "text-emerald-600",
  },
  error: {
    container: "bg-red-50 text-red-800 border-red-200",
    icon: "text-red-600",
  },
  info: {
    container: "bg-blue-50 text-blue-800 border-blue-200",
    icon: "text-blue-600",
  },
  warning: {
    container: "bg-amber-50 text-amber-800 border-amber-200",
    icon: "text-amber-600",
  },
};

/**
 * Reusable feedback banner displaying status messages with semantically themed icons.
 */
export const Alert: React.FC<AlertProps> = ({
  type,
  message,
  onDismiss,
  className = "",
}) => {
  const styles = ALERT_STYLES[type];

  return (
    <div
      role="alert"
      className={`p-4 rounded-xl flex items-center justify-between border ${styles.container} ${className}`}
    >
      <div className="flex items-center gap-3">
        {type === "success" && <CheckCircle2 className={`w-5 h-5 ${styles.icon} shrink-0`} />}
        {type === "error" && <AlertCircle className={`w-5 h-5 ${styles.icon} shrink-0`} />}
        {type === "info" && <Info className={`w-5 h-5 ${styles.icon} shrink-0`} />}
        {type === "warning" && <AlertTriangle className={`w-5 h-5 ${styles.icon} shrink-0`} />}
        <span className="text-sm font-medium">{message}</span>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss alert"
          className="p-1 rounded-lg text-current opacity-60 hover:opacity-100 transition-opacity ml-4 shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
