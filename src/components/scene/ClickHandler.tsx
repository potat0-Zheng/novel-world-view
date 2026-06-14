// src/components/scene/ClickHandler.tsx
import { useThree } from '@react-three/fiber';
import { useCallback, useEffect } from 'react';
import * as THREE from 'three';
import useWorldStore from '../../store/worldStore';
import { coordKey } from '../../types/world';

export default function ClickHandler() {
  const { camera, gl } = useThree();
  const gridSize = useWorldStore(s => s.world.config.gridSize);
  const cells = useWorldStore(s => s.world.cells);
  const editorMode = useWorldStore(s => s.editorMode);
  const selectedPaintL1 = useWorldStore(s => s.selectedPaintL1);
  const selectedPaintL2 = useWorldStore(s => s.selectedPaintL2);
  const selectedModelId = useWorldStore(s => s.selectedModelId);
  const setSelectedCellKey = useWorldStore(s => s.setSelectedCellKey);
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

    // Intersect with the ground plane (y=0)
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersect = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersect);

    if (intersect) {
      const gx = Math.floor(intersect.x);
      const gz = Math.floor(intersect.z);
      if (gx >= 0 && gx < gridSize && gz >= 0 && gz < gridSize) {
        const coord = { x: gx, y: gz };
        const key = coordKey(coord);
        const cell = cells[key];

        switch (editorMode) {
          case 'l1_paint':
            setCellL1(coord, selectedPaintL1);
            break;
          case 'l2_paint':
            if (cell && cell.l1 === 'continent') {
              setCellL2(coord, selectedPaintL2);
            }
            break;
          case 'l3_place':
            if (cell && cell.l1 === 'continent' && selectedModelId) {
              setCellModel(coord, selectedModelId);
            }
            break;
          case 'view':
            setSelectedCellKey(coord);
            break;
        }
      }
    }
  }, [
    camera, gl, gridSize, cells,
    editorMode, selectedPaintL1, selectedPaintL2, selectedModelId,
    setSelectedCellKey, setCellL1, setCellL2, setCellModel,
  ]);

  useEffect(() => {
    const el = gl.domElement;
    el.addEventListener('click', handleClick);
    return () => el.removeEventListener('click', handleClick);
  }, [handleClick, gl]);

  return null;
}
