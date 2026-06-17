import { useState, useRef, useEffect } from 'react';
import useWorldStore from '../../store/worldStore';
import { worldStorage } from '../../services/storage';
import ViewToggle from './ViewToggle';

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
  const highlightMode = useWorldStore(s => s.highlightMode);
  const setFocusMode = useWorldStore(s => s.setFocusMode);
  const setViewFlipped = useWorldStore(s => s.setViewFlipped);
  const setAppMode = useWorldStore(s => s.setAppMode);
  const setHighlightMode = useWorldStore(s => s.setHighlightMode);

  const handleSave = async () => {
    try {
      const data = useWorldStore.getState().world;
      await worldStorage.save(data);
      alert('已保存到本地存储');
    } catch {
      alert('保存失败');
    }
  };

  const handleLoad = async () => {
    try {
      const data = await worldStorage.load();
      if (data) {
        useWorldStore.getState().loadWorld(data);
        alert('已加载');
      } else {
        alert('没有找到保存的数据');
      }
    } catch {
      alert('加载失败：数据格式错误');
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

  const handleFocusToggle = () => {
    // Clicking the slider always resets to overview
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

  // ── Settings dropdown ──
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!settingsOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [settingsOpen]);

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

      {/* Overview / Focus slider */}
      <div
        onClick={handleFocusToggle}
        title="点击回到总览 · 缩放/拖拽自动聚焦"
        style={{
          display: 'flex', alignItems: 'center',
          background: '#1a1a2e', borderRadius: 20,
          border: '1px solid #333', padding: 2,
          cursor: 'pointer', userSelect: 'none',
          position: 'relative', minWidth: 140,
        }}>
        {/* sliding thumb */}
        <div style={{
          position: 'absolute',
          top: 2, bottom: 2,
          left: isOverview ? 2 : '50%',
          width: '50%',
          background: isOverview ? '#ffd70022' : '#4a90d922',
          border: `1px solid ${isOverview ? '#ffd700' : '#4a90d9'}`,
          borderRadius: 18,
          transition: 'left 0.35s ease, border-color 0.35s ease, background 0.35s ease',
        }} />
        {/* labels */}
        <span style={{
          flex: 1, textAlign: 'center', zIndex: 1,
          color: isOverview ? '#ffd700' : '#666',
          fontSize: 11, fontWeight: isOverview ? 700 : 400,
          transition: 'color 0.35s ease', padding: '4px 0',
        }}>🗺 总览</span>
        <span style={{
          flex: 1, textAlign: 'center', zIndex: 1,
          color: !isOverview ? '#ffd700' : '#666',
          fontSize: 11, fontWeight: !isOverview ? 700 : 400,
          transition: 'color 0.35s ease', padding: '4px 0',
        }}>🔍 聚焦</span>
      </div>

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

      {/* Highlight mode toggle */}
      <button
        onClick={() => setHighlightMode(!highlightMode)}
        title="高亮模式：显示网格线和单元格悬停"
        style={{
          ...btnStyle,
          border: highlightMode ? '1px solid #ffd700' : '1px solid #333',
          color: highlightMode ? '#ffd700' : '#666',
        }}>
        🔲 高亮
      </button>

      <div style={{ flex: 1 }} />

      {/* ⚙ Settings */}
      <div ref={settingsRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setSettingsOpen(v => !v)}
          title="设置"
          style={{
            ...btnStyle, padding: '4px 8px',
            border: settingsOpen ? '1px solid #ffd700' : '1px solid #333',
            color: settingsOpen ? '#ffd700' : '#888',
          }}>
          ⚙
        </button>
        {settingsOpen && (
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 6,
            background: '#1a1a2e', border: '1px solid #333', borderRadius: 8,
            padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6,
            minWidth: 120, zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
          }}>
            <button onClick={() => { handleSave(); setSettingsOpen(false); }} style={btnStyle}>💾 保存</button>
            <button onClick={() => { handleLoad(); setSettingsOpen(false); }} style={btnStyle}>📂 加载</button>
            <button onClick={() => { handleExport(); setSettingsOpen(false); }} style={btnStyle}>📤 导出</button>
            <button onClick={() => { handleImport(); setSettingsOpen(false); }} style={btnStyle}>📥 导入</button>
          </div>
        )}
      </div>
    </div>
  );
}
