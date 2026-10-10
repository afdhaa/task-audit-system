export type TaskStatus = "to_do" | "pending" | "in_progress" | "done";

export const VALID_STATUSES: TaskStatus[] = [
  "to_do",
  "pending",
  "in_progress",
  "done",
];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  to_do: "To Do",
  pending: "Pending",
  in_progress: "In Progress",
  done: "Done",
};

export const STATUS_BADGE_STYLES: Record<TaskStatus, string> = {
  to_do: "bg-slate-100 text-slate-700 border-slate-300",
  pending: "bg-amber-100 text-amber-800 border-amber-300",
  in_progress: "bg-blue-100 text-blue-800 border-blue-300",
  done: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

export const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus | null> = {
  to_do: "pending",
  pending: "in_progress",
  in_progress: "done",
  done: null,
};

export const PREDEFINED_ACTORS = [
  "john.doe",
  "jane.smith",
  "bob.wilson",
  "alice.walker",
] as const;

export type PredefinedActor = (typeof PREDEFINED_ACTORS)[number];
