// src/components/scene/FocusedCellGrid.tsx
//
// Renders a golden 2×2 subdivision grid above the currently focused
// cell (edit mode only).  The grid sits just above the terrain block.

import { useMemo } from 'react';
import useWorldStore from '../../store/worldStore';
import { parseCoordKey, SUB_GRID } from '../../types/world';

export default function FocusedCellGrid() {
  const focusedCellKey = useWorldStore(s => s.focusedCellKey);
  const appMode = useWorldStore(s => s.appMode);

  const lines = useMemo(() => {
    if (appMode !== 'edit' || !focusedCellKey) return null;

    const { x, y } = parseCoordKey(focusedCellKey);
    const Y = 0.32; // just above the terrain block (y=0.15 + 0.3/2 = 0.3)
    const cellSize = 1 / SUB_GRID; // 0.5

    // Two internal dividing lines (horizontal & vertical at midpoints)
    const pts: [number, number, number][][] = [];
    for (let i = 1; i < SUB_GRID; i++) {
      const offset = i * cellSize;
      // horizontal
      pts.push([[x, Y, y + offset], [x + 1, Y, y + offset]]);
      // vertical
      pts.push([[x + offset, Y, y], [x + offset, Y, y + 1]]);
    }
    return { pts, x, y };
  }, [focusedCellKey, appMode]);

  if (!lines) return null;

  return (
    <group>
      {lines.pts.map(([a, b], i) => {
        const midX = (a[0] + b[0]) / 2;
        const midZ = (a[2] + b[2]) / 2;
        const dx = b[0] - a[0];
        const dz = b[2] - a[2];
        const len = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dx, dz);
        return (
          <mesh
            key={i}
            position={[midX, a[1], midZ]}
            rotation={[0, angle, 0]}
          >
            <boxGeometry args={[len, 0.015, 0.015]} />
            <meshBasicMaterial color="#ffd700" />
          </mesh>
        );
      })}
    </group>
  );
}
