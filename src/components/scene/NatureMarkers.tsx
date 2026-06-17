// src/components/scene/NatureMarkers.tsx
import { useMemo } from 'react';
import useWorldStore from '../../store/worldStore';
import { coordKey, SUB_GRID } from '../../types';

export default function NatureMarkers() {
  const world = useWorldStore(s => s.world);
  const gridSize = world.config.gridSize;
  const selectedCellKey = useWorldStore(s => s.selectedCellKey);

  const markers = useMemo(() => {
    const items: { key: string; x: number; z: number; type: string; parent: string }[] = [];
    const cs = 1 / SUB_GRID, hc = cs / 2;
    for (let cx = 0; cx < gridSize; cx++) for (let cy = 0; cy < gridSize; cy++) {
      const key = coordKey({ x: cx, y: cy }); const cell = world.cells[key];
      if (!cell || cell.l1 !== 'continent') continue;
      for (let sx = 0; sx < SUB_GRID; sx++) for (let sy = 0; sy < SUB_GRID; sy++) {
        const l2 = cell.l2[sx + sy * SUB_GRID];
        if (!l2 || l2 === 'none' || l2 === 'plain') continue;
        items.push({ key: `${key}-${sx}-${sy}`, x: cx + sx * cs + hc, z: cy + sy * cs + hc, type: l2, parent: key });
      }
    }
    return items;
  }, [world.cells, gridSize]);

  return (
    <group>
      {markers.map(m => {
        const sel = selectedCellKey === m.parent;
        return (
          <group key={m.key} position={[m.x, 0, m.z]}>
            {m.type === 'mountain' && (
              <mesh position={[0, 0.18, 0]}>
                <coneGeometry args={[0.22, 0.36, 4]} />
                <meshStandardMaterial color={sel ? '#8a9a7a' : '#6a7a5a'} roughness={0.8} emissive={sel ? '#1a2a0a' : '#000000'} emissiveIntensity={sel ? 0.3 : 0} />
              </mesh>
            )}
            {m.type === 'forest' && [0, 1, 2].map(i => (
              <mesh key={i} position={[Math.cos(i * 2.09) * 0.08, 0.12, Math.sin(i * 2.09) * 0.08]}>
                <sphereGeometry args={[0.08, 6, 6]} />
                <meshStandardMaterial color={sel ? '#4d8b30' : '#2d6b20'} roughness={0.9} emissive={sel ? '#0a1a00' : '#000000'} emissiveIntensity={sel ? 0.3 : 0} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}
