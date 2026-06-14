import useWorldStore from '../../store/worldStore';
import { TERRAIN_L1_OPTIONS, TERRAIN_L2_OPTIONS } from '../../types/world';

export default function PaintPalette() {
  const editorMode = useWorldStore(s => s.editorMode);
  const selectedPaintL1 = useWorldStore(s => s.selectedPaintL1);
  const selectedPaintL2 = useWorldStore(s => s.selectedPaintL2);
  const setSelectedPaintL1 = useWorldStore(s => s.setSelectedPaintL1);
  const setSelectedPaintL2 = useWorldStore(s => s.setSelectedPaintL2);

  if (editorMode === 'l1_paint') {
    return (
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        {TERRAIN_L1_OPTIONS.map(t => (
          <button key={t} onClick={() => setSelectedPaintL1(t)}
            style={{
              flex: 1, padding: '8px 12px', fontSize: 12,
              background: selectedPaintL1 === t ? '#3a6fb5' : '#1a1a2e',
              border: `2px solid ${selectedPaintL1 === t ? '#4a90d9' : '#333'}`,
              color: '#fff', borderRadius: 8, cursor: 'pointer',
            }}>
            {t === 'ocean' ? '🌊 海洋' : '🟩 大陆'}
          </button>
        ))}
      </div>
    );
  }

  if (editorMode === 'l2_paint') {
    return (
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        {TERRAIN_L2_OPTIONS.map(t => (
          <button key={t} onClick={() => setSelectedPaintL2(t)}
            style={{
              flex: 1, padding: '8px 12px', fontSize: 12,
              background: selectedPaintL2 === t ? '#3a6fb5' : '#1a1a2e',
              border: `2px solid ${selectedPaintL2 === t ? '#4a90d9' : '#333'}`,
              color: '#fff', borderRadius: 8, cursor: 'pointer',
            }}>
            {t === 'plain' ? '🌿 平原' : t === 'mountain' ? '⛰ 山脉' : '🌲 森林'}
          </button>
        ))}
      </div>
    );
  }

  return null;
}
