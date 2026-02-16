"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface ProjectInfo {
  projectId: string;
  projectName: string;
}

interface ProjectContextType {
  project: ProjectInfo | null;
  setProject: (project: ProjectInfo | null) => void;
}

const ProjectContext = createContext<ProjectContextType>({
  project: null,
  setProject: () => {},
});

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<ProjectInfo | null>(null);
  return (
    <ProjectContext.Provider value={{ project, setProject }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  return useContext(ProjectContext);
}
