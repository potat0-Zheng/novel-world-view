# 施工日志

> 小说世界观可视化应用 — 从零到一的完整建造记录。

---

## 2026-06-17 — 交互打磨

### 🐛 修复

| 问题 | 说明 |
|------|------|
| 拖拽平移无效（overview 模式） | `handleInteractionStart` 每次渲染重建引用 → drei 的 useEffect 执行 dispose/connect → connect 只恢复静态监听器，`pointermove`（动态注册）被杀死 → 拖拽死|
| 拖拽松手误选 cell | `click` 事件不管拖了多远都触发。加 pointerdown 位置追踪，位移 > 3px 跳过选中 |
| 点击"总览"视角漂移 | 两重原因：(1) 过渡期间 azimuth/tilt 未变 → `anglesChanged=false` → syncCamera 整段免调；(2) 稳态后 tilt 指数衰减永远不精确 → 漂移累积 |
| 向下拖拽镜头沉入地下 | MapControls target 可出负 Y → camera 跟降到地底。改为射线-平面（Y=0）求交投影 |
| 初始加载闪帧 | ref 默认值与 entrance 起点不一致，首帧 useFrame 先于 useLayoutEffect 执行 |
| 高亮模式悬停不亮 | ref 更新不触发 React 渲染 → position 和 opacity 卡在初始值。改为 useFrame 直写 Three.js 对象 |

### ✨ 新增

- **`overviewPhase` 状态机** — `entrance` / `entering` / `steady` 三态，消除隐式状态导致的漂移
- **高空降落入场动画** — 新世界载入时相机从 30 单位高空 + 近乎垂直俯视，1.5 秒降落至预设 overview 位置
- **高亮模式**（浏览用）— 三层：网格线（`depthTest:false` 覆盖模型之上）+ 悬停金色高亮 + 选中琥珀边框
- **总览/聚焦滑动开关** — 替换原按钮，拖拽/缩放自动滑到"聚焦"，点击滑回"总览"
- **设置齿轮** — 保存/加载/导入/导出收入二级下拉面板，点外部自动关闭
- **翻转动画加速** — azimuth 时间常数从 0.8s 压缩到 0.35s，尾部收敛更快
- **ClickHandler 拖拽/点击区分** — 3px 阈值

---

## 2026-06-14 — 核心搭建

### 🏗 架构决策

- **渲染**：React 19 + Three.js + @react-three/fiber + @react-three/drei
- **状态**：Zustand 单一数据源 + 空间/时间双索引
- **视角**：2.5D（等距 ~60°）为主，2D 俯视为辅，0.8s 平滑切换
- **数据模型**：N×N 单元格（cell-based），L1/L2/L3 三层架构
- **创建流程**：2D GridSetup 设定大陆/海洋 → 确认进入 3D 编辑器

### 🧱 三层图层

```
L1 🟩 基础地形 — 海洋/大陆，全覆盖互斥
L2 🌿 自然地形 — 山脉/森林/平原，2×2 子格，仅大陆格
L3 🏗 建筑模型 — 6 种 demo（彩色方块占位），可叠加
```

### 🔧 已实现

- 项目脚手架·类型系统·Zustand 数据引擎
- GridSetup 2D 网格设定页
- TerrainMesh 3D 大陆长方体块
- NatureMarkers L2 山脉锥体 + 森林球簇
- ModelLayer L3 模型方块（6 个分类，彩色占位）
- CameraController 2.5D↔2D 平滑切换·总览/聚焦模式·翻转视角
- ClickHandler 射线点击→根据模式绘制/选中
- 编辑器 UI（L1/L2/L3 选项卡·画笔·模型库）
- DetailPanel / DetailOverlay（2.5D 侧栏 + 2D 浮层）
- JSON 导入/导出·localStorage 保存/加载
- 2×2 子格细分·编辑/浏览模式·滚轮缩放

### 🐛 修复

- 初始模型不显示 → 改用 `useThree()` 默认摄像机 + `loadWorld` 一次性写入
- ViewToggle 标签反向 → 显示当前模式
- ClickHandler 只选中不绘制 → 根据 `editorMode` 分派

---

## 版本标记

| 日期 | Commit | 说明 |
|------|--------|------|
| 06-17 | [`f6a5093`](https://github.com/potat0-Zheng/novel-world-view/commit/f6a5093) | 拖拽修复·overview 稳定性·高亮模式·入场动画 |
| 06-14 | [`377e517`](https://github.com/potat0-Zheng/novel-world-view/commit/377e517) | L2/L3 子格·编辑/浏览模式·滚轮缩放·翻转修复 |
| 06-14 | [`392633b`](https://github.com/potat0-Zheng/novel-world-view/commit/392633b) | 2.5D 画布拖动·翻转视角·聚焦/总览·模型尺寸 |
| 06-14 | [`64c5db8`](https://github.com/potat0-Zheng/novel-world-view/commit/64c5db8) | 开发日志文档 |
| 06-14 | [`45a4f88`](https://github.com/potat0-Zheng/novel-world-view/commit/45a4f88) | 修复 ViewToggle·ClickHandler·地形渲染 |
| 06-14 | [`0ecbdf0`](https://github.com/potat0-Zheng/novel-world-view/commit/0ecbdf0) | 修复默认摄像机与地形渲染 |
| 06-14 | [`814b3fa`](https://github.com/potat0-Zheng/novel-world-view/commit/814b3fa) | GridSetup 门控流程·地形颜色调整 |
| 06-14 | [`3b1ea0c`](https://github.com/potat0-Zheng/novel-world-view/commit/3b1ea0c) | 编辑器 UI 面板全套组件 |
| 06-14 | [`a32b0a9`](https://github.com/potat0-Zheng/novel-world-view/commit/a32b0a9) | R3F 场景 + 摄像机控制器 |
| 06-14 | [`6685298`](https://github.com/potat0-Zheng/novel-world-view/commit/6685298) | 点击交互 + 详情面板 |
| 06-14 | [`1e78ce5`](https://github.com/potat0-Zheng/novel-world-view/commit/1e78ce5) | L2 自然标记 + L3 模型层 |
| 06-14 | [`fc5701e`](https://github.com/potat0-Zheng/novel-world-view/commit/fc5701e) | 顶点着色地形网格 |
| 06-14 | [`3234c1f`](https://github.com/potat0-Zheng/novel-world-view/commit/3234c1f) | Zustand 数据引擎 |
| 06-14 | [`95f1288`](https://github.com/potat0-Zheng/novel-world-view/commit/95f1288) | 地形配置 + 模型库数据 |
| 06-14 | [`8d7dc51`](https://github.com/potat0-Zheng/novel-world-view/commit/8d7dc51) | 核心类型定义 |
| 06-14 | [`efcfeb3`](https://github.com/potat0-Zheng/novel-world-view/commit/efcfeb3) | Vite + React + TS 脚手架 |
| 06-14 | [`4a0b5b4`](https://github.com/potat0-Zheng/novel-world-view/commit/4a0b5b4) | 项目规划书 v0.1 |

---

*持续施工中 🚧*
