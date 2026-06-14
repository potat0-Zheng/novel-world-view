import LayerTabs from './LayerTabs';
import PaintPalette from './PaintPalette';
import ModelBrowser from './ModelBrowser';
import useWorldStore from '../../store/worldStore';

export default function EditorPanel() {
  const appMode = useWorldStore(s => s.appMode);
  const editorMode = useWorldStore(s => s.editorMode);
  const focusedCellKey = useWorldStore(s => s.focusedCellKey);

  if (appMode === 'browse') return null;

  return (
    <div style={{
      position: 'absolute', left: 12, top: 60,
      width: 220, background: 'rgba(13, 26, 45, 0.95)',
      border: '1px solid #333', borderRadius: 10,
      padding: 12, zIndex: 10,
    }}>
      <LayerTabs />
      {editorMode !== 'l3_place' && <PaintPalette />}
      {editorMode === 'l3_place' && <ModelBrowser />}

      {editorMode === 'l1_paint' && (
        <div style={{ marginTop: 8, fontSize: 10, color: '#4a90d9', fontStyle: 'italic' }}>
          点击地图任意处绘制海洋/大陆
        </div>
      )}
      {editorMode === 'l2_paint' && (
        <div style={{ marginTop: 8, fontSize: 10, color: '#5a8c4f', fontStyle: 'italic' }}>
          {focusedCellKey
            ? `正在编辑 ${focusedCellKey} · 点击子格绘制`
            : '点击大陆格聚焦，再点击子格绘制'}
        </div>
      )}
      {editorMode === 'l3_place' && (
        <div style={{ marginTop: 8, fontSize: 10, color: '#ffd700', fontStyle: 'italic' }}>
          {focusedCellKey
            ? `正在编辑 ${focusedCellKey} · 点击子格放置`
            : '点击大陆格聚焦，再点击子格放置'}
        </div>
      )}
    </div>
  );
}
