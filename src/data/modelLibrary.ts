// src/data/modelLibrary.ts
// 6 demo models — one per category. Using colored box placeholders.
// Replace with GLTF paths when real models are imported.

import type { ModelDef, ModelCategory } from '../types/world';

const DEMO_MODELS: ModelDef[] = [
  { id: 'castle',    name: '中型城堡',   category: 'castle'     as ModelCategory, color: '#d4a843', size: [2.5, 3.0, 2.5] },
  { id: 'village',   name: '小村庄',     category: 'settlement' as ModelCategory, color: '#b8943a', size: [2.0, 1.5, 2.0] },
  { id: 'temple',    name: '神殿',       category: 'temple'     as ModelCategory, color: '#8a4080', size: [2.0, 3.5, 2.0] },
  { id: 'tower',     name: '法师塔',     category: 'tower'      as ModelCategory, color: '#5a7a9a', size: [1.5, 4.0, 1.5] },
  { id: 'bridge',    name: '桥梁',       category: 'structure'  as ModelCategory, color: '#8a7a5a', size: [3.0, 0.8, 1.0] },
  { id: 'greattree', name: '巨树/神木',  category: 'landmark'   as ModelCategory, color: '#2d6b20', size: [2.0, 4.0, 2.0] },
];

export function getModelById(id: string): ModelDef | undefined {
  return DEMO_MODELS.find(m => m.id === id);
}

export function getModelsByCategory(cat: ModelCategory): ModelDef[] {
  return DEMO_MODELS.filter(m => m.category === cat);
}

export default DEMO_MODELS;
