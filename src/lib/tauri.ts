import { invoke } from "@tauri-apps/api/core";
import type {
  Project,
  Column,
  Task,
  Tag,
  ChecklistItem,
  CreateProject,
  CreateTask,
  UpdateTask,
  CreateColumn,
  CreateTag,
  CreateChecklistItem,
} from "./types";

// Projects
export const listProjects = () => invoke<Project[]>("list_projects");
export const createProject = (input: CreateProject) =>
  invoke<Project>("create_project", { input });
export const deleteProject = (id: number) =>
  invoke<void>("delete_project", { id });

// Columns
export const listColumns = (projectId: number) =>
  invoke<Column[]>("list_columns", { projectId });
export const createColumn = (input: CreateColumn) =>
  invoke<Column>("create_column", { input });
export const deleteColumn = (id: number) =>
  invoke<void>("delete_column", { id });
export const reorderColumns = (updates: { id: number; position: number }[]) =>
  invoke<void>("reorder_columns", { updates });

// Tasks
export const listTasks = (projectId: number) =>
  invoke<Task[]>("list_tasks", { projectId });
export const createTask = (input: CreateTask) =>
  invoke<Task>("create_task", { input });
export const updateTask = (input: UpdateTask) =>
  invoke<Task>("update_task", { input });
export const deleteTask = (id: number) => invoke<void>("delete_task", { id });
export const moveTask = (taskId: number, columnId: number, position: number) =>
  invoke<Task>("move_task", { taskId, columnId, position });

// Tags
export const listTags = (projectId: number) =>
  invoke<Tag[]>("list_tags", { projectId });
export const createTag = (input: CreateTag) =>
  invoke<Tag>("create_tag", { input });
export const deleteTag = (id: number) => invoke<void>("delete_tag", { id });
export const addTagToTask = (taskId: number, tagId: number) =>
  invoke<void>("add_tag_to_task", { taskId, tagId });
export const removeTagFromTask = (taskId: number, tagId: number) =>
  invoke<void>("remove_tag_from_task", { taskId, tagId });
export const getTaskTags = (taskId: number) =>
  invoke<Tag[]>("get_task_tags", { taskId });

// Checklists
export const listChecklistItems = (taskId: number) =>
  invoke<ChecklistItem[]>("list_checklist_items", { taskId });
export const createChecklistItem = (input: CreateChecklistItem) =>
  invoke<ChecklistItem>("create_checklist_item", { input });
export const toggleChecklistItem = (id: number) =>
  invoke<ChecklistItem>("toggle_checklist_item", { id });
export const deleteChecklistItem = (id: number) =>
  invoke<void>("delete_checklist_item", { id });
