import { AuditLog } from "./audit-logs.types";

/**
 * Fetches chronological audit logs for a task from the backend (GET /api/tasks/:id/audit-logs).
 *
 * @param taskId - Unique identifier of the task
 * @returns Array of chronological audit log entries
 */
export async function getAuditLogs(taskId: string): Promise<AuditLog[]> {
  const res = await fetch(`/api/tasks/${taskId}/audit-logs`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `Failed to fetch audit logs: ${res.status}`);
  }
  return json.data || [];
}
