import {
  WallDimensions,
  ShelfDimensions,
  Obstruction,
  ProjectSettings,
  WallItem,
} from '../types';

export interface SavedProject {
  id: string;
  name: string;
  wall: WallDimensions;
  shelves: (ShelfDimensions | WallItem)[];
  obstructions: Obstruction[];
  settings: ProjectSettings;
  savedAt: string;
}

const STORAGE_KEY = 'spotOnShelves_projects';
const CURRENT_PROJECT_KEY = 'spotOnShelves_currentProject';

export function saveProject(
  name: string,
  wall: WallDimensions,
  shelves: (ShelfDimensions | WallItem)[],
  obstructions: Obstruction[],
  settings: ProjectSettings
): SavedProject {
  const project: SavedProject = {
    id: `project-${Date.now()}`,
    name,
    wall,
    shelves,
    obstructions,
    settings,
    savedAt: new Date().toISOString(),
  };

  const projects = getAllProjects();
  projects.push(project);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  localStorage.setItem(CURRENT_PROJECT_KEY, project.id);

  return project;
}

export function getAllProjects(): SavedProject[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading projects:', error);
    return [];
  }
}

export function getProject(id: string): SavedProject | null {
  const projects = getAllProjects();
  return projects.find((p) => p.id === id) || null;
}

export function deleteProject(id: string): void {
  const projects = getAllProjects();
  const filtered = projects.filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

  const currentId = localStorage.getItem(CURRENT_PROJECT_KEY);
  if (currentId === id) {
    localStorage.removeItem(CURRENT_PROJECT_KEY);
  }
}

export function updateProject(
  id: string,
  updates: Partial<Omit<SavedProject, 'id' | 'savedAt'>>
): SavedProject | null {
  const projects = getAllProjects();
  const index = projects.findIndex((p) => p.id === id);

  if (index === -1) return null;

  projects[index] = {
    ...projects[index],
    ...updates,
    savedAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  return projects[index];
}

export function getCurrentProjectId(): string | null {
  return localStorage.getItem(CURRENT_PROJECT_KEY);
}

export function setCurrentProjectId(id: string): void {
  localStorage.setItem(CURRENT_PROJECT_KEY, id);
}

export function exportProjectAsJSON(project: SavedProject): void {
  const dataStr = JSON.stringify(project, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name.replace(/\s+/g, '_')}_${project.id}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function importProjectFromJSON(jsonString: string): SavedProject | null {
  try {
    const project = JSON.parse(jsonString) as SavedProject;
    // Generate new ID and timestamp
    project.id = `project-${Date.now()}`;
    project.savedAt = new Date().toISOString();

    const projects = getAllProjects();
    projects.push(project);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));

    return project;
  } catch (error) {
    console.error('Error importing project:', error);
    return null;
  }
}
