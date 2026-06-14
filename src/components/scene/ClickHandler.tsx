// src/components/scene/ClickHandler.tsx
import { useThree } from '@react-three/fiber';
import { useCallback, useEffect } from 'react';
import * as THREE from 'three';
import useWorldStore from '../../store/worldStore';
import { coordKey } from '../../types/world';

export default function ClickHandler() {
  const { camera, gl } = useThree();
  const setSelectedCellKey = useWorldStore(s => s.setSelectedCellKey);
  const gridSize = useWorldStore(s => s.world.config.gridSize);

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
        setSelectedCellKey(coordKey({ x: gx, y: gz }));
      }
    }
  }, [camera, gl, gridSize, setSelectedCellKey]);

  useEffect(() => {
    const el = gl.domElement;
    el.addEventListener('click', handleClick);
    return () => el.removeEventListener('click', handleClick);
  }, [handleClick, gl]);

  return null;
}
