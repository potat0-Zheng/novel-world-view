// src/components/panels/DetailOverlay.tsx
import useWorldStore from '../../store/worldStore';
import { parseCoordKey } from '../../types/world';
import { getModelById } from '../../data/modelLibrary';

export default function DetailOverlay() {
  const selectedCellKey = useWorldStore(s => s.selectedCellKey);
  const setSelectedCellKey = useWorldStore(s => s.setSelectedCellKey);
  const world = useWorldStore(s => s.world);

  if (!selectedCellKey) return null;

  const coord = parseCoordKey(selectedCellKey);
  const cell = world.cells[selectedCellKey];
  const firstModelId = cell?.l3?.find(id => id !== null) || null;
  const modelDef = firstModelId ? getModelById(firstModelId) : null;

  if (!cell) return null;

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 20,
    }} onClick={() => setSelectedCellKey(null)}>
      <div style={{
        background: '#0d1a2d', borderRadius: 12,
        padding: 24, minWidth: 320, maxWidth: 480,
        border: '1px solid #333',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ color: '#ffd700', fontSize: 18, fontWeight: 700 }}>
            {modelDef?.name || `位置 (${coord.x}, ${coord.y})`}
          </span>
          <button onClick={() => setSelectedCellKey(null)}
            style={{ background: 'none', border: '1px solid #555', color: '#aaa', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}>
            ✕
          </button>
        </div>
        <div style={{ color: '#888', fontSize: 12, marginBottom: 12 }}>
          坐标 ({coord.x}, {coord.y})
        </div>
        <hr style={{ borderColor: '#333', margin: '8px 0' }} />
        <div style={{ fontSize: 11, color: '#555', fontStyle: 'italic' }}>
          详细数据将在 Phase 2 实现（人物、事件、势力关联）
        </div>
      </div>
    </div>
  );
}
