import { useState, useEffect, useCallback } from "react";
import type { JiraIssue } from "../lib/types";
import * as api from "../lib/tauri";

export function useJiraIssues(spaceId: number | null) {
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIssues = useCallback(async () => {
    if (spaceId === null) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchJiraIssues(spaceId);
      setIssues(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      console.error("Failed to fetch jira issues:", err);
    } finally {
      setLoading(false);
    }
  }, [spaceId]);

  useEffect(() => {
    if (spaceId !== null) {
      fetchIssues();
    } else {
      setIssues([]);
      setError(null);
    }
  }, [spaceId, fetchIssues]);

  const addIssue = async (summary: string, description?: string) => {
    if (spaceId === null) throw new Error("No space selected");
    const issue = await api.createJiraIssue(spaceId, summary, description);
    setIssues((prev) => [issue, ...prev]);
    return issue;
  };

  return { issues, loading, error, addIssue, refetch: fetchIssues };
}
