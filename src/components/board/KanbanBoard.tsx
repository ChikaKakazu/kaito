import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useColumns } from "../../hooks/useColumns";
import { useTasks } from "../../hooks/useTasks";
import { useJiraSpaces } from "../../hooks/useJiraSpaces";
import { BoardColumn } from "./Column";
import { TaskCard } from "./TaskCard";
import { TaskDetailModal } from "./TaskDetailModal";
import { ChatPanel } from "../chat/ChatPanel";
import { JiraBoard } from "../jira/JiraBoard";
import type { Task } from "../../lib/types";

type ActiveTab = "local" | "jira";

export function KanbanBoard({
  projectId,
  projectName,
  onBack,
}: {
  projectId: number;
  projectName: string;
  onBack: () => void;
}) {
  const { columns, addColumn } = useColumns(projectId);
  const { tasks, addTask, editTask, removeTask, moveTaskToColumn, refetch } =
    useTasks(projectId);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newColName, setNewColName] = useState("");
  const [showAddCol, setShowAddCol] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("local");
  const { spaces } = useJiraSpaces();
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as number;
    const overId = over.id;

    let targetColumnId: number;
    if (typeof overId === "string" && overId.startsWith("col-")) {
      targetColumnId = parseInt(overId.replace("col-", ""));
    } else {
      const overTask = tasks.find((t) => t.id === Number(overId));
      if (!overTask) return;
      targetColumnId = overTask.column_id;
    }

    const tasksInColumn = tasks
      .filter((t) => t.column_id === targetColumnId && t.id !== taskId)
      .sort((a, b) => a.position - b.position);
    const newPosition = tasksInColumn.length;

    await moveTaskToColumn(taskId, targetColumnId, newPosition);
  };

  const handleAddColumn = async () => {
    if (!newColName.trim()) return;
    await addColumn({ project_id: projectId, name: newColName.trim() });
    setNewColName("");
    setShowAddCol(false);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-700">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white transition-colors"
        >
          &larr; Back
        </button>
        <h1 className="text-xl font-bold">{projectName}</h1>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 px-6 pt-2 border-b border-gray-700">
        <button
          onClick={() => setActiveTab("local")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === "local"
              ? "bg-gray-800 text-white border-b-2 border-blue-500"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Local
        </button>
        <button
          onClick={() => setActiveTab("jira")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === "jira"
              ? "bg-gray-800 text-white border-b-2 border-blue-500"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Jira
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === "local" ? (
          <>
            {/* Board area */}
            <div className="flex-1 flex overflow-x-auto p-6 gap-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                {columns.map((col) => (
                  <BoardColumn
                    key={col.id}
                    column={col}
                    tasks={tasks
                      .filter((t) => t.column_id === col.id)
                      .sort((a, b) => a.position - b.position)}
                    onAddTask={async (title) => {
                      await addTask({
                        project_id: projectId,
                        column_id: col.id,
                        title,
                      });
                    }}
                    onTaskClick={(task) => setSelectedTask(task)}
                  />
                ))}
                <DragOverlay>
                  {activeTask ? (
                    <TaskCard task={activeTask} isDragging onClick={() => {}} />
                  ) : null}
                </DragOverlay>
              </DndContext>

              {/* Add column */}
              <div className="flex-shrink-0 w-72">
                {showAddCol ? (
                  <div className="bg-gray-800 rounded-xl p-3 space-y-2">
                    <input
                      type="text"
                      value={newColName}
                      onChange={(e) => setNewColName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddColumn()}
                      placeholder="Column name..."
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddColumn}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setShowAddCol(false)}
                        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddCol(true)}
                    className="w-full py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl border border-dashed border-gray-700 transition-colors text-sm"
                  >
                    + Add Column
                  </button>
                )}
              </div>
            </div>

            {/* Chat Panel */}
            <div className="w-80 flex-shrink-0 border-l border-gray-700 bg-gray-800">
              <ChatPanel
                projectId={projectId}
                contextType="local"
                onTasksChanged={refetch}
              />
            </div>
          </>
        ) : (
          /* Jira tab */
          <>
            <div className="flex-1 flex flex-col overflow-hidden">
              {spaces.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-gray-400 text-sm">
                    No Jira spaces configured. Go to Jira Settings to add one.
                  </p>
                </div>
              ) : !selectedSpaceId ? (
                <div className="p-6 space-y-3">
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                    Select a Space
                  </h2>
                  {spaces.map((space) => (
                    <button
                      key={space.id}
                      onClick={() => setSelectedSpaceId(space.id)}
                      className="w-full text-left bg-gray-800 hover:bg-gray-750 rounded-xl p-4 transition-colors"
                    >
                      <h3 className="font-semibold">{space.name}</h3>
                      <p className="text-sm text-gray-400">
                        {space.project_key} &middot; {space.base_url}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="px-4 py-2 border-b border-gray-700">
                    <button
                      onClick={() => setSelectedSpaceId(null)}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      &larr; All Spaces
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <JiraBoard
                      spaceId={selectedSpaceId}
                      spaceName={
                        spaces.find((s) => s.id === selectedSpaceId)?.name ?? ""
                      }
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="w-80 flex-shrink-0 border-l border-gray-700 bg-gray-800">
              <ChatPanel
                projectId={projectId}
                contextType="jira"
                onTasksChanged={refetch}
              />
            </div>
          </>
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          columns={columns}
          onClose={() => setSelectedTask(null)}
          onUpdate={async (update) => {
            const updated = await editTask(update);
            setSelectedTask(updated);
          }}
          onDelete={async () => {
            await removeTask(selectedTask.id);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}
