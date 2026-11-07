import { buildTree, completeTo, layoutTree, layoutChart, layoutHTree } from './morseTree.js';

// 木に表示する文字種。4つの木で共通にし、符号（欧文／和文）ごとに保存する。
export const KIND_GROUPS = {
  intl: ['letter', 'digit', 'punct', 'prosign'],
  wabun: ['kana', 'mark', 'digit', 'symbol']
};
const DEFAULT_KINDS = {
  intl: ['letter', 'digit', 'punct'],
  wabun: ['kana', 'mark', 'digit', 'symbol']
};
export const MAX_TREE_DEPTH = 6;
const STORAGE_KEY = 'morse-tree-kinds';
const sessionKinds = {};

// ÉはITUでは英字だが5符号なので、学習モードの出題範囲と同じく記号に入れる（英字だけなら深さ4）。
export function kindOf(entry, system) {
  if (entry.label) return 'prosign';
  return system === 'intl' && entry.char === 'É' ? 'punct' : entry.kind;
}

function normalize(system, list) {
  if (!Array.isArray(list)) return null;
  const kinds = KIND_GROUPS[system].filter(kind => list.includes(kind));
  return kinds.length ? kinds : null;
}

export function readKinds(system) {
  if (!KIND_GROUPS[system]) throw new RangeError('Unknown code system');
  if (sessionKinds[system]) return [...sessionKinds[system]];
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return normalize(system, saved?.[system]) ?? [...DEFAULT_KINDS[system]];
  } catch { return [...DEFAULT_KINDS[system]]; }
}

export function writeKinds(system, list) {
  const kinds = normalize(system, list);
  if (!kinds) return false;
  sessionKinds[system] = kinds;
  try {
    const saved = Object.fromEntries(Object.keys(KIND_GROUPS).map(key => [key, readKinds(key)]));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch { /* Storage is optional. */ }
  return true;
}

// 表示する文字のうち最も深いものに合わせて木を刈り込む。範囲内の非表示の文字は hiddenKind の節として残す。
export function buildVisibleTree(system, shown, table, prosigns = []) {
  const entries = [...table, ...prosigns];
  const visible = entry => shown.includes(kindOf(entry, system));
  const depth = Math.max(1, ...entries.filter(e => visible(e) && e.code.length <= MAX_TREE_DEPTH).map(e => e.code.length));
  const tree = buildTree(table, depth, prosigns);
  for (const entry of entries) {
    const node = tree.nodes.get(entry.code);
    if (node) node.shown = node.shown || visible(entry);
  }
  for (const node of tree.nodes.values()) node.hiddenKind = node.depth > 0 && !node.shown && Boolean(node.char || node.prosign);
  tree.depth = depth;
  return tree;
}

// 見た目ごとに座標を決め、図の枠（viewBox の x, y, 幅, 高さ）を返す。画面とREADMEの寸法の表が同じ計算を使う。
export function layoutVisibleTree(system, shown, table, prosigns, mode) {
  const tree = buildVisibleTree(system, shown, table, prosigns);
  if (mode === 'chart') {
    const { minCol, width, height } = layoutChart(tree);
    return { tree, box: [360 + minCol * 64 - 40, 0, width, height] };
  }
  completeTo(tree, Math.min(tree.depth, 5));
  if (mode === 'htree') {
    const { width, height } = layoutHTree(tree);
    return { tree, box: [0, 0, width, height] };
  }
  // 浅い木は葉の間隔を広げる（深さ4で30pxだと丸どうしが接する）。
  const { minX, maxX, maxY } = layoutTree(tree, { xStep: tree.depth <= 4 ? 40 : 30 });
  return { tree, box: [minX - 70, -30, maxX - minX + 90, maxY + 56] };
}
