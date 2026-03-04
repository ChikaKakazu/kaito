import { useState, useEffect, useCallback } from "react";
import type { JiraSpace, CreateJiraSpace } from "../lib/types";
import * as api from "../lib/tauri";

export function useJiraSpaces() {
  const [spaces, setSpaces] = useState<JiraSpace[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSpaces = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listJiraSpaces();
      setSpaces(data);
    } catch (err) {
      console.error("Failed to fetch jira spaces:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  const addSpace = async (input: CreateJiraSpace) => {
    const space = await api.createJiraSpace(input);
    setSpaces((prev) => [...prev, space]);
    return space;
  };

  const removeSpace = async (id: number) => {
    await api.deleteJiraSpace(id);
    setSpaces((prev) => prev.filter((s) => s.id !== id));
  };

  return { spaces, loading, addSpace, removeSpace, refetch: fetchSpaces };
}
