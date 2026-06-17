// src/components/scene/WorldScene.tsx
import { Canvas } from '@react-three/fiber';
import CameraController from './CameraController';
import TerrainMesh from './TerrainMesh';
import NatureMarkers from './NatureMarkers';
import ModelLayer from './ModelLayer';
import ClickHandler from './ClickHandler';
import FocusedCellGrid from './FocusedCellGrid';
import CellHighlight from './CellHighlight';
import useWorldStore from '../../store/worldStore';

export default function WorldScene() {
  const viewMode = useWorldStore(s => s.viewMode);
  const gridSize = useWorldStore(s => s.world.config.gridSize);

  return (
    <Canvas style={{ width: '100%', height: '100%', background: '#0a0a1a' }}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 10]} intensity={0.8} castShadow />
      <hemisphereLight args={['#87ceeb', '#3a2a1a', 0.3]} />
      <CameraController />
      <TerrainMesh gridSize={gridSize} />
      <NatureMarkers />
      <ModelLayer />
      <CellHighlight />
      <ClickHandler />
      <FocusedCellGrid />
      {viewMode === '2d' && (
        <gridHelper args={[gridSize, gridSize, '#444444', '#222222']} position={[gridSize / 2, 0.01, gridSize / 2]} />
      )}
    </Canvas>
  );
}
