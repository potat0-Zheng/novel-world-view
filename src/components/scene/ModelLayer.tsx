// src/components/scene/ModelLayer.tsx
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import useWorldStore from '../../store/worldStore';
import { coordKey, SUB_GRID } from '../../types';
import { getModelById } from '../../data/modelLibrary';
import type { ModelCategory } from '../../types';

// ── 2D mode fallback icons per category ────────────────────
const CATEGORY_ICON: Record<ModelCategory, string> = {
  castle:     '🏰',
  settlement: '🏘️',
  temple:     '🛕',
  tower:      '🗼',
  structure:  '🌉',
  landmark:   '🌳',
};

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

  // Cross-fade opacity based on view mode (3D models only)
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

  const is2D = viewMode === '2d';

  return (
    <group ref={groupRef}>
      {models.map(m => {
        const def = getModelById(m.modelId);
        if (!def) return null;
        const isSelected = selectedKey != null && m.key.startsWith(selectedKey);

        return (
          <group key={m.key}>
            {/* ═══ 3D model (2.5D mode) ═══ */}
            <mesh position={[m.x, def.size[1] / 2, m.z]} castShadow>
              <boxGeometry args={def.size} />
              <meshStandardMaterial
                color={def.color}
                roughness={0.6}
                metalness={0.1}
                transparent
                opacity={1}
              />
            </mesh>

            {/* ═══ Selection ring (2.5D only) ═══ */}
            {isSelected && !is2D && (
              <mesh position={[m.x, 0.02, m.z]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.35, 0.5, 16]} />
                <meshBasicMaterial color="#ffd700" transparent opacity={0.8} />
              </mesh>
            )}

            {/* ═══ 2D fallback: icon + label ═══ */}
            {is2D && (
              <Html
                position={[m.x, 0.02, m.z]}
                center
                style={{ pointerEvents: 'none' }}
              >
                <div style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 2,
                  filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.8))',
                }}>
                  <span style={{ fontSize: 20 }}>{CATEGORY_ICON[def.category]}</span>
                  <span style={{
                    fontSize: 9, color: isSelected ? '#ffd700' : '#ccc',
                    background: 'rgba(10,10,26,0.85)', borderRadius: 4,
                    padding: '1px 5px', whiteSpace: 'nowrap',
                    border: isSelected ? '1px solid #ffd700' : '1px solid #333',
                  }}>
                    {def.name}
                  </span>
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}
