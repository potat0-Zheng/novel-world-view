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
  const worldName = '未命名世界'; // placeholder — will read from store later

  const handleSave = () => {
    // Demo: save entire world state as JSON to localStorage
    const state = (window as any).__worldStore?.getState?.();
    if (state) {
      saveToLocalStorage(JSON.stringify(state.world));
      alert('已保存到本地存储');
    }
  };

  const handleLoad = () => {
    const json = loadFromLocalStorage();
    if (json) {
      try {
        const data = JSON.parse(json);
        const state = (window as any).__worldStore?.getState?.();
        if (state?.loadWorld) {
          state.loadWorld(data);
          alert('已加载');
        }
      } catch {
        alert('加载失败：数据格式错误');
      }
    } else {
      alert('没有找到保存的数据');
    }
  };

  const handleExport = () => {
    const state = (window as any).__worldStore?.getState?.();
    if (!state) return;
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
        const state = (window as any).__worldStore?.getState?.();
        if (state?.loadWorld) {
          state.loadWorld(data);
          alert('已导入');
        }
      } catch {
        alert('导入失败：文件格式错误');
      }
    };
    input.click();
  };

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

      <div style={{ flex: 1 }} />

      <ViewToggle />
      <button onClick={handleSave} style={btnStyle}>💾 保存</button>
      <button onClick={handleLoad} style={btnStyle}>📂 加载</button>
      <button onClick={handleExport} style={btnStyle}>📤 导出</button>
      <button onClick={handleImport} style={btnStyle}>📥 导入</button>
    </div>
  );
}
