import { useState } from "react";
import type { Task, Column, UpdateTask } from "../../lib/types";

export function TaskDetailModal({
  task,
  columns,
  onClose,
  onUpdate,
  onDelete,
}: {
  task: Task;
  columns: Column[];
  onClose: () => void;
  onUpdate: (update: UpdateTask) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState(task.priority || "");
  const [dueDate, setDueDate] = useState(task.due_date || "");
  const [columnId, setColumnId] = useState(task.column_id);

  const handleSave = async () => {
    await onUpdate({
      id: task.id,
      title: title !== task.title ? title : undefined,
      description: description !== (task.description || "") ? description : undefined,
      priority: priority !== (task.priority || "") ? (priority as "high" | "medium" | "low") : undefined,
      due_date: dueDate !== (task.due_date || "") ? dueDate : undefined,
      column_id: columnId !== task.column_id ? columnId : undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-xl w-full max-w-lg mx-4 p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="text-gray-400 font-mono text-sm">
            #{task.task_number}
          </span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            &times;
          </button>
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-xl font-bold bg-transparent border-b border-gray-600 focus:border-blue-500 focus:outline-none pb-2"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description..."
          rows={4}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500 resize-none"
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">None</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Status</label>
          <select
            value={columnId}
            onChange={(e) => setColumnId(Number(e.target.value))}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          >
            {columns.map((col) => (
              <option key={col.id} value={col.id}>
                {col.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-between pt-4 border-t border-gray-700">
          <button
            onClick={async () => {
              if (confirm("Delete this task?")) await onDelete();
            }}
            className="px-4 py-2 text-red-400 hover:text-red-300 text-sm transition-colors"
          >
            Delete
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
