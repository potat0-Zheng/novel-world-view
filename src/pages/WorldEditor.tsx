// src/pages/WorldEditor.tsx
import { useEffect } from 'react';
import WorldScene from '../components/scene/WorldScene';
import EditorPanel from '../components/editor/EditorPanel';
import Toolbar from '../components/ui/Toolbar';
import DetailPanel from '../components/panels/DetailPanel';
import DetailOverlay from '../components/panels/DetailOverlay';
import useWorldStore from '../store/worldStore';

export default function WorldEditor() {
  const viewMode = useWorldStore(s => s.viewMode);

  // Expose store globally for Toolbar save/load/export/import
  useEffect(() => {
    (window as any).__worldStore = useWorldStore;
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* 3D Canvas (full screen background) */}
      <WorldScene />

      {/* Top toolbar */}
      <Toolbar />

      {/* Left editor panel (layer tabs, paint palette, model browser) */}
      <EditorPanel />

      {/* Detail view: sidebar in 2.5D mode, overlay in 2D mode */}
      {viewMode === '2.5d' ? <DetailPanel /> : <DetailOverlay />}
    </div>
  );
}
