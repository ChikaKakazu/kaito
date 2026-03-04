import type { Project } from "../../lib/types";

export function ProjectCard({
  project,
  onClick,
  onDelete,
}: {
  project: Project;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-gray-800 border border-gray-700 rounded-xl p-5 cursor-pointer hover:border-blue-500 transition-colors group"
    >
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold">{project.name}</h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Delete "${project.name}"?`)) onDelete();
          }}
          className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-sm"
        >
          Delete
        </button>
      </div>
      {project.description && (
        <p className="text-gray-400 text-sm mt-2">{project.description}</p>
      )}
      <p className="text-gray-500 text-xs mt-3">
        Created {new Date(project.created_at).toLocaleDateString()}
      </p>
    </div>
  );
}
