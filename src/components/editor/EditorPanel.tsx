import LayerTabs from './LayerTabs';
import PaintPalette from './PaintPalette';
import ModelBrowser from './ModelBrowser';
import useWorldStore from '../../store/worldStore';

export default function EditorPanel() {
  const editorMode = useWorldStore(s => s.editorMode);

  return (
    <div style={{
      position: 'absolute', left: 12, top: 60,
      width: 220, background: 'rgba(13, 26, 45, 0.95)',
      border: '1px solid #333', borderRadius: 10,
      padding: 12, zIndex: 10,
    }}>
      <LayerTabs />
      {editorMode !== 'view' && !editorMode.startsWith('l3') && <PaintPalette />}
      {editorMode === 'l3_place' && <ModelBrowser />}
      {editorMode === 'l3_place' && (
        <div style={{ marginTop: 8, fontSize: 10, color: '#ffd700', fontStyle: 'italic' }}>
          点击地图上的大陆格放置模型
        </div>
      )}
      {editorMode === 'l2_paint' && (
        <div style={{ marginTop: 8, fontSize: 10, color: '#5a8c4f', fontStyle: 'italic' }}>
          仅可放置在大陆格上
        </div>
      )}
    </div>
  );
}
