// src/services/storage.ts
//
// Storage abstraction so the UI layer never touches localStorage directly.
//   - Phase 1: LocalStorageAdapter (immediate, no migration cost)
//   - Phase 2: IndexedDBAdapter   (drop-in swap, UI unchanged)
//
// Usage:
//   import { worldStorage } from '../services/storage';
//   await worldStorage.save(worldData);
//   const data = await worldStorage.load();

import type { WorldData } from '../types';

// ── Interface ──────────────────────────────────────────────

export interface WorldStorage {
  save(data: WorldData): Promise<void>;
  load(): Promise<WorldData | null>;
}

// ── LocalStorage adapter ───────────────────────────────────

const KEY = 'novel-world-save';

class LocalStorageAdapter implements WorldStorage {
  async save(data: WorldData): Promise<void> {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (err) {
      console.error('LocalStorage save failed:', err);
      throw err;
    }
  }

  async load(): Promise<WorldData | null> {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return JSON.parse(raw) as WorldData;
    } catch (err) {
      console.error('LocalStorage load failed:', err);
      return null;
    }
  }
}

// ── Singleton ───────────────────────────────────────────────

export const worldStorage: WorldStorage = new LocalStorageAdapter();
