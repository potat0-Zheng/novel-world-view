// src/store/worldStore.ts
//
// Zustand single-store composed from three slices (slice pattern).
// Slices can access each other via get() — e.g. editor actions read
// world data through get().world.
//
//   worldSlice   — domain data (cells, entities, indices)
//   editorSlice  — editor UI (mode, paint selection, highlight)
//   viewSlice    — camera / view (viewMode, focusMode, flip, appMode)

import { create, type StateCreator } from 'zustand';
import type {
  WorldData, EditorMode, ViewMode, FocusMode, AppMode,
  CoordKey, GridCoord, TerrainL1, TerrainL2, Entity,
} from '../types';
import { coordKey, createDefaultCell, SUB_GRID } from '../types';

// ── helpers ──────────────────────────────────────────────
const GRID_SIZE = 10;

function createEmptyWorld(name: string, gridSize: number): WorldData {
  const cells: WorldData['cells'] = {};
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      cells[coordKey({ x, y })] = createDefaultCell('ocean');
    }
  }
  return {
    config: { name, gridSize },
    cells,
    entities: {},
    locationIndex: {},
    timeIndex: {},
  };
}

// ════════════════════════════════════════════════════════════
//  Slice type definitions
// ════════════════════════════════════════════════════════════

export interface WorldDataSlice {
  world: WorldData;
  isDirty: boolean;
  setupComplete: boolean;

  initWorld: (name?: string) => void;
  loadWorld: (data: WorldData) => void;
  finishSetup: () => void;
  setCellL1: (coord: GridCoord, type: TerrainL1) => void;
  setCellL2: (coord: GridCoord, sx: number, sy: number, type: TerrainL2) => void;
  setCellModel: (coord: GridCoord, sx: number, sy: number, modelId: string | null) => void;
  addEntity: (e: Entity) => void;
}

export interface EditorSlice {
  editorMode: EditorMode;
  focusedCellKey: CoordKey | null;
  selectedPaintL1: TerrainL1;
  selectedPaintL2: TerrainL2;
  selectedModelId: string | null;
  highlightMode: boolean;
  hoveredCellKey: CoordKey | null;

  setEditorMode: (mode: EditorMode) => void;
  setFocusedCellKey: (key: CoordKey | null) => void;
  setSelectedPaintL1: (t: TerrainL1) => void;
  setSelectedPaintL2: (t: TerrainL2) => void;
  setSelectedModelId: (id: string | null) => void;
  setHighlightMode: (on: boolean) => void;
  setHoveredCellKey: (key: CoordKey | null) => void;
}

export interface ViewSlice {
  viewMode: ViewMode;
  focusMode: FocusMode;
  viewFlipped: boolean;
  appMode: AppMode;
  selectedCellKey: CoordKey | null;

  setViewMode: (mode: ViewMode) => void;
  setFocusMode: (mode: FocusMode) => void;
  setViewFlipped: (flipped: boolean) => void;
  setAppMode: (mode: AppMode) => void;
  setSelectedCellKey: (key: CoordKey | null) => void;
}

export type StoreState = WorldDataSlice & EditorSlice & ViewSlice;

// ════════════════════════════════════════════════════════════
//  worldSlice — domain data
// ════════════════════════════════════════════════════════════

