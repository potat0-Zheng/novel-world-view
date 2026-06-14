// src/data/terrainTypes.ts
// Each terrain type is a config object — add new types by adding one entry.

export interface TerrainConfig {
  id: string;
  name: string;
  color: string;
  elevation: number;
  walkable: boolean;
}

export const L1_TYPES: Record<string, TerrainConfig> = {
  ocean:     { id: 'ocean',     name: '海洋', color: '#1a3a6e', elevation: -1, walkable: false },
  continent: { id: 'continent', name: '大陆', color: '#c8c0b0', elevation:  0, walkable: true  },
};

export const L2_TYPES: Record<string, TerrainConfig> = {
  plain:    { id: 'plain',    name: '平原', color: '#c8c0b0', elevation: 0, walkable: true  },
  mountain: { id: 'mountain', name: '山脉', color: '#8a8a80', elevation: 2, walkable: false },
  forest:   { id: 'forest',   name: '森林', color: '#7a9a6a', elevation: 0, walkable: true  },
};
// For future: add desert, tundra, volcano, swamp, hills — just one more entry each.
