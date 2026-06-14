// src/components/scene/TerrainMesh.tsx
import { useMemo } from 'react';
import * as THREE from 'three';
import useWorldStore from '../../store/worldStore';
import { coordKey, type GridCoord } from '../../types/world';
import { L1_TYPES } from '../../data/terrainTypes';

interface Props {
  gridSize: number;
}

/**
 * Builds a vertex-colored plane mesh from grid data.
 * Each grid cell becomes a quad (2 triangles).
 * Vertex colors are averaged from surrounding cells for smooth transitions.
 */
function buildTerrainMesh(gridSize: number, cells: Record<string, any>) {
  const vertsPerSide = gridSize + 1;
  const totalVerts = vertsPerSide * vertsPerSide;
  const totalFaces = gridSize * gridSize * 2;

  const positions = new Float32Array(totalVerts * 3);
  const colors = new Float32Array(totalVerts * 3);
  const indices = new Uint16Array(totalFaces * 3);
  const uvs = new Float32Array(totalVerts * 2);

  // Generate vertices
  for (let iy = 0; iy < vertsPerSide; iy++) {
    for (let ix = 0; ix < vertsPerSide; ix++) {
      const vi = iy * vertsPerSide + ix;
      positions[vi * 3] = ix;
      positions[vi * 3 + 1] = 0;
      positions[vi * 3 + 2] = iy;
    }
  }

  // Generate indices (2 triangles per cell)
  let fi = 0;
  for (let iy = 0; iy < gridSize; iy++) {
    for (let ix = 0; ix < gridSize; ix++) {
      const a = iy * vertsPerSide + ix;
      const b = iy * vertsPerSide + ix + 1;
      const c = (iy + 1) * vertsPerSide + ix;
      const d = (iy + 1) * vertsPerSide + ix + 1;
      indices[fi * 3] = a; indices[fi * 3 + 1] = c; indices[fi * 3 + 2] = b;
      fi++;
      indices[fi * 3] = b; indices[fi * 3 + 1] = c; indices[fi * 3 + 2] = d;
      fi++;
    }
  }

  // Assign vertex colors — each vertex gets the average color of surrounding cells
  for (let iy = 0; iy < vertsPerSide; iy++) {
    for (let ix = 0; ix < vertsPerSide; ix++) {
      const vi = iy * vertsPerSide + ix;

      // Sample up to 4 surrounding cells
      const neighborCells: GridCoord[] = [];
      for (let dy = -1; dy <= 0; dy++) {
        for (let dx = -1; dx <= 0; dx++) {
          const cx = ix + dx;
          const cy = iy + dy;
          if (cx >= 0 && cx < gridSize && cy >= 0 && cy < gridSize) {
            neighborCells.push({ x: cx, y: cy });
          }
        }
      }

      // Average colors
      let r = 0, g = 0, b = 0, count = 0;
      for (const nc of neighborCells) {
        const key = coordKey(nc);
        const cell = cells[key];
        if (!cell) continue;
        const config = cell.l1 === 'continent' ? L1_TYPES.continent : L1_TYPES.ocean;
        const color = new THREE.Color(config.color);
        r += color.r; g += color.g; b += color.b;
        count++;
      }
      if (count > 0) {
        colors[vi * 3] = r / count;
        colors[vi * 3 + 1] = g / count;
        colors[vi * 3 + 2] = b / count;
      } else {
        colors[vi * 3] = 0.12; colors[vi * 3 + 1] = 0.25; colors[vi * 3 + 2] = 0.5;
      }
    }
  }

  // UVs
  for (let iy = 0; iy < vertsPerSide; iy++) {
    for (let ix = 0; ix < vertsPerSide; ix++) {
      const vi = iy * vertsPerSide + ix;
      uvs[vi * 2] = ix / gridSize;
      uvs[vi * 2 + 1] = iy / gridSize;
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geom.setIndex(new THREE.BufferAttribute(indices, 1));
  geom.computeVertexNormals();

  return geom;
}

export default function TerrainMesh({ gridSize }: Props) {
  const cells = useWorldStore(s => s.world.cells);

  const geometry = useMemo(
    () => buildTerrainMesh(gridSize, cells),
    [gridSize, cells]
  );

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial
        vertexColors
        roughness={0.7}
        metalness={0.1}
      />
    </mesh>
  );
}
