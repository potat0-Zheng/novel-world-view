// src/components/scene/CellHighlight.tsx
//
// Highlight mode for browse view:
//   ▸ Grid lines — always visible when highlightMode is on, rendered
//     on top of all 3D content (depthTest:false + high renderOrder).
//   ▸ Hover highlight — cell under cursor glows.
//   ▸ Selected cell — edge glow (preserved from original behaviour).
//
// Colours: lines #b8860b (dark gold), hover #ffd700 25 %, selected #ffaa00.

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useWorldStore from '../../store/worldStore';
import { coordKey, parseCoordKey } from '../../types';

// ── constants ──────────────────────────────────────────────
const LINE_COLOR     = '#b8860b'; // dark goldenrod
const HOVER_COLOR    = '#ffd700';
const HOVER_OPACITY  = 0.25;
const SELECTED_COLOR = '#ffaa00';
const GRID_Y         = 0.03; // slightly above terrain
const HOVER_Y        = 0.04;
const LINE_H         = 0.008;
const LINE_W         = 0.025;
const RENDER_ORDER   = 999; // on top of everything

const OFF = -9999; // off-screen sentinel for inactive state

// ── grid-line geometry pool ─────────────────────────────────
function createGridLines(gridSize: number) {
  const lines: { pos: [number, number, number]; size: [number, number, number] }[] = [];
  const half = gridSize / 2;
  // X‑direction lines (run along X at each Z boundary)
  for (let z = 0; z <= gridSize; z++) {
    lines.push({ pos: [half, GRID_Y, z], size: [gridSize, LINE_H, LINE_W] });
  }
  // Z‑direction lines (run along Z at each X boundary)
  for (let x = 0; x <= gridSize; x++) {
    lines.push({ pos: [x, GRID_Y, half], size: [LINE_W, LINE_H, gridSize] });
  }
  return lines;
}

// ── component ───────────────────────────────────────────────
export default function CellHighlight() {
  const { camera, gl } = useThree();

  const gridSize       = useWorldStore(s => s.world.config.gridSize);
  const highlightMode  = useWorldStore(s => s.highlightMode);
  const selectedCellKey = useWorldStore(s => s.selectedCellKey);
  const cells          = useWorldStore(s => s.world.cells);
  const setHoveredCellKey = useWorldStore(s => s.setHoveredCellKey);

  // hover state — local ref to avoid per-frame store writes
  const hoveredRef     = useRef<string | null>(null);
  const hoverTarget    = useRef(new THREE.Vector3(OFF, HOVER_Y, OFF));
  const hoverMeshRef   = useRef<THREE.Mesh>(null);

  // ── grid lines (static, only rendered when highlightMode is on) ──
  const gridLines = useMemo(() => createGridLines(gridSize), [gridSize]);

  // ── selected-cell outline (original behaviour) ──
  const selCoord = selectedCellKey ? parseCoordKey(selectedCellKey) : null;
  const selX = selCoord ? selCoord.x + 0.5 : OFF;
  const selZ = selCoord ? selCoord.y + 0.5 : OFF;
  const selCell = selectedCellKey ? cells[selectedCellKey] : undefined;
  const selY = selectedCellKey ? ((selCell && selCell.l1 === 'continent') ? 0.33 : 0.02) : OFF;

  // ── hover detection via pointermove ──
  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!highlightMode) {
      if (hoveredRef.current !== null) {
        setHoveredCellKey(null);
        hoveredRef.current = null;
        hoverTarget.current.x = OFF;
        hoverTarget.current.z = OFF;
      }
      return;
    }
    const rect = gl.domElement.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    const rc = new THREE.Raycaster();
    rc.setFromCamera(new THREE.Vector2(nx, ny), camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const pt = new THREE.Vector3();
    rc.ray.intersectPlane(plane, pt);
    const gx = Math.floor(pt.x);
    const gz = Math.floor(pt.z);
    if (gx < 0 || gx >= gridSize || gz < 0 || gz >= gridSize) {
      if (hoveredRef.current !== null) {
        setHoveredCellKey(null);
        hoveredRef.current = null;
        hoverTarget.current.x = OFF;
        hoverTarget.current.z = OFF;
      }
      return;
    }
    const key = coordKey({ x: gx, y: gz });
    if (key !== hoveredRef.current) {
      setHoveredCellKey(key);
      hoveredRef.current = key;
      hoverTarget.current.set(gx + 0.5, HOVER_Y, gz + 0.5);
    }
  }, [highlightMode, camera, gl, gridSize, setHoveredCellKey]);

  useEffect(() => {
    const el = gl.domElement;
    el.addEventListener('pointermove', handlePointerMove);
    return () => el.removeEventListener('pointermove', handlePointerMove);
  }, [handlePointerMove, gl]);

  // ── per‑frame: smooth hover fade + position update (bypass React render) ──
  const hoverOpacity = useRef(0);
  useFrame((_, delta) => {
    const mesh = hoverMeshRef.current;
    if (!mesh) return;

    // position — follow the pointer without waiting for a React render
    mesh.position.copy(hoverTarget.current);

    // opacity — smooth fade in/out
    const target = hoveredRef.current !== null ? HOVER_OPACITY : 0;
    const speed = 8;
    hoverOpacity.current += (target - hoverOpacity.current) * Math.min(delta * speed, 1);
    (mesh.material as THREE.MeshBasicMaterial).opacity = hoverOpacity.current;
  });

  // ── render ────────────────────────────────────────────
  const showGrid = highlightMode && gridLines.length > 0;

  return (
    <>
      {/* ═══ Grid lines ═══ */}
      {showGrid && gridLines.map((l, i) => (
        <mesh key={`gl-${i}`} position={l.pos} renderOrder={RENDER_ORDER}>
          <boxGeometry args={l.size} />
          <meshBasicMaterial color={LINE_COLOR} transparent opacity={0.55} depthTest={false} />
        </mesh>
      ))}

      {/* ═══ Hover highlight ═══ */}
      {highlightMode && (
        <mesh
          ref={hoverMeshRef}
          position={[OFF, HOVER_Y, OFF]}
          renderOrder={RENDER_ORDER}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            color={HOVER_COLOR}
            transparent
            opacity={0}
            depthTest={false}
          />
        </mesh>
      )}

      {/* ═══ Selected‑cell edge glow (original) ═══ */}
      <group position={[selX, selY, selZ]}>
        {/* glow outer */}
        <EdgeGlow offset={0.52} color="#ffd700" opacity={0.25} />
        {/* crisp inner */}
        <EdgeGlow offset={0.5} color={SELECTED_COLOR} opacity={0.8} />
      </group>
    </>
  );
}

// ── edge‑glow helper ────────────────────────────────────────
const EDGES = [
  { p: [0, 0, -0.5] as const, s: [1.04, 0.04, 0.08] as const },
  { p: [0, 0, 0.5] as const, s: [1.04, 0.04, 0.08] as const },
  { p: [-0.5, 0, 0] as const, s: [0.08, 0.04, 1.04] as const },
  { p: [0.5, 0, 0] as const, s: [0.08, 0.04, 1.04] as const },
] as const;

function EdgeGlow({ offset, color, opacity }: { offset: number; color: string; opacity: number }) {
  return (
    <>
      {EDGES.map((e, i) => (
        <mesh key={i} position={[e.p[0] * (offset * 2), e.p[1], e.p[2] * (offset * 2)]}>
          <boxGeometry args={[...e.s]} />
          <meshBasicMaterial color={color} transparent opacity={opacity} />
        </mesh>
      ))}
    </>
  );
}
