import React, { useState } from "react";
import { Task } from "../tasks.types";
import { StatusBadge } from "../../../shared/components";
import {
  TaskStatus,
  VALID_STATUSES,
  STATUS_LABELS,
  ALLOWED_TRANSITIONS,
  PREDEFINED_ACTORS,
} from "../../../shared/constants";
import {
  History,
  Trash2,
  ArrowRight,
  User,
  Clock,
  Sparkles,
  CheckCircle,
} from "lucide-react";

interface TaskCardProps {
  task: Task;
  defaultActor: string;
  onUpdateStatus: (taskId: string, status: TaskStatus, actor: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onViewAuditLogs: (task: Task) => void;
}

/**
 * Card component displaying task metadata, status badge, transition controls,
 * actor dropdown selector, delete action, and audit log viewer trigger.
 */
export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  defaultActor,
  onUpdateStatus,
  onDeleteTask,
  onViewAuditLogs,
}) => {
  const [selectedActor, setSelectedActor] = useState<string>(defaultActor);
  const nextValidStatus = ALLOWED_TRANSITIONS[task.status];
  const currentStatusIndex = VALID_STATUSES.indexOf(task.status);
  // UX Guardrail: Filter out previous statuses to prevent backwards rollback in UI
  const selectableTargetStatuses = VALID_STATUSES.filter(
    (_, index) => index >= currentStatusIndex
  );
  const [targetStatus, setTargetStatus] = useState<TaskStatus>(
    nextValidStatus || task.status
  );
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  /**
   * Initiates task status transition using the currently selected actor.
   */
  const handleUpdate = async (statusToSet: TaskStatus) => {
    try {
      setUpdating(true);
      await onUpdateStatus(task.id, statusToSet, selectedActor);
    } finally {
      setUpdating(false);
    }
  };

  /**
   * Confirms and triggers soft deletion of the task.
   */
  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete task "${task.title}"?`)) {
      return;
    }
    try {
      setDeleting(true);
      await onDeleteTask(task.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        {/* Top Header: Status & Actions */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <StatusBadge status={task.status} />
          <div className="flex items-center gap-1">
            <button
              onClick={() => onViewAuditLogs(task)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition"
              title="View Audit Logs"
            >
              <History className="w-3.5 h-3.5" />
              <span>Logs</span>
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Task Title & Description */}
        <h3 className="text-base font-semibold text-gray-900 mb-1">{task.title}</h3>
        {task.description && (
          <p className="text-sm text-gray-600 line-clamp-3 mb-3">{task.description}</p>
        )}

        <div className="text-xs text-gray-400 flex items-center gap-1 mb-4">
          <Clock className="w-3.5 h-3.5" />
          <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Control Panel: Actor and Status Transition */}
      <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 bg-slate-50 -mx-5 -mb-5 p-4 rounded-b-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {/* Actor Dropdown */}
          <div>
            <label className="text-gray-500 font-medium flex items-center gap-1 mb-1">
              <User className="w-3 h-3" /> Actor
            </label>
            <select
              value={selectedActor}
              onChange={(e) => setSelectedActor(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-800 focus:ring-1 focus:ring-indigo-500"
            >
              {PREDEFINED_ACTORS.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          {/* Target Status Dropdown */}
          <div>
            <label className="text-gray-500 font-medium flex items-center gap-1 mb-1">
              <ArrowRight className="w-3 h-3" /> Target Status
            </label>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value as TaskStatus)}
              className="w-full bg-white border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-800 focus:ring-1 focus:ring-indigo-500"
            >
              {selectableTargetStatuses.map((st) => (
                <option key={st} value={st}>
                  {STATUS_LABELS[st]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Transition Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => handleUpdate(targetStatus)}
            disabled={updating}
            className="flex-1 py-1.5 px-3 bg-gray-900 hover:bg-black text-white text-xs font-medium rounded-md transition disabled:opacity-50"
          >
            {updating ? "Updating..." : "Apply Status"}
          </button>

          {nextValidStatus && (
            <button
              onClick={() => handleUpdate(nextValidStatus)}
              disabled={updating}
              className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-md transition flex items-center gap-1 disabled:opacity-50 shrink-0"
              title={`Advance to ${STATUS_LABELS[nextValidStatus]}`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Next: {STATUS_LABELS[nextValidStatus]}</span>
            </button>
          )}

          {task.status === "done" && (
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 py-1 px-2 bg-emerald-50 rounded border border-emerald-200">
              <CheckCircle className="w-3.5 h-3.5" /> Completed
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
