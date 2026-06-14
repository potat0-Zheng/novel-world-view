import useWorldStore from '../../store/worldStore';
import type { EditorMode } from '../../types/world';

const TABS: { mode: EditorMode; label: string; icon: string }[] = [
  { mode: 'l1_paint', label: 'L1 基础地形', icon: '🌍' },
  { mode: 'l2_paint', label: 'L2 自然地形', icon: '🌿' },
  { mode: 'l3_place', label: 'L3 建筑', icon: '🏗' },
  { mode: 'view',     label: '浏览',        icon: '👁' },
];

export default function LayerTabs() {
  const editorMode = useWorldStore(s => s.editorMode);
  const setEditorMode = useWorldStore(s => s.setEditorMode);

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {TABS.map(tab => (
        <button
          key={tab.mode}
          onClick={() => setEditorMode(tab.mode)}
          style={{
            flex: 1, padding: '6px 4px', fontSize: 11,
            background: editorMode === tab.mode ? '#3a6fb5' : '#1a1a2e',
            border: `1px solid ${editorMode === tab.mode ? '#4a90d9' : '#333'}`,
            color: '#ccc', borderRadius: 6, cursor: 'pointer',
          }}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  );
}
