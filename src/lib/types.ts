export interface Project {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Column {
  id: number;
  project_id: number;
  name: string;
  position: number;
  created_at: string;
}

export interface Task {
  id: number;
  project_id: number;
  column_id: number;
  task_number: number;
  title: string;
  description: string | null;
  priority: "high" | "medium" | "low" | null;
  due_date: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: number;
  project_id: number;
  name: string;
  color: string;
}

export interface ChecklistItem {
  id: number;
  task_id: number;
  title: string;
  is_done: boolean;
  position: number;
}

export interface ChatMessage {
  id: number;
  project_id: number | null;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface CreateProject {
  name: string;
  description?: string;
}

export interface CreateTask {
  project_id: number;
  column_id: number;
  title: string;
  description?: string;
  priority?: "high" | "medium" | "low";
  due_date?: string;
}

export interface UpdateTask {
  id: number;
  title?: string;
  description?: string;
  priority?: "high" | "medium" | "low";
  due_date?: string;
  column_id?: number;
  position?: number;
}

export interface CreateColumn {
  project_id: number;
  name: string;
}

export interface CreateTag {
  project_id: number;
  name: string;
  color: string;
}

export interface CreateChecklistItem {
  task_id: number;
  title: string;
}

// Jira
export interface JiraSpace {
  id: number;
  name: string;
  base_url: string;
  email: string;
  access_token: string;
  project_key: string;
  last_fetched_at: string | null;
}

export interface CreateJiraSpace {
  name: string;
  base_url: string;
  email: string;
  access_token: string;
  project_key: string;
}

export interface JiraIssue {
  key: string;
  fields: JiraFields;
}

export interface JiraFields {
  summary: string;
  description: unknown | null;
  status: { name: string; statusCategory?: { key: string } } | null;
  priority: { name: string } | null;
  issuetype: { name: string } | null;
  assignee: { displayName: string } | null;
  created: string | null;
  updated: string | null;
}
