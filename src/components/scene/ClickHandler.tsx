// src/components/scene/ClickHandler.tsx
//
// Click dispatch logic:
//   browse mode  → view only (select cell, show detail panel)
//   edit mode    → L1: direct terrain paint
//                  L2/L3: first click focuses a cell (camera zooms in,
//                         shows 2×2 grid).  Subsequent clicks within the
//                         focused cell paint sub-cells.  Clicking outside
//                         the focused cell unfocuses.

import { useThree } from '@react-three/fiber';
import { useCallback, useEffect } from 'react';
import * as THREE from 'three';
import useWorldStore from '../../store/worldStore';
import { coordKey, SUB_GRID } from '../../types/world';

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

  const handleClick = useCallback((event: MouseEvent) => {
    const rect = gl.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(x, y);
    raycaster.setFromCamera(mouse, camera);

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersect = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersect);

    if (!intersect) return;

    const gx = Math.floor(intersect.x);
    const gz = Math.floor(intersect.z);
    if (gx < 0 || gx >= gridSize || gz < 0 || gz >= gridSize) return;

    const coord = { x: gx, y: gz };
    const key = coordKey(coord);
    const cell = cells[key];

    // ── Browse mode: select cell, show info ──
    if (appMode === 'browse') {
      setSelectedCellKey(key);
      return;
    }

    // ── Edit mode ──
    switch (editorMode) {
      case 'l1_paint':
        // Direct paint — no cell focus needed
        setCellL1(coord, selectedPaintL1);
        break;

      case 'l2_paint': {
        if (!cell || cell.l1 !== 'continent') break;

        // First click: focus the cell
        if (focusedCellKey !== key) {
          setFocusedCellKey(key);
          break;
        }

        // Already focused — paint sub-cell
        const sx = Math.min(SUB_GRID - 1, Math.floor((intersect.x - gx) * SUB_GRID));
        const sy = Math.min(SUB_GRID - 1, Math.floor((intersect.z - gz) * SUB_GRID));
        setCellL2(coord, sx, sy, selectedPaintL2);
        break;
      }

      case 'l3_place': {
        if (!cell || cell.l1 !== 'continent' || !selectedModelId) break;

        // First click: focus the cell
        if (focusedCellKey !== key) {
          setFocusedCellKey(key);
          break;
        }

        // Already focused — place model in sub-cell
        const sx = Math.min(SUB_GRID - 1, Math.floor((intersect.x - gx) * SUB_GRID));
        const sy = Math.min(SUB_GRID - 1, Math.floor((intersect.z - gz) * SUB_GRID));
        setCellModel(coord, sx, sy, selectedModelId);
        break;
      }

      case 'view':
        setSelectedCellKey(key);
        break;
    }
  }, [
    camera, gl, gridSize, cells,
    appMode, editorMode, focusedCellKey,
    selectedPaintL1, selectedPaintL2, selectedModelId,
    setSelectedCellKey, setFocusedCellKey,
    setCellL1, setCellL2, setCellModel,
  ]);

  useEffect(() => {
    const el = gl.domElement;
    el.addEventListener('click', handleClick);
    return () => el.removeEventListener('click', handleClick);
  }, [handleClick, gl]);

  return null;
}
