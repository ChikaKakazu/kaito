import { useState, useEffect, useCallback } from "react";
import type { Project, CreateProject } from "../lib/types";
import * as api from "../lib/tauri";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listProjects();
      setProjects(data);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const addProject = async (input: CreateProject) => {
    const project = await api.createProject(input);
    setProjects((prev) => [project, ...prev]);
    return project;
  };

  const removeProject = async (id: number) => {
    await api.deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  return { projects, loading, addProject, removeProject, refetch: fetchProjects };
}
