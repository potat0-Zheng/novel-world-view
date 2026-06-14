import useWorldStore from '../../store/worldStore';
import ViewToggle from './ViewToggle';

// Simple save/load using localStorage for demo (IndexedDB in full implementation)
function saveToLocalStorage(json: string) {
  localStorage.setItem('novel-world-save', json);
}
function loadFromLocalStorage(): string | null {
  return localStorage.getItem('novel-world-save');
}

const btnStyle: React.CSSProperties = {
  background: '#1a1a2e', border: '1px solid #333',
  color: '#ccc', borderRadius: 6, padding: '4px 10px',
  fontSize: 11, cursor: 'pointer',
};

export default function Toolbar() {
  const worldName = useWorldStore(s => s.world.config.name);
  const focusMode = useWorldStore(s => s.focusMode);
  const viewFlipped = useWorldStore(s => s.viewFlipped);
  const appMode = useWorldStore(s => s.appMode);
  const selectedCellKey = useWorldStore(s => s.selectedCellKey);
  const setFocusMode = useWorldStore(s => s.setFocusMode);
  const setViewFlipped = useWorldStore(s => s.setViewFlipped);
  const setAppMode = useWorldStore(s => s.setAppMode);

  const handleSave = () => {
    const state = useWorldStore.getState();
    saveToLocalStorage(JSON.stringify(state.world));
    alert('已保存到本地存储');
  };

  const handleLoad = () => {
    const json = loadFromLocalStorage();
    if (json) {
      try {
        const data = JSON.parse(json);
        useWorldStore.getState().loadWorld(data);
        alert('已加载');
      } catch {
        alert('加载失败：数据格式错误');
      }
    } else {
      alert('没有找到保存的数据');
    }
  };

  const handleExport = () => {
    const state = useWorldStore.getState();
    const json = JSON.stringify(state.world, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'world.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        useWorldStore.getState().loadWorld(data);
        alert('已导入');
      } catch {
        alert('导入失败：文件格式错误');
      }
    };
    input.click();
  };

  const handleOverview = () => {
    setViewFlipped(false);
    setFocusMode('overview');
  };

  const handleFlip = () => {
    if (focusMode === 'overview') {
      setFocusMode('focus');
    }
    setViewFlipped(!viewFlipped);
  };

  const handleAppModeToggle = () => {
    setAppMode(appMode === 'edit' ? 'browse' : 'edit');
  };

  const isOverview = focusMode === 'overview';
  const isEditing = appMode === 'edit';

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 44,
      background: 'rgba(10, 10, 26, 0.9)', borderBottom: '1px solid #222',
      display: 'flex', alignItems: 'center', padding: '0 14px',
      gap: 10, zIndex: 20,
    }}>
      <span style={{ color: '#ffd700', fontWeight: 700, fontSize: 14 }}>
        {worldName}
      </span>

      {/* Edit / Browse toggle */}
      <button onClick={handleAppModeToggle}
        style={{
          ...btnStyle,
          border: isEditing ? '1px solid #ff9800' : '1px solid #4a90d9',
          color: isEditing ? '#ff9800' : '#4a90d9',
          fontWeight: 600,
        }}>
        {isEditing ? '✏️ 编辑中' : '👁 浏览'}
      </button>

      {/* Mode indicator */}
      {!isOverview && (
        <span style={{ color: '#888', fontSize: 10 }}>聚焦中</span>
      )}

      <div style={{ flex: 1 }} />

      {/* Overview reset — always available */}
      <button onClick={handleOverview}
        style={{
          ...btnStyle,
          border: isOverview ? '1px solid #333' : '1px solid #ffd700',
          color: isOverview ? '#666' : '#ffd700',
          opacity: isOverview ? 0.5 : 1,
        }}>
        🗺 总览
      </button>

      {/* Flip view direction (2.5D only — swaps SE ↔ NW) */}
      <button onClick={handleFlip}
        title="翻转俯瞰方向（东南 ⇄ 西北）"
        style={{
          ...btnStyle,
          border: viewFlipped ? '1px solid #4a90d9' : '1px solid #333',
          color: viewFlipped ? '#4a90d9' : '#888',
        }}>
        🔄 翻转
      </button>

      <ViewToggle />
      <button onClick={handleSave} style={btnStyle}>💾 保存</button>
      <button onClick={handleLoad} style={btnStyle}>📂 加载</button>
      <button onClick={handleExport} style={btnStyle}>📤 导出</button>
      <button onClick={handleImport} style={btnStyle}>📥 导入</button>
    </div>
  );
}
