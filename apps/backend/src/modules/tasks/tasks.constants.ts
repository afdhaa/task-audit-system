import { TaskStatus } from "@prisma/client";

export { TaskStatus };

export const VALID_STATUSES: TaskStatus[] = [
  TaskStatus.to_do,
  TaskStatus.pending,
  TaskStatus.in_progress,
  TaskStatus.done,
];

export const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus | null> = {
  [TaskStatus.to_do]: TaskStatus.pending,
  [TaskStatus.pending]: TaskStatus.in_progress,
  [TaskStatus.in_progress]: TaskStatus.done,
  [TaskStatus.done]: null,
};

export const PREDEFINED_ACTORS = [
  "john.doe",
  "jane.smith",
  "bob.wilson",
  "alice.walker",
] as const;

export type PredefinedActor = (typeof PREDEFINED_ACTORS)[number];

/**
 * Validates whether the transition from current status to target status obeys the strict sequential order:
 * to_do -> pending -> in_progress -> done.
 *
 * @param fromStatus - Current task status recorded in database
 * @param toStatus - Requested target status
 * @returns True if the transition is allowed, false otherwise
 */
export function isValidTransition(
  fromStatus: TaskStatus,
  toStatus: TaskStatus
): boolean {
  return ALLOWED_TRANSITIONS[fromStatus] === toStatus;
}

/**
 * Formats a human-readable audit narrative conforming to assessment requirements.
 * Example: User "john.doe" changed Task "Prepare Invoice" status from "pending" to "in_progress" at 2025-01-01 10:00
 */
export function formatAuditMessage(
  actor: string,
  taskTitle: string,
  fromStatus: string,
  toStatus: string,
  createdAt: Date
): string {
  const formattedDate = createdAt.toISOString().replace("T", " ").substring(0, 16);
  return `User "${actor}" changed Task "${taskTitle}" status from "${fromStatus}" to "${toStatus}" at ${formattedDate}`;
}
