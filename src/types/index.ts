// src/types/index.ts — barrel re-export
// All public types flow through here.  Internal consumers import from 'types'.
// Phase 2 domain files (character.ts / event.ts / faction.ts) will be added
// beside world.ts and re-exported from this same barrel.

export type {
  CoordKey, GridCoord,
  TerrainL1, TerrainL2,
  ModelCategory, ModelDef,
  CellData,
  Entity, EntityType,
  WorldConfig, WorldData, WorldState,
  EditorMode, ViewMode, FocusMode, AppMode,
} from './world';

export {
  coordKey, parseCoordKey,
  TERRAIN_L1_OPTIONS, TERRAIN_L2_OPTIONS,
  SUB_GRID, SUB_COUNT,
  subIndex, createDefaultCell,
} from './world';
