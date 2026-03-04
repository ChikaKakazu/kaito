import { useDraggable } from "@dnd-kit/core";
import type { Task } from "../../lib/types";

const priorityColors: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
};

export function TaskCard({
  task,
  isDragging = false,
  onClick,
}: {
  task: Task;
  isDragging?: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-gray-700 border border-gray-600 rounded-lg p-3 cursor-pointer hover:border-gray-500 transition-colors ${
        isDragging ? "opacity-80 shadow-lg ring-2 ring-blue-500" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-gray-400 font-mono">
          #{task.task_number}
        </span>
        {task.priority && (
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${priorityColors[task.priority]}`}
          />
        )}
      </div>
      <p className="text-sm mt-1 font-medium">{task.title}</p>
      {task.due_date && (
        <p className="text-xs text-gray-400 mt-2">{task.due_date}</p>
      )}
    </div>
  );
}
