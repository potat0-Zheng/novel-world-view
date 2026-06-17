// src/components/scene/ClickHandler.tsx
// Pointer-based click + drag discrimination.
// click events fire even after a drag — we suppress selection
// when the pointer has moved more than a 3px threshold.

import { useCallback, useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useWorldStore from '../../store/worldStore';
import { coordKey, SUB_GRID } from '../../types';

export default function ClickHandler() {
  const { camera, gl } = useThree();
  const gridSize = useWorldStore(s => s.world.config.gridSize);
  const cells = useWorldStore(s => s.world.cells);
  const appMode = useWorldStore(s => s.appMode);
  const editorMode = useWorldStore(s => s.editorMode);
  const focusedCellKey = useWorldStore(s => s.focusedCellKey);
  const selectedPaintL1 = useWorldStore(s => s.selectedPaintL1);
  const selectedPaintL2 = useWorldStore(s => s.selectedPaintL2);
  const selectedModelId = useWorldStore(s => s.selectedModelId);
  const setSelectedCellKey = useWorldStore(s => s.setSelectedCellKey);
  const setFocusedCellKey = useWorldStore(s => s.setFocusedCellKey);
  const setCellL1 = useWorldStore(s => s.setCellL1);
  const setCellL2 = useWorldStore(s => s.setCellL2);
  const setCellModel = useWorldStore(s => s.setCellModel);

  // ── Drag discrimination: record pointer-down position so we can
  //     tell a click from a drag (pan). ──
  const pointerDownPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = gl.domElement;
    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos.current = { x: e.clientX, y: e.clientY };
    };
    el.addEventListener('pointerdown', onPointerDown);
    return () => el.removeEventListener('pointerdown', onPointerDown);
  }, [gl]);

  const handleClick = useCallback((event: MouseEvent) => {
    // ── Suppress click if pointer moved more than 3 px (i.e. it was a drag/pan) ──
    const dx = event.clientX - pointerDownPos.current.x;
    const dy = event.clientY - pointerDownPos.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) return;

    const rect = gl.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersect = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersect);
    if (!intersect) { if (appMode === 'browse') setSelectedCellKey(null); return; }
    const gx = Math.floor(intersect.x), gz = Math.floor(intersect.z);
    if (gx < 0 || gx >= gridSize || gz < 0 || gz >= gridSize) { if (appMode === 'browse') setSelectedCellKey(null); return; }
    const key = coordKey({ x: gx, y: gz });
    const cell = cells[key];
    if (appMode === 'browse') { const cur = useWorldStore.getState().selectedCellKey; setSelectedCellKey(key === cur ? null : key); return; }
    switch (editorMode) {
      case 'l1_paint': setCellL1({ x: gx, y: gz }, selectedPaintL1); break;
      case 'l2_paint': { if (!cell || cell.l1 !== 'continent') break; if (focusedCellKey !== key) { setFocusedCellKey(key); break; } const sx = Math.min(SUB_GRID - 1, Math.floor((intersect.x - gx) * SUB_GRID)); const sy = Math.min(SUB_GRID - 1, Math.floor((intersect.z - gz) * SUB_GRID)); setCellL2({ x: gx, y: gz }, sx, sy, selectedPaintL2); break; }
      case 'l3_place': { if (!cell || cell.l1 !== 'continent' || !selectedModelId) break; if (focusedCellKey !== key) { setFocusedCellKey(key); break; } const sx = Math.min(SUB_GRID - 1, Math.floor((intersect.x - gx) * SUB_GRID)); const sy = Math.min(SUB_GRID - 1, Math.floor((intersect.z - gz) * SUB_GRID)); setCellModel({ x: gx, y: gz }, sx, sy, selectedModelId); break; }
      case 'view': { const cur = useWorldStore.getState().selectedCellKey; setSelectedCellKey(key === cur ? null : key); break; }
    }
  }, [camera, gl, gridSize, cells, appMode, editorMode, focusedCellKey, selectedPaintL1, selectedPaintL2, selectedModelId, setSelectedCellKey, setFocusedCellKey, setCellL1, setCellL2, setCellModel]);

  useEffect(() => { const el = gl.domElement; el.addEventListener('click', handleClick); return () => el.removeEventListener('click', handleClick); }, [handleClick, gl]);
  return null;
}