const createWorldSlice: StateCreator<StoreState, [], [], WorldDataSlice> = (set, get) => ({
  world: createEmptyWorld('未命名世界', GRID_SIZE),
  isDirty: false,
  setupComplete: false,

  initWorld: (name = '未命名世界') => {
    set({ world: createEmptyWorld(name, GRID_SIZE), isDirty: true });
  },

  loadWorld: (data) => set({ world: data, isDirty: false }),

  finishSetup: () => set({ setupComplete: true }),

  setCellL1: (coord, type) => {
    const key = coordKey(coord);
    const world = { ...get().world };
    const cells = { ...world.cells };
    const cell = cells[key];
    if (!cell) return;

    if (type === 'continent') {
      const l2 = cell.l2.map(t => (t === 'none' ? 'plain' as TerrainL2 : t));
      cells[key] = { ...cell, l1: type, l2 };
    } else {
      cells[key] = createDefaultCell('ocean');
    }
    world.cells = cells;
    set({ world, isDirty: true });
  },

  setCellL2: (coord, sx, sy, type) => {
    const key = coordKey(coord);
    const world = { ...get().world };
    const cell = world.cells[key];
    if (!cell || cell.l1 !== 'continent') return;

    const idx = sx + sy * SUB_GRID;
    if (idx < 0 || idx >= cell.l2.length) return;

    const cells = { ...world.cells };
    const l2 = [...cell.l2];
    l2[idx] = type;
    cells[key] = { ...cell, l2 };
    world.cells = cells;
    set({ world, isDirty: true });
  },

  setCellModel: (coord, sx, sy, modelId) => {
    const key = coordKey(coord);
    const world = { ...get().world };
    const cell = world.cells[key];
    if (!cell || cell.l1 !== 'continent') return;

    const idx = sx + sy * SUB_GRID;
    if (idx < 0 || idx >= cell.l3.length) return;

    const cells = { ...world.cells };
    const l3 = [...cell.l3];
    l3[idx] = modelId;
    cells[key] = { ...cell, l3 };
    world.cells = cells;
    set({ world, isDirty: true });
  },

  addEntity: (e) => {
    const world = { ...get().world };
    world.entities = { ...world.entities, [e.id]: e };
    if (e.locationKey) {
      const idx = { ...world.locationIndex };
      idx[e.locationKey] = [...(idx[e.locationKey] || []), e.id];
      world.locationIndex = idx;
    }
    if (e.timestamp) {
      const dateKey = new Date(e.timestamp).toISOString().slice(0, 10);
      const idx = { ...world.timeIndex };
      idx[dateKey] = [...(idx[dateKey] || []), e.id];
      world.timeIndex = idx;
    }
    set({ world, isDirty: true });
  },
});

// ════════════════════════════════════════════════════════════
//  editorSlice — editor UI state
// ════════════════════════════════════════════════════════════

const createEditorSlice: StateCreator<StoreState, [], [], EditorSlice> = (set) => ({
  editorMode: 'l1_paint',
  focusedCellKey: null,
  selectedPaintL1: 'continent',
  selectedPaintL2: 'plain',
  selectedModelId: null,
  highlightMode: false,
  hoveredCellKey: null,

  setEditorMode: (mode) => set({ editorMode: mode }),
  setFocusedCellKey: (key) => set({ focusedCellKey: key }),
  setSelectedPaintL1: (t) => set({ selectedPaintL1: t }),
  setSelectedPaintL2: (t) => set({ selectedPaintL2: t }),
  setSelectedModelId: (id) => set({ selectedModelId: id }),
  setHighlightMode: (on) => set({ highlightMode: on }),
  setHoveredCellKey: (key) => set({ hoveredCellKey: key }),
});

// ════════════════════════════════════════════════════════════
//  viewSlice — camera / view state
// ════════════════════════════════════════════════════════════

const createViewSlice: StateCreator<StoreState, [], [], ViewSlice> = (set) => ({
  viewMode: '2.5d',
  focusMode: 'overview' as FocusMode,
  viewFlipped: false,
  appMode: 'browse' as AppMode,
  selectedCellKey: null,

  setViewMode: (mode) => set({ viewMode: mode }),
  setFocusMode: (mode) => set({ focusMode: mode }),
  setViewFlipped: (flipped) => set({ viewFlipped: flipped }),
  setAppMode: (mode) => set({ appMode: mode, focusedCellKey: null }),
  setSelectedCellKey: (key) => set({ selectedCellKey: key }),
});

// ════════════════════════════════════════════════════════════
//  Composed store
// ════════════════════════════════════════════════════════════

const useWorldStore = create<StoreState>()((...a) => ({
  ...createWorldSlice(...a),
  ...createEditorSlice(...a),
  ...createViewSlice(...a),
}));

export default useWorldStore;
