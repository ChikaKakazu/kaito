import { useState } from "react";
import { useJiraIssues } from "../../hooks/useJiraIssues";
import { JiraTicketCard } from "./JiraTicketCard";
import { CreateJiraIssueForm } from "./CreateJiraIssueForm";

export function JiraBoard({
  spaceId,
  spaceName,
}: {
  spaceId: number;
  spaceName: string;
}) {
  const { issues, loading, error, refetch } = useJiraIssues(spaceId);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Group issues by status, track category key for sorting
  const grouped = new Map<string, typeof issues>();
  const categoryByStatus = new Map<string, string>();
  for (const issue of issues) {
    const status = issue.fields.status?.name ?? "Unknown";
    const categoryKey = issue.fields.status?.statusCategory?.key ?? "undefined";
    if (!grouped.has(status)) grouped.set(status, []);
    grouped.get(status)!.push(issue);
    categoryByStatus.set(status, categoryKey);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700">
        <h2 className="text-sm font-semibold text-white">{spaceName}</h2>
        <button
          onClick={refetch}
          className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition-colors"
        >
          Refresh
        </button>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors"
        >
          + New Issue
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="px-4 py-3 border-b border-gray-700">
          <CreateJiraIssueForm
            spaceId={spaceId}
            onCreated={() => {
              setShowCreateForm(false);
              refetch();
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-x-auto p-4">
        {loading ? (
          <p className="text-gray-400 text-sm">Loading issues...</p>
        ) : error ? (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={refetch}
              className="mt-2 text-xs text-red-300 hover:text-white underline"
            >
              Retry
            </button>
          </div>
        ) : issues.length === 0 ? (
          <p className="text-gray-400 text-sm">
            No issues found. Click &quot;+ New Issue&quot; to create one.
          </p>
        ) : (
          <div className="flex gap-4 h-full">
            {Array.from(grouped.entries())
              .sort(([a], [b]) => {
                // Jira statusCategory.key: "new" (To Do), "indeterminate" (In Progress), "done" (Done)
                const categoryOrder: Record<string, number> = {
                  new: 0,
                  indeterminate: 1,
                  done: 2,
                };
                const ai = categoryOrder[categoryByStatus.get(a) ?? ""] ?? 99;
                const bi = categoryOrder[categoryByStatus.get(b) ?? ""] ?? 99;
                return ai - bi;
              })
              .map(([status, statusIssues]) => (
              <div
                key={status}
                className="flex-shrink-0 w-72 bg-gray-800 rounded-xl flex flex-col"
              >
                <div className="px-3 py-2 border-b border-gray-700">
                  <h3 className="text-sm font-semibold text-white">
                    {status}{" "}
                    <span className="text-gray-400 font-normal">
                      ({statusIssues.length})
                    </span>
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {statusIssues.map((issue) => (
                    <JiraTicketCard key={issue.key} issue={issue} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
