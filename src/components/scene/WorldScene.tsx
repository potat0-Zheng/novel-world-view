// src/components/scene/WorldScene.tsx
import { Canvas } from '@react-three/fiber';
import { ErrorBoundary } from '@react-three/drei';
import CameraController from './CameraController';
import TerrainMesh from './TerrainMesh';
import NatureMarkers from './NatureMarkers';
import ModelLayer from './ModelLayer';
import ClickHandler from './ClickHandler';
import FocusedCellGrid from './FocusedCellGrid';
import CellHighlight from './CellHighlight';
import useWorldStore from '../../store/worldStore';

function SafeFallback() {
  return (
    <mesh position={[5, 0.3, 5]}>
      <boxGeometry args={[1, 0.3, 1]} />
      <meshBasicMaterial color="#ff4444" wireframe />
    </mesh>
  );
}

export default function WorldScene() {
  const viewMode = useWorldStore(s => s.viewMode);
  const gridSize = useWorldStore(s => s.world.config.gridSize);

  return (
    <Canvas style={{ width: '100%', height: '100%', background: '#0a0a1a' }}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 10]} intensity={0.8} castShadow />
      <hemisphereLight args={['#87ceeb', '#3a2a1a', 0.3]} />

      <ErrorBoundary fallback={<SafeFallback />}>
        <CameraController />
      </ErrorBoundary>
      <ErrorBoundary fallback={<SafeFallback />}>
        <TerrainMesh gridSize={gridSize} />
      </ErrorBoundary>
      <ErrorBoundary fallback={<SafeFallback />}>
        <NatureMarkers />
      </ErrorBoundary>
      <ErrorBoundary fallback={<SafeFallback />}>
        <ModelLayer />
      </ErrorBoundary>
      <ErrorBoundary fallback={<SafeFallback />}>
        <CellHighlight />
      </ErrorBoundary>
      <ErrorBoundary fallback={<SafeFallback />}>
        <ClickHandler />
      </ErrorBoundary>
      <ErrorBoundary fallback={<SafeFallback />}>
        <FocusedCellGrid />
      </ErrorBoundary>

      {viewMode === '2d' && (
        <gridHelper args={[gridSize, gridSize, '#444444', '#222222']} position={[gridSize / 2, 0.01, gridSize / 2]} />
      )}
    </Canvas>
  );
}
