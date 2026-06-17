import useWorldStore from '../../store/worldStore';
import type { EditorMode } from '../../types';

const TABS: { mode: EditorMode; label: string; icon: string }[] = [
  { mode: 'l1_paint', label: 'L1 地形', icon: '🌍' },
  { mode: 'l2_paint', label: 'L2 自然', icon: '🌿' },
  { mode: 'l3_place', label: 'L3 建筑', icon: '🏗' },
];

export default function LayerTabs() {
  const editorMode = useWorldStore(s => s.editorMode);
  const setEditorMode = useWorldStore(s => s.setEditorMode);
  const setFocusedCellKey = useWorldStore(s => s.setFocusedCellKey);

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {TABS.map(tab => (
        <button
          key={tab.mode}
          onClick={() => {
            setEditorMode(tab.mode);
            setFocusedCellKey(null); // switching layers unfocuses
          }}
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
