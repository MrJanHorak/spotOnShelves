import { beforeEach, describe, expect, test } from 'vitest';
import {
  deleteProject,
  getAllProjects,
  getCurrentProjectId,
  importProjectFromJSON,
  saveProject,
  updateProject,
} from '../storage';
import { ProjectSettings } from '../../types';

class LocalStorageMock implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

const settings: ProjectSettings = {
  unit: 'inches',
  wallMaterial: 'drywall',
  mountingType: 'floating',
  alignment: 'center',
};

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: new LocalStorageMock(),
    configurable: true,
  });
});

describe('storage project flows', () => {
  test('save and update keep a single project record', () => {
    const saved = saveProject(
      'Test',
      { width: 96, height: 96 },
      [{ id: 's1', type: 'shelf', width: 36, height: 1, depth: 8 }],
      [],
      settings,
    );

    const updated = updateProject(saved.id, { name: 'Renamed' });
    expect(updated?.name).toBe('Renamed');

    const projects = getAllProjects();
    expect(projects).toHaveLength(1);
    expect(projects[0].id).toBe(saved.id);
  });

  test('delete clears current project pointer when deleting active project', () => {
    const saved = saveProject(
      'Delete me',
      { width: 96, height: 96 },
      [{ id: 's1', type: 'shelf', width: 36, height: 1, depth: 8 }],
      [],
      settings,
    );

    expect(getCurrentProjectId()).toBe(saved.id);
    deleteProject(saved.id);
    expect(getCurrentProjectId()).toBeNull();
    expect(getAllProjects()).toHaveLength(0);
  });

  test('import validates payload and rejects malformed JSON payloads', () => {
    const invalid = importProjectFromJSON(
      JSON.stringify({
        name: 'bad',
        wall: { width: -1, height: 10 },
      }),
    );
    expect(invalid).toBeNull();
  });
});
