// src/pages/WorldEditor.tsx
import { useEffect } from 'react';
import WorldScene from '../components/scene/WorldScene';
import EditorPanel from '../components/editor/EditorPanel';
import Toolbar from '../components/ui/Toolbar';
import DetailPanel from '../components/panels/DetailPanel';
import GridSetup from './GridSetup';
import useWorldStore from '../store/worldStore';

export default function WorldEditor() {
  const setupComplete = useWorldStore(s => s.setupComplete);
  useEffect(() => { (window as any).__worldStore = useWorldStore; }, []);
  if (!setupComplete) return <GridSetup />;
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <WorldScene />
      <Toolbar />
      <EditorPanel />
      <DetailPanel />
    </div>
  );
}
