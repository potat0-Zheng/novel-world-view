// src/components/scene/TerrainMesh.tsx
import { useMemo } from 'react';
import useWorldStore from '../../store/worldStore';
import { coordKey } from '../../types';

interface Props { gridSize: number; }

export default function TerrainMesh({ gridSize }: Props) {
  const cells = useWorldStore(s => s.world.cells);
  const selectedCellKey = useWorldStore(s => s.selectedCellKey);

  const continentCells = useMemo(() => {
    const list: { key: string; x: number; y: number }[] = [];
    for (let x = 0; x < gridSize; x++) for (let y = 0; y < gridSize; y++) {
      const key = coordKey({ x, y }); const cell = cells[key];
      if (cell && cell.l1 === 'continent') list.push({ key, x, y });
    }
    return list;
  }, [cells, gridSize]);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[gridSize / 2, -0.01, gridSize / 2]} receiveShadow>
        <planeGeometry args={[gridSize, gridSize]} />
        <meshStandardMaterial color="#1a3a6e" roughness={0.8} />
      </mesh>
      {continentCells.map(({ key, x, y }) => {
        const sel = key === selectedCellKey;
        return (
          <mesh key={key} position={[x + 0.5, 0.15, y + 0.5]} castShadow receiveShadow>
            <boxGeometry args={[0.96, 0.3, 0.96]} />
            <meshStandardMaterial color={sel ? '#e8d8a0' : '#c8c0b0'} roughness={0.6} metalness={sel ? 0.2 : 0.05} emissive={sel ? '#4a3a10' : '#000000'} emissiveIntensity={sel ? 0.3 : 0} />
          </mesh>
        );
      })}
    </group>
  );
}
