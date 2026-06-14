// src/components/scene/ModelLayer.tsx
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useWorldStore from '../../store/worldStore';
import { coordKey, SUB_GRID } from '../../types/world';
import { getModelById } from '../../data/modelLibrary';

export default function ModelLayer() {
  const world = useWorldStore(s => s.world);
  const gridSize = world.config.gridSize;
  const selectedKey = useWorldStore(s => s.selectedCellKey);
  const viewMode = useWorldStore(s => s.viewMode);
  const groupRef = useRef<THREE.Group>(null!);

  const models = useMemo(() => {
    const items: { key: string; x: number; z: number; modelId: string }[] = [];
    const cellSize = 1 / SUB_GRID;
    const halfCell = cellSize / 2;

    for (let cx = 0; cx < gridSize; cx++) {
      for (let cy = 0; cy < gridSize; cy++) {
        const cellKey = coordKey({ x: cx, y: cy });
        const cell = world.cells[cellKey];
        if (!cell || cell.l1 !== 'continent') continue;

        for (let sx = 0; sx < SUB_GRID; sx++) {
          for (let sy = 0; sy < SUB_GRID; sy++) {
            const modelId = cell.l3[sx + sy * SUB_GRID];
            if (!modelId) continue;

            items.push({
              key: `${cellKey}-${sx}-${sy}`,
              x: cx + sx * cellSize + halfCell,
              z: cy + sy * cellSize + halfCell,
              modelId,
            });
          }
        }
      }
    }
    return items;
  }, [world.cells, gridSize]);

  // Cross-fade opacity based on view mode
  const opacityTarget = viewMode === '2.5d' ? 1 : 0;
  const opacityRef = useRef(opacityTarget);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    opacityRef.current += (opacityTarget - opacityRef.current) * Math.min(delta * 4, 1);
    groupRef.current.traverse(child => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshStandardMaterial;
        mat.transparent = true;
        mat.opacity = opacityRef.current;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {models.map(m => {
        const def = getModelById(m.modelId);
        if (!def) return null;
        const isSelected = selectedKey != null && m.key.startsWith(selectedKey);
        return (
          <group key={m.key}>
            {/* Colored box placeholder — replace with GLTF when available */}
            <mesh
              position={[m.x, def.size[1] / 2, m.z]}
              castShadow
            >
              <boxGeometry args={def.size} />
              <meshStandardMaterial
                color={def.color}
                roughness={0.6}
                metalness={0.1}
                transparent
                opacity={1}
              />
            </mesh>
            {/* Selection highlight ring */}
            {isSelected && (
              <mesh position={[m.x, 0.02, m.z]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.35, 0.5, 16]} />
                <meshBasicMaterial color="#ffd700" transparent opacity={0.8} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}
