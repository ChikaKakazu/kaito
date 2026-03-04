import { useState, useEffect, useCallback } from "react";
import type { Column, CreateColumn } from "../lib/types";
import * as api from "../lib/tauri";

export function useColumns(projectId: number | null) {
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchColumns = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await api.listColumns(projectId);
      setColumns(data);
    } catch (err) {
      console.error("Failed to fetch columns:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchColumns();
  }, [fetchColumns]);

  const addColumn = async (input: CreateColumn) => {
    const col = await api.createColumn(input);
    setColumns((prev) => [...prev, col]);
    return col;
  };

  const removeColumn = async (id: number) => {
    await api.deleteColumn(id);
    setColumns((prev) => prev.filter((c) => c.id !== id));
  };

  return { columns, loading, addColumn, removeColumn, refetch: fetchColumns };
}
