import {
  WallDimensions,
  ShelfDimensions,
  Obstruction,
  ProjectSettings,
  WallItem,
  WallMaterial,
  MountingType,
  Alignment,
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

function generateProjectId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `project-${crypto.randomUUID()}`;
  }
  return `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function persistProjects(projects: SavedProject[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error('Error writing projects:', error);
    throw new Error(
      'Unable to save projects to local storage. Storage may be full.',
    );
  }
}

function persistCurrentProjectId(id: string): void {
  try {
    localStorage.setItem(CURRENT_PROJECT_KEY, id);
  } catch (error) {
    console.error('Error writing current project ID:', error);
    throw new Error(
      'Unable to update current project in local storage. Storage may be unavailable.',
    );
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isWallMaterial(value: unknown): value is WallMaterial {
  return (
    value === 'drywall' ||
    value === 'plaster' ||
    value === 'concrete' ||
    value === 'brick'
  );
}

function isMountingType(value: unknown): value is MountingType {
  return value === 'floating' || value === 'bracketed' || value === 'l-bracket';
}

function isAlignment(value: unknown): value is Alignment {
  return value === 'left' || value === 'center' || value === 'right';
}

function isWallDimensions(value: unknown): value is WallDimensions {
  return (
    isObject(value) &&
    typeof value.width === 'number' &&
    Number.isFinite(value.width) &&
    value.width > 0 &&
    typeof value.height === 'number' &&
    Number.isFinite(value.height) &&
    value.height > 0
  );
}

function isObstruction(value: unknown): value is Obstruction {
  return (
    isObject(value) &&
    typeof value.id === 'string' &&
    typeof value.type === 'string' &&
    typeof value.width === 'number' &&
    Number.isFinite(value.width) &&
    typeof value.height === 'number' &&
    Number.isFinite(value.height) &&
    typeof value.distanceFromLeft === 'number' &&
    Number.isFinite(value.distanceFromLeft) &&
    typeof value.distanceFromFloor === 'number' &&
    Number.isFinite(value.distanceFromFloor)
  );
}

function isShelfOrWallItem(value: unknown): value is ShelfDimensions | WallItem {
  if (!isObject(value)) return false;
  if (
    typeof value.id !== 'string' ||
    typeof value.type !== 'string' ||
    typeof value.width !== 'number' ||
    !Number.isFinite(value.width) ||
    typeof value.height !== 'number' ||
    !Number.isFinite(value.height)
  ) {
    return false;
  }

  if (value.type === 'shelf') {
    return typeof value.depth === 'number' && Number.isFinite(value.depth);
  }

  return (
    value.type === 'picture' ||
    value.type === 'poster' ||
    value.type === 'mirror' ||
    value.type === 'tv' ||
    value.type === 'artpiece'
  );
}

function isProjectSettings(value: unknown): value is ProjectSettings {
  return (
    isObject(value) &&
    (value.unit === 'inches' || value.unit === 'cm') &&
    isWallMaterial(value.wallMaterial) &&
    isMountingType(value.mountingType) &&
    isAlignment(value.alignment)
  );
}

function isImportedProjectPayload(
  value: unknown,
): value is Omit<SavedProject, 'id' | 'savedAt'> {
  return (
    isObject(value) &&
    typeof value.name === 'string' &&
    isWallDimensions(value.wall) &&
    Array.isArray(value.shelves) &&
    value.shelves.every(isShelfOrWallItem) &&
    Array.isArray(value.obstructions) &&
    value.obstructions.every(isObstruction) &&
    isProjectSettings(value.settings)
  );
}

export function saveProject(
  name: string,
  wall: WallDimensions,
  shelves: (ShelfDimensions | WallItem)[],
  obstructions: Obstruction[],
  settings: ProjectSettings,
): SavedProject {
  const project: SavedProject = {
    id: generateProjectId(),
    name,
    wall,
    shelves,
    obstructions,
    settings,
    savedAt: new Date().toISOString(),
  };

  const projects = getAllProjects();
  projects.push(project);
  persistProjects(projects);
  persistCurrentProjectId(project.id);

  return project;
}

export function getAllProjects(): SavedProject[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as SavedProject[]) : [];
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
  persistProjects(filtered);

  const currentId = localStorage.getItem(CURRENT_PROJECT_KEY);
  if (currentId === id) {
    localStorage.removeItem(CURRENT_PROJECT_KEY);
  }
}

export function updateProject(
  id: string,
  updates: Partial<Omit<SavedProject, 'id' | 'savedAt'>>,
): SavedProject | null {
  const projects = getAllProjects();
  const index = projects.findIndex((p) => p.id === id);

  if (index === -1) return null;

  projects[index] = {
    ...projects[index],
    ...updates,
    savedAt: new Date().toISOString(),
  };

  persistProjects(projects);
  persistCurrentProjectId(id);
  return projects[index];
}

export function getCurrentProjectId(): string | null {
  return localStorage.getItem(CURRENT_PROJECT_KEY);
}

export function setCurrentProjectId(id: string): void {
  persistCurrentProjectId(id);
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
    const parsed = JSON.parse(jsonString) as unknown;
    if (!isImportedProjectPayload(parsed)) {
      return null;
    }

    const project: SavedProject = {
      ...parsed,
      id: generateProjectId(),
      savedAt: new Date().toISOString(),
    };

    const projects = getAllProjects();
    projects.push(project);
    persistProjects(projects);
    persistCurrentProjectId(project.id);

    return project;
  } catch (error) {
    console.error('Error importing project:', error);
    throw error;
  }
}
