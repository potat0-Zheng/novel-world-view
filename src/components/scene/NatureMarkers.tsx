// src/components/scene/NatureMarkers.tsx
import { useMemo } from 'react';
import useWorldStore from '../../store/worldStore';
import { coordKey } from '../../types/world';

export default function NatureMarkers() {
  const world = useWorldStore(s => s.world);
  const gridSize = world.config.gridSize;

  const markers = useMemo(() => {
    const items: { key: string; x: number; z: number; type: string }[] = [];
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        const key = coordKey({ x, y });
        const cell = world.cells[key];
        if (!cell || cell.l1 !== 'continent') continue;
        if (cell.l2 !== 'none' && cell.l2 !== 'plain') {
          items.push({ key, x: x + 0.5, z: y + 0.5, type: cell.l2 });
        }
      }
    }
    return items;
  }, [world.cells, gridSize]);

  return (
    <group>
      {markers.map(m => (
        <group key={m.key} position={[m.x, 0, m.z]}>
          {m.type === 'mountain' && (
            <mesh position={[0, 0.3, 0]}>
              <coneGeometry args={[0.4, 0.6, 4]} />
              <meshStandardMaterial color="#6a7a5a" roughness={0.8} />
            </mesh>
          )}
          {m.type === 'forest' && (
            <>
              {[0, 1, 2].map(i => (
                <mesh key={i} position={[
                  Math.cos(i * 2.09) * 0.15,
                  0.2,
                  Math.sin(i * 2.09) * 0.15
                ]}>
                  <sphereGeometry args={[0.15, 6, 6]} />
                  <meshStandardMaterial color="#2d6b20" roughness={0.9} />
                </mesh>
              ))}
            </>
          )}
        </group>
      ))}
    </group>
  );
}
