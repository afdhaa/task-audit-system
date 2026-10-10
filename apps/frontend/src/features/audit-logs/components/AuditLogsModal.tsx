import React, { useEffect, useState } from "react";
import { AuditLog } from "../audit-logs.types";
import { getAuditLogs } from "../audit-logs.api";
import { Modal, Alert, StatusBadge } from "../../../shared/components";
import { Clock, User, ArrowRight, ShieldCheck } from "lucide-react";

interface AuditLogsModalProps {
  taskId: string;
  taskTitle: string;
  onClose: () => void;
}

/**
 * Modal dialog component rendering chronological audit log records with timeline graphics,
 * actor badges, transition state changes, and narrative audit summaries.
 */
export const AuditLogsModal: React.FC<AuditLogsModalProps> = ({
  taskId,
  taskTitle,
  onClose,
}) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    /**
     * Fetches audit log records from backend and updates local component state.
     */
    async function fetchLogs() {
      try {
        setLoading(true);
        setError(null);
        const data = await getAuditLogs(taskId);
        if (mounted) {
          setLogs(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load audit logs");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    fetchLogs();
    return () => {
      mounted = false;
    };
  }, [taskId]);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Audit History"
      subtitle={
        <>
          Task: <span className="font-semibold text-gray-700">{taskTitle}</span>
        </>
      }
      icon={<ShieldCheck className="w-5 h-5 text-indigo-600" />}
      maxWidth="max-w-2xl"
    >
      {/* Content */}
      <div className="p-6 overflow-y-auto max-h-[60vh] flex-1">
        {loading && (
          <div className="py-12 text-center text-gray-500 flex flex-col items-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <span>Loading audit logs...</span>
          </div>
        )}

        {error && (
          <Alert
            type="error"
            message={error}
            onDismiss={() => setError(null)}
            className="mb-4"
          />
        )}

        {!loading && !error && logs.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-base font-medium text-gray-700">No status transitions recorded yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Audit logs are created whenever the task status successfully advances.
            </p>
          </div>
        )}

        {!loading && !error && logs.length > 0 && (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-100">
            {logs.map((log) => (
              <div key={log.id} className="relative group">
                {/* Timeline dot */}
                <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-indigo-600 shadow-sm"></div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 transition hover:border-indigo-300">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                      <User className="w-3.5 h-3.5" />
                      <span>{log.actor}</span>
                    </div>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 my-2 text-sm font-medium">
                    <StatusBadge status={log.fromStatus} />
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <StatusBadge status={log.toStatus} />
                  </div>

                  <p className="text-xs text-gray-600 italic bg-white p-2 rounded border border-gray-100">
                    "{log.message}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center text-xs text-gray-500">
        <span>{logs.length} record(s) recorded • Append-only</span>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};
