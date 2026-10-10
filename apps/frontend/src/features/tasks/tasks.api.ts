import { Task, CreateTaskInput, UpdateTaskStatusInput } from "./tasks.types";

const BASE_URL = "/api/tasks";

/**
 * Internal helper to validate HTTP response statuses and parse standard JSON payloads.
 * Throws Error on non-2xx statuses with backend error message details.
 */
async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = json.error || (json.details ? JSON.stringify(json.details) : `Request failed with status ${res.status}`);
    throw new Error(errorMsg);
  }
  return json.data !== undefined ? json.data : json;
}

/**
 * Fetches all active tasks from the backend (GET /api/tasks).
 */
export async function getTasks(status?: string): Promise<Task[]> {
  const url =
    status && status !== "all"
      ? `${BASE_URL}?status=${encodeURIComponent(status)}`
      : BASE_URL;
  const res = await fetch(url);
  return handleResponse<Task[]>(res);
}

/**
 * Sends a request to create a new task (POST /api/tasks).
 */
export async function createTask(input: CreateTaskInput): Promise<Task> {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<Task>(res);
}

/**
 * Sends a status transition request with selected actor (PUT /api/tasks/:id/status).
 */
export async function updateTaskStatus(
  id: string,
  input: UpdateTaskStatusInput
): Promise<{ task: Task; auditLog: unknown; idempotent: boolean; message: string }> {
  const res = await fetch(`${BASE_URL}/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse(res);
}

/**
 * Sends a soft delete request for a task (DELETE /api/tasks/:id).
 */
export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });
  await handleResponse(res);
}
