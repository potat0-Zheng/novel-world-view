// src/components/scene/TerrainMesh.tsx
import { useMemo } from 'react';
import useWorldStore from '../../store/worldStore';
import { coordKey } from '../../types/world';

interface Props {
  gridSize: number;
}

export default function TerrainMesh({ gridSize }: Props) {
  const cells = useWorldStore(s => s.world.cells);

  const { continentCells } = useMemo(() => {
    const continentCells: { key: string; x: number; y: number }[] = [];
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        const key = coordKey({ x, y });
        const cell = cells[key];
        if (cell && cell.l1 === 'continent') {
          continentCells.push({ key, x, y });
        }
      }
    }
    return { continentCells };
  }, [cells, gridSize]);

  return (
    <group>
      {/* Ocean base plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[gridSize / 2, -0.01, gridSize / 2]}
        receiveShadow
      >
        <planeGeometry args={[gridSize, gridSize]} />
        <meshStandardMaterial color="#1a3a6e" roughness={0.8} />
      </mesh>

      {/* Continent blocks */}
      {continentCells.map(({ key, x, y }) => (
        <mesh
          key={key}
          position={[x + 0.5, 0.15, y + 0.5]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.96, 0.3, 0.96]} />
          <meshStandardMaterial
            color="#c8c0b0"
            roughness={0.6}
            metalness={0.05}
          />
        </mesh>
      ))}
    </group>
  );
}
