// src/types/world.ts

// === Grid ===
export type CoordKey = string; // `${x}-${y}`
export interface GridCoord { x: number; y: number; }
export function coordKey(c: GridCoord): CoordKey { return `${c.x}-${c.y}`; }
export function parseCoordKey(k: CoordKey): GridCoord {
  const [x, y] = k.split('-').map(Number);
  return { x, y };
}

// === Terrain L1 (基础地形) ===
export type TerrainL1 = 'ocean' | 'continent';
export const TERRAIN_L1_OPTIONS: TerrainL1[] = ['ocean', 'continent'];

// === Terrain L2 (自然地形) ===
export type TerrainL2 = 'plain' | 'mountain' | 'forest' | 'none';
export const TERRAIN_L2_OPTIONS: TerrainL2[] = ['plain', 'mountain', 'forest'];

// === L3 Model ===
export type ModelCategory = 'castle' | 'settlement' | 'temple' | 'tower' | 'structure' | 'landmark';

export interface ModelDef {
  id: string;
  name: string;
  category: ModelCategory;
  color: string; // placeholder color for box geometry before real GLTF
  size: [number, number, number]; // [w, h, d]
}

// === Sub-grid ===
export const SUB_GRID = 2; // each cell subdivides into SUB_GRID × SUB_GRID for L2/L3
export const SUB_COUNT = SUB_GRID * SUB_GRID;
export function subIndex(sx: number, sy: number): number { return sx + sy * SUB_GRID; }

function makeSubL2(): TerrainL2[] { return Array(SUB_COUNT).fill('none' as TerrainL2); }
function makeSubL3(): (string | null)[] { return Array(SUB_COUNT).fill(null); }

// === Cell ===
export interface CellData {
  l1: TerrainL1;
  l2: TerrainL2[];        // [SUB_COUNT] row-major, one per sub-cell
  l3: (string | null)[];  // [SUB_COUNT] row-major, modelId or null
}

export function createDefaultCell(l1: TerrainL1 = 'ocean'): CellData {
  return { l1, l2: makeSubL2(), l3: makeSubL3() };
}

// === Entity (用于后续子系统的数据关联锚点) ===
export type EntityType = 'character' | 'event' | 'faction';
export interface Entity {
  id: string;
  type: EntityType;
  name: string;
  description: string;
  locationKey: CoordKey | null;
  timestamp: number | null;
}

// === World Config ===
export interface WorldConfig {
  name: string;
  gridSize: number; // N×N
}

// === WorldData — 单一数据源 ===
export interface WorldData {
  config: WorldConfig;
  cells: Record<CoordKey, CellData>;
  entities: Record<string, Entity>;
  locationIndex: Record<CoordKey, string[]>;   // location → entity ids
  timeIndex: Record<string, string[]>;          // ISO date → entity ids
}

// === Editor state ===
export type EditorMode = 'l1_paint' | 'l2_paint' | 'l3_place' | 'view';
export type ViewMode = '2.5d' | '2d';
export type FocusMode = 'overview' | 'focus';
export type AppMode = 'browse' | 'edit';

export interface WorldState {
  world: WorldData;
  appMode: AppMode;
  editorMode: EditorMode;
  viewMode: ViewMode;
  focusMode: FocusMode;
  viewFlipped: boolean;
  selectedPaintL1: TerrainL1;
  selectedPaintL2: TerrainL2;
  selectedModelId: string | null;
  selectedCellKey: CoordKey | null;
  focusedCellKey: CoordKey | null;   // cell being edited (shows 2×2 grid, camera zooms in)
  isDirty: boolean;
  setupComplete: boolean;
  highlightMode: boolean;
  hoveredCellKey: CoordKey | null;
}
