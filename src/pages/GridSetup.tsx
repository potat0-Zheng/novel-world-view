// src/pages/GridSetup.tsx
import { useState } from 'react';
import useWorldStore from '../store/worldStore';
import { type TerrainL1 } from '../types/world';
import { L1_TYPES } from '../data/terrainTypes';

const GRID_SIZE = 10;

export default function GridSetup() {
  const loadWorld = useWorldStore(s => s.loadWorld);
  const finishSetup = useWorldStore(s => s.finishSetup);

  // Local grid state: each cell is 'ocean' or 'continent'
  const [grid, setGrid] = useState<TerrainL1[][]>(() =>
    Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: GRID_SIZE }, () => 'ocean' as TerrainL1)
    )
  );

  const toggleCell = (x: number, y: number) => {
    setGrid(prev => {
      const next = prev.map(row => [...row]);
      next[y][x] = next[y][x] === 'ocean' ? 'continent' : 'ocean';
      return next;
    });
  };

  const handleConfirm = () => {
    // Build WorldData directly (single set, no 100 individual calls)
    const cells: Record<string, import('../types/world').CellData> = {};
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        const key = `${x}-${y}`;
        const l1 = grid[y][x];
        cells[key] = {
          l1,
          l2: l1 === 'continent' ? 'plain' : 'none',
          l3ModelId: null,
        };
      }
    }

    const worldData: import('../types/world').WorldData = {
      config: { name: '未命名世界', gridSize: GRID_SIZE },
      cells,
      entities: {},
      locationIndex: {},
      timeIndex: {},
    };

    loadWorld(worldData);
    finishSetup();
  };

  const oceanColor = L1_TYPES.ocean.color;
  const landColor = L1_TYPES.continent.color;

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#0a0a1a', gap: 20,
    }}>
      <h2 style={{ color: '#ccc', fontSize: 18, fontWeight: 600 }}>
        第一步：设定大陆与海洋
      </h2>
      <p style={{ color: '#888', fontSize: 13 }}>
        点击单元格切换 海洋 ⇄ 大陆，完成后点击「确认」
      </p>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${GRID_SIZE}, 36px)`,
        gap: 2,
        background: '#1a1a2e',
        padding: 8,
        borderRadius: 8,
        border: '1px solid #333',
      }}>
        {grid.flatMap((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              onClick={() => toggleCell(x, y)}
              title={`${x},${y}: ${cell === 'ocean' ? '海洋' : '大陆'}`}
              style={{
                width: 36, height: 36,
                background: cell === 'ocean' ? oceanColor : landColor,
                borderRadius: 3,
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.1)',
                transition: 'background 0.15s',
              }}
            />
          ))
        )}
      </div>

      {/* Stats */}
      <div style={{ color: '#888', fontSize: 12 }}>
        海洋: {grid.flat().filter(c => c === 'ocean').length} 格 ·
        大陆: {grid.flat().filter(c => c === 'continent').length} 格
      </div>

      {/* Confirm button */}
      <button onClick={handleConfirm}
        disabled={!grid.flat().some(c => c === 'continent')}
        style={{
          padding: '10px 40px', fontSize: 15, fontWeight: 600,
          background: grid.flat().some(c => c === 'continent')
            ? 'linear-gradient(135deg, #4a90d9, #3a6fb5)'
            : '#333',
          border: 'none', borderRadius: 8, color: '#fff',
          cursor: grid.flat().some(c => c === 'continent') ? 'pointer' : 'not-allowed',
        }}>
        确认 → 进入 3D 世界
      </button>

      {/* Import option */}
      <button onClick={async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) return;
          try {
            const text = await file.text();
            const data = JSON.parse(text);
            if (data.config && data.cells) {
              loadWorld(data);
              finishSetup();
            }
          } catch { alert('导入失败'); }
        };
        input.click();
      }} style={{
        background: 'none', border: '1px solid #555',
        color: '#aaa', borderRadius: 6, padding: '6px 16px',
        fontSize: 12, cursor: 'pointer',
      }}>
        导入已有世界（跳过设置）
      </button>
    </div>
  );
}
