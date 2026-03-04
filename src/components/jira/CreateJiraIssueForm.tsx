import { useState } from "react";
import { createJiraIssue } from "../../lib/tauri";

export function CreateJiraIssueForm({
  spaceId,
  onCreated,
  onCancel,
}: {
  spaceId: number;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!summary.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await createJiraIssue(
        spaceId,
        summary.trim(),
        description.trim() || undefined,
      );
      setSummary("");
      setDescription("");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-white">New Issue</h3>
      <input
        type="text"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder="Summary (required)"
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
        autoFocus
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        rows={3}
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={submitting || !summary.trim()}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded text-sm text-white transition-colors"
        >
          {submitting ? "Creating..." : "Create"}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
