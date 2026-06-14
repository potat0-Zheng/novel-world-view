// src/data/modelLibrary.ts
// 6 demo models — one per category. Using colored box placeholders.
// Replace with GLTF paths when real models are imported.

import type { ModelDef, ModelCategory } from '../types/world';

// Model sizes are in [width, height, depth] — all within 0.85×0.85 footprint
// so they fit inside a single 1×1 terrain cell
const DEMO_MODELS: ModelDef[] = [
  { id: 'castle',    name: '中型城堡',   category: 'castle'     as ModelCategory, color: '#d4a843', size: [0.72, 0.90, 0.72] },
  { id: 'village',   name: '小村庄',     category: 'settlement' as ModelCategory, color: '#b8943a', size: [0.78, 0.50, 0.78] },
  { id: 'temple',    name: '神殿',       category: 'temple'     as ModelCategory, color: '#8a4080', size: [0.66, 1.10, 0.66] },
  { id: 'tower',     name: '法师塔',     category: 'tower'      as ModelCategory, color: '#5a7a9a', size: [0.42, 1.60, 0.42] },
  { id: 'bridge',    name: '桥梁',       category: 'structure'  as ModelCategory, color: '#8a7a5a', size: [0.84, 0.35, 0.48] },
  { id: 'greattree', name: '巨树/神木',  category: 'landmark'   as ModelCategory, color: '#2d6b20', size: [0.50, 1.40, 0.50] },
];

export function getModelById(id: string): ModelDef | undefined {
  return DEMO_MODELS.find(m => m.id === id);
}

export function getModelsByCategory(cat: ModelCategory): ModelDef[] {
  return DEMO_MODELS.filter(m => m.category === cat);
}

export default DEMO_MODELS;
