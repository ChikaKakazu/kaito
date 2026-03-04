import { useState } from "react";
import { useProjects } from "../../hooks/useProjects";
import { ProjectCard } from "./ProjectCard";

export function ProjectList({
  onSelect,
}: {
  onSelect: (id: number) => void;
}) {
  const { projects, loading, addProject, removeProject } = useProjects();
  const [name, setName] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const project = await addProject({ name: name.trim() });
    setName("");
    setShowForm(false);
    onSelect(project.id);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8">Kaito - AI Kanban</h1>

        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-xl font-semibold">Projects</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            + New Project
          </button>
        </div>

        {showForm && (
          <div className="mb-6 flex gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Project name..."
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
              autoFocus
            />
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : projects.length === 0 ? (
          <p className="text-gray-400">
            No projects yet. Create one to get started.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => onSelect(project.id)}
                onDelete={() => removeProject(project.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
