import { useState, useEffect } from "react";
import { ProjectList } from "./components/projects/ProjectList";
import { KanbanBoard } from "./components/board/KanbanBoard";
import { ToastProvider } from "./components/layout/Toast";
import { listProjects } from "./lib/tauri";

function App() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    if (selectedProjectId) {
      listProjects().then((projects) => {
        const p = projects.find((p) => p.id === selectedProjectId);
        if (p) setProjectName(p.name);
      });
    }
  }, [selectedProjectId]);

  return (
    <ToastProvider>
      {!selectedProjectId ? (
        <ProjectList onSelect={(id) => setSelectedProjectId(id)} />
      ) : (
        <KanbanBoard
          projectId={selectedProjectId}
          projectName={projectName}
          onBack={() => setSelectedProjectId(null)}
        />
      )}
    </ToastProvider>
  );
}

export default App;
