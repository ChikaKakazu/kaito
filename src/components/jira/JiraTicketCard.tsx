import type { JiraIssue } from "../../lib/types";

export function JiraTicketCard({ issue }: { issue: JiraIssue }) {
  const { fields } = issue;

  const priorityColor: Record<string, string> = {
    Highest: "text-red-400",
    High: "text-orange-400",
    Medium: "text-yellow-400",
    Low: "text-blue-400",
    Lowest: "text-gray-400",
  };

  return (
    <div className="bg-gray-700 rounded-lg p-3 space-y-2 hover:bg-gray-650 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-gray-400 font-mono">{issue.key}</span>
        {fields.priority && (
          <span
            className={`text-xs font-medium ${priorityColor[fields.priority.name] ?? "text-gray-400"}`}
          >
            {fields.priority.name}
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-white leading-snug">
        {fields.summary}
      </p>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2">
          {fields.issuetype && (
            <span className="bg-gray-600 px-1.5 py-0.5 rounded">
              {fields.issuetype.name}
            </span>
          )}
        </div>
        {fields.assignee && (
          <span className="truncate max-w-[120px]">
            {fields.assignee.displayName}
          </span>
        )}
      </div>
      {fields.updated && (
        <p className="text-xs text-gray-500">
          Updated: {new Date(fields.updated).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
