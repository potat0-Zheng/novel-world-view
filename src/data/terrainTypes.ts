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
  ocean:     { id: 'ocean',     name: '海洋', color: '#1e4080', elevation: -1, walkable: false },
  continent: { id: 'continent', name: '大陆', color: '#5a8c4f', elevation:  0, walkable: true  },
};

export const L2_TYPES: Record<string, TerrainConfig> = {
  plain:    { id: 'plain',    name: '平原', color: '#5a8c4f', elevation: 0, walkable: true  },
  mountain: { id: 'mountain', name: '山脉', color: '#6a7a5a', elevation: 2, walkable: false },
  forest:   { id: 'forest',   name: '森林', color: '#2d6020', elevation: 0, walkable: true  },
};
// For future: add desert, tundra, volcano, swamp, hills — just one more entry each.
