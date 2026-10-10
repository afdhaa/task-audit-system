import { useEffect, useState } from "react";
import { Task, CreateTaskInput } from "./features/tasks/tasks.types";
import { getTasks, createTask, updateTaskStatus, deleteTask } from "./features/tasks/tasks.api";
import { TaskCard } from "./features/tasks/components/TaskCard";
import { CreateTaskModal } from "./features/tasks/components/CreateTaskModal";
import { AuditLogsModal } from "./features/audit-logs/components/AuditLogsModal";
import { TaskStatus, PREDEFINED_ACTORS } from "./shared/constants";
import { Alert } from "./shared/components";
import {
  ListTodo,
  Plus,
  UserCheck,
  RefreshCw,
  AlertCircle,
  Shield,
  Layers,
} from "lucide-react";

/**
 * Main application root component for Mini Task Manager.
 * Manages global task list state, user feedback notifications, active default actor,
 * status filtering, and modal dialog states.
 */
export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const [activeActor, setActiveActor] = useState<string>(PREDEFINED_ACTORS[0]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [auditTask, setAuditTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  /**
   * Loads all active tasks from backend on initial mount or manual refresh.
   */
  const loadTasks = async (statusToFetch: string = filterStatus) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTasks(statusToFetch !== "all" ? statusToFetch : undefined);
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks(filterStatus);
  }, [filterStatus]);

  /**
   * Displays a temporary notification banner (success, error, info) for 5 seconds.
   */
  const showFeedback = (type: "success" | "error" | "info", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback((current) => (current?.message === message ? null : current));
    }, 5000);
  };

  /**
   * Dispatches task creation request to backend and prepends the new task to state.
   */
  const handleCreateTask = async (input: CreateTaskInput) => {
    const created = await createTask(input);
    showFeedback("success", `Task "${created.title}" successfully created with initial status 'To Do'.`);
    await loadTasks(filterStatus);
  };

  /**
   * Dispatches status transition request to backend, updates task state,
   * and displays feedback regarding success, idempotency, or domain rejection.
   */
  const handleUpdateStatus = async (
    taskId: string,
    targetStatus: TaskStatus,
    actorToUse: string
  ) => {
    try {
      const result = await updateTaskStatus(taskId, {
        status: targetStatus,
        actor: actorToUse,
      });

      // Refetch fresh task list from backend
      await loadTasks(filterStatus);
      if (result.idempotent) {
        showFeedback(
          "info",
          `Idempotent update: Task was already in status '${targetStatus}'. No audit log was created.`
        );
      } else {
        showFeedback(
          "success",
          `Status updated to '${targetStatus}'. Audit log recorded for actor "${actorToUse}".`
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update status";
      showFeedback("error", `Transition Rejected: ${msg}`);
    }
  };

  /**
   * Performs soft deletion of a task via backend and removes it from active state.
   */
  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      await loadTasks(filterStatus);
      showFeedback("success", "Task deleted (soft delete applied; audit history preserved).");
    } catch (err) {
      showFeedback("error", err instanceof Error ? err.message : "Failed to delete task");
    }
  };

  const filteredTasks = tasks;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Navbar Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                Mini Task Manager
              </h1>
              <p className="text-xs text-slate-500">
                Immutable Audit Log System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Actor Selector */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
              <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-slate-500 font-medium">Default Actor:</span>
              <select
                value={activeActor}
                onChange={(e) => setActiveActor(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                {PREDEFINED_ACTORS.map((act) => (
                  <option key={act} value={act}>
                    {act}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
        {/* Banner Notification Feedback */}
        {feedback && (
          <Alert
            type={feedback.type}
            message={feedback.message}
            onDismiss={() => setFeedback(null)}
            className="mb-6 animate-in fade-in slide-in-from-top-2 duration-200"
          />
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => loadTasks()}
              className="text-xs bg-red-100 hover:bg-red-200 px-3 py-1 rounded-md font-semibold transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Filter Bar & Stats */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs">
            <Layers className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-700">Filter Status:</span>
            <div className="flex flex-wrap gap-1">
              {["all", "to_do", "pending", "in_progress", "done"].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1 rounded-md font-medium capitalize transition ${
                    filterStatus === st
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-800">{tasks.length}</strong> task(s)
            </span>
            <button
              onClick={() => loadTasks()}
              disabled={loading}
              className="p-1.5 hover:bg-slate-100 rounded-md transition text-slate-600"
              title="Refresh tasks"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Task List Grid */}
        {loading && tasks.length === 0 ? (
          <div className="py-20 text-center text-slate-500 flex flex-col items-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-medium">Loading tasks from database...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
            <ListTodo className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700">No tasks found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              {filterStatus !== "all"
                ? `There are no tasks with status '${filterStatus}'. Try selecting another filter.`
                : "Get started by creating your first task using the button above."}
            </p>
            {filterStatus === "all" && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create Task</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                defaultActor={activeActor}
                onUpdateStatus={handleUpdateStatus}
                onDeleteTask={handleDeleteTask}
                onViewAuditLogs={(t) => setAuditTask(t)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateTask}
      />

      {auditTask && (
        <AuditLogsModal
          taskId={auditTask.id}
          taskTitle={auditTask.title}
          onClose={() => setAuditTask(null)}
        />
      )}
    </div>
  );
}
