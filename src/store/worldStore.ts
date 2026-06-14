// src/store/worldStore.ts
import { create } from 'zustand';
import type {
  WorldData, WorldState, EditorMode, ViewMode,
  CoordKey, GridCoord, TerrainL1, TerrainL2, Entity,
} from '../types/world';
import { coordKey } from '../types/world';

function createEmptyWorld(name: string, gridSize: number): WorldData {
  const cells: WorldData['cells'] = {};
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      const key = coordKey({ x, y });
      cells[key] = { l1: 'ocean', l2: 'none', l3ModelId: null };
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

const GRID_SIZE = 10;

const useWorldStore = create<WorldState & {
  initWorld: (name?: string) => void;
  setCellL1: (coord: GridCoord, type: TerrainL1) => void;
  setCellL2: (coord: GridCoord, type: TerrainL2) => void;
  setCellModel: (coord: GridCoord, modelId: string | null) => void;
  setEditorMode: (mode: EditorMode) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedPaintL1: (t: TerrainL1) => void;
  setSelectedPaintL2: (t: TerrainL2) => void;
  setSelectedModelId: (id: string | null) => void;
  setSelectedCellKey: (key: CoordKey | null) => void;
  finishSetup: () => void;
  loadWorld: (data: WorldData) => void;
  addEntity: (e: Entity) => void;
}>((set, get) => ({
  world: createEmptyWorld('未命名世界', GRID_SIZE),
  editorMode: 'l1_paint',
  viewMode: '2.5d',
  selectedPaintL1: 'continent',
  selectedPaintL2: 'plain',
  selectedModelId: null,
  selectedCellKey: null,
  isDirty: false,
  setupComplete: false,

  initWorld: (name = '未命名世界') => {
    set({ world: createEmptyWorld(name, GRID_SIZE), isDirty: true });
  },

  setCellL1: (coord, type) => {
    const key = coordKey(coord);
    const world = { ...get().world };
    const cells = { ...world.cells };
    cells[key] = { ...cells[key], l1: type };
    // When painting continent, default L2 to plain
    if (type === 'continent' && cells[key].l2 === 'none') {
      cells[key].l2 = 'plain';
    }
    // When painting ocean, clear L2 and L3
    if (type === 'ocean') {
      cells[key].l2 = 'none';
      cells[key].l3ModelId = null;
    }
    world.cells = cells;
    set({ world, isDirty: true });
  },

  setCellL2: (coord, type) => {
    const key = coordKey(coord);
    const world = { ...get().world };
    if (world.cells[key].l1 !== 'continent') return; // only on continent
    const cells = { ...world.cells };
    cells[key] = { ...cells[key], l2: type };
    world.cells = cells;
    set({ world, isDirty: true });
  },

  setCellModel: (coord, modelId) => {
    const key = coordKey(coord);
    const world = { ...get().world };
    const cells = { ...world.cells };
    cells[key] = { ...cells[key], l3ModelId: modelId };
    world.cells = cells;
    set({ world, isDirty: true });
  },

  setEditorMode: (mode) => set({ editorMode: mode }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedPaintL1: (t) => set({ selectedPaintL1: t }),
  setSelectedPaintL2: (t) => set({ selectedPaintL2: t }),
  setSelectedModelId: (id) => set({ selectedModelId: id }),
  setSelectedCellKey: (key) => set({ selectedCellKey: key }),

  finishSetup: () => set({ setupComplete: true }),

  loadWorld: (data) => set({ world: data, isDirty: false }),

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
}));

export default useWorldStore;
