import { useState, useEffect } from "react";
import { ProjectList } from "./components/projects/ProjectList";
import { KanbanBoard } from "./components/board/KanbanBoard";
import { JiraSettings } from "./components/jira/JiraSettings";
import { ToastProvider } from "./components/layout/Toast";
import { listProjects } from "./lib/tauri";

type View = "projects" | "board" | "jira-settings";

function App() {
  const [view, setView] = useState<View>("projects");
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
      {view === "jira-settings" ? (
        <JiraSettings onBack={() => setView("projects")} />
      ) : view === "board" && selectedProjectId ? (
        <KanbanBoard
          projectId={selectedProjectId}
          projectName={projectName}
          onBack={() => {
            setSelectedProjectId(null);
            setView("projects");
          }}
        />
      ) : (
        <ProjectList
          onSelect={(id) => {
            setSelectedProjectId(id);
            setView("board");
          }}
          onJiraSettings={() => setView("jira-settings")}
        />
      )}
    </ToastProvider>
  );
}

export default App;
