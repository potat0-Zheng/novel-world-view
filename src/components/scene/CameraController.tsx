// src/components/scene/CameraController.tsx
import { useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useWorldStore from '../../store/worldStore';

const TILT_2_5D = Math.PI / 3;   // ~60°
const TILT_2D = 0;
const DISTANCE = 14;
const SWITCH_DURATION = 0.8;

export default function CameraController() {
  const camera = useThree(s => s.camera) as THREE.PerspectiveCamera;
  const viewMode = useWorldStore(s => s.viewMode);
  const currentTilt = useRef(TILT_2_5D);

  // Set initial camera position immediately (before first frame)
  if (camera && !(camera as any).__initialized) {
    const gridSize = 10;
    const tilt = TILT_2_5D;
    camera.position.set(
      gridSize / 2 + DISTANCE * Math.sin(tilt) * 0.5,
      DISTANCE * Math.cos(tilt),
      gridSize / 2 + DISTANCE * Math.sin(tilt) * 0.5,
    );
    camera.lookAt(gridSize / 2, 0, gridSize / 2);
    (camera as any).__initialized = true;
  }

  const targetTilt = viewMode === '2.5d' ? TILT_2_5D : TILT_2D;

  useFrame((_, delta) => {
    if (!camera) return;

    const speed = 1 / SWITCH_DURATION;
    currentTilt.current += (targetTilt - currentTilt.current) * Math.min(delta * speed, 1);
    const tilt = currentTilt.current;

    const gridSize = 10;
    const centerX = gridSize / 2;
    const centerZ = gridSize / 2;

    camera.position.x = centerX + DISTANCE * Math.sin(tilt) * 0.5;
    camera.position.y = DISTANCE * Math.cos(tilt);
    camera.position.z = centerZ + DISTANCE * Math.sin(tilt) * 0.5;

    camera.lookAt(centerX, 0, centerZ);
    camera.updateProjectionMatrix();

    (camera as any).__currentTilt = tilt;
  });

  return null;
}
