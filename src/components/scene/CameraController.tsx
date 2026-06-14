// src/components/scene/CameraController.tsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from 'three';
import useWorldStore from '../../store/worldStore';

// Camera angles
const TILT_2_5D = Math.PI / 3;   // ~60° tilted from vertical
const TILT_2D = 0;                // straight down (top-down)
const DISTANCE = 14;              // camera distance from center
const SWITCH_DURATION = 0.8;      // seconds for transition

export default function CameraController() {
  const cameraRef = useRef<PerspectiveCamera>(null!);
  const viewMode = useWorldStore(s => s.viewMode);
  const currentTilt = useRef(TILT_2_5D);

  const targetTilt = viewMode === '2.5d' ? TILT_2_5D : TILT_2D;

  useFrame((_, delta) => {
    if (!cameraRef.current) return;
    const cam = cameraRef.current;

    // Smooth lerp toward target tilt
    const speed = 1 / SWITCH_DURATION;
    currentTilt.current += (targetTilt - currentTilt.current) * Math.min(delta * speed, 1);
    const tilt = currentTilt.current;

    const gridSize = 10;
    const centerX = gridSize / 2;
    const centerZ = gridSize / 2;

    // Position camera on an arc from side to top
    cam.position.x = centerX + DISTANCE * Math.sin(tilt) * 0.5;
    cam.position.y = DISTANCE * Math.cos(tilt);
    cam.position.z = centerZ + DISTANCE * Math.sin(tilt) * 0.5;

    cam.lookAt(centerX, 0, centerZ);
    cam.updateProjectionMatrix();

    // Store current tilt for cross-fade logic used by ModelLayer
    (cam as any).__currentTilt = tilt;
  });

  return (
    <perspectiveCamera
      ref={cameraRef}
      fov={50}
      near={0.1}
      far={100}
    />
  );
}
