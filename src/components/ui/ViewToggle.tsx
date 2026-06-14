import useWorldStore from '../../store/worldStore';

export default function ViewToggle() {
  const viewMode = useWorldStore(s => s.viewMode);
  const setViewMode = useWorldStore(s => s.setViewMode);

  return (
    <button onClick={() => setViewMode(viewMode === '2.5d' ? '2d' : '2.5d')}
      style={{
        background: '#1a1a2e', border: '1px solid #4a90d9',
        color: '#4a90d9', borderRadius: 6, padding: '4px 10px',
        fontSize: 11, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
      {viewMode === '2.5d' ? '🗺 2.5D' : '📐 2D'}
    </button>
  );
}
