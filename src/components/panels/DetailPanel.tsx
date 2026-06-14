// src/components/panels/DetailPanel.tsx
import useWorldStore from '../../store/worldStore';
import { parseCoordKey } from '../../types/world';
import { L1_TYPES, L2_TYPES } from '../../data/terrainTypes';
import { getModelById } from '../../data/modelLibrary';

export default function DetailPanel() {
  const selectedCellKey = useWorldStore(s => s.selectedCellKey);
  const world = useWorldStore(s => s.world);

  if (!selectedCellKey) return null;

  const cell = world.cells[selectedCellKey];
  if (!cell) return null;

  const coord = parseCoordKey(selectedCellKey);
  const l1Name = L1_TYPES[cell.l1]?.name || cell.l1;

  // Summarise sub-cell L2 types
  const l2Set = new Set(cell.l2.filter(t => t !== 'none' && t !== 'plain'));
  const l2Summary = l2Set.size > 0
    ? [...l2Set].map(t => L2_TYPES[t]?.name || t).join('、')
    : '无';

  // First model found across sub-cells
  const firstModelId = cell.l3.find(id => id !== null) || null;
  const modelDef = firstModelId ? getModelById(firstModelId) : null;

  const entityIds = world.locationIndex[selectedCellKey] || [];
  const entities = entityIds.map(id => world.entities[id]).filter(Boolean);

  return (
    <div style={{
      position: 'absolute', right: 0, top: 0, width: 280,
      height: '100%', background: 'rgba(13, 26, 45, 0.95)',
      borderLeft: '1px solid #333', padding: 16,
      overflowY: 'auto', zIndex: 10,
    }}>
      <div style={{ color: '#ffd700', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
        {modelDef?.name || `位置 (${coord.x}, ${coord.y})`}
      </div>
      <div style={{ color: '#888', fontSize: 12, marginBottom: 12 }}>
        坐标 ({coord.x}, {coord.y}) · {l1Name} · {l2Summary}
      </div>
      <hr style={{ borderColor: '#333', margin: '8px 0' }} />

      <Section icon="👥" title="关联人物" items={entities.filter(e => e.type === 'character')} />
      <Section icon="📅" title="关联事件" items={entities.filter(e => e.type === 'event')} />
      <Section icon="⚔️" title="势力归属" items={entities.filter(e => e.type === 'faction')} />

      {/* Information text */}
      {entities.length === 0 && (
        <div style={{ fontSize: 11, color: '#555', fontStyle: 'italic', marginTop: 8 }}>
          暂无关联数据。Phase 2 将支持添加人物和事件关联。
        </div>
      )}
    </div>
  );
}

function Section({ icon, title, items }: { icon: string; title: string; items: { id: string; name: string }[] }) {
  if (items.length === 0) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ color: '#4a90d9', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
        {icon} {title}
      </div>
      {items.map(e => (
        <div key={e.id} style={{ fontSize: 12, color: '#aaa', padding: '2px 0' }}>{e.name}</div>
      ))}
    </div>
  );
}
