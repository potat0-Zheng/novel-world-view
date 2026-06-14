import useWorldStore from '../../store/worldStore';
import DEMO_MODELS from '../../data/modelLibrary';

export default function ModelBrowser() {
  const selectedModelId = useWorldStore(s => s.selectedModelId);
  const setSelectedModelId = useWorldStore(s => s.setSelectedModelId);
  const setEditorMode = useWorldStore(s => s.setEditorMode);

  const categories = [...new Set(DEMO_MODELS.map(m => m.category))];

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>选择要放置的建筑：</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {categories.map(cat => (
          <div key={cat}>
            <div style={{ fontSize: 10, color: '#555', margin: '4px 0 2px 4px', textTransform: 'uppercase' }}>
              {cat}
            </div>
            {DEMO_MODELS.filter(m => m.category === cat).map(model => (
              <button key={model.id}
                onClick={() => { setSelectedModelId(model.id); setEditorMode('l3_place'); }}
                style={{
                  width: '100%', padding: '6px 8px', fontSize: 11, textAlign: 'left',
                  background: selectedModelId === model.id ? '#3a6fb5' : '#1a1a2e',
                  border: `1px solid ${selectedModelId === model.id ? '#4a90d9' : '#333'}`,
                  color: '#ccc', borderRadius: 4, cursor: 'pointer',
                }}>
                {model.name}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
