import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { TaskCard } from "./TaskCard";
import type { Column, Task } from "../../lib/types";

export function BoardColumn({
  column,
  tasks,
  onAddTask,
  onTaskClick,
}: {
  column: Column;
  tasks: Task[];
  onAddTask: (title: string) => Promise<void>;
  onTaskClick: (task: Task) => void;
}) {
  const [newTitle, setNewTitle] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const { setNodeRef, isOver } = useDroppable({ id: `col-${column.id}` });

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    await onAddTask(newTitle.trim());
    setNewTitle("");
    setShowAdd(false);
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-72 bg-gray-800 rounded-xl flex flex-col max-h-full ${
        isOver ? "ring-2 ring-blue-500" : ""
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <h3 className="font-semibold text-sm">{column.name}</h3>
        <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* Tasks */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={() => onTaskClick(task)}
          />
        ))}
      </div>

      {/* Add Task */}
      <div className="p-3 border-t border-gray-700">
        {showAdd ? (
          <div className="space-y-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Task title..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm"
              >
                Add
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full py-2 text-gray-400 hover:text-white text-sm transition-colors"
          >
            + Add Task
          </button>
        )}
      </div>
    </div>
  );
}
