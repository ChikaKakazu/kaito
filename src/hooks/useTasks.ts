import { useState, useEffect, useCallback } from "react";
import type { Task, CreateTask, UpdateTask } from "../lib/types";
import * as api from "../lib/tauri";

export function useTasks(projectId: number | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await api.listTasks(projectId);
      setTasks(data);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async (input: CreateTask) => {
    const task = await api.createTask(input);
    setTasks((prev) => [...prev, task]);
    return task;
  };

  const editTask = async (input: UpdateTask) => {
    const task = await api.updateTask(input);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    return task;
  };

  const removeTask = async (id: number) => {
    await api.deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const moveTaskToColumn = async (
    taskId: number,
    columnId: number,
    position: number,
  ) => {
    const task = await api.moveTask(taskId, columnId, position);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    return task;
  };

  return {
    tasks,
    loading,
    addTask,
    editTask,
    removeTask,
    moveTaskToColumn,
    refetch: fetchTasks,
  };
}
