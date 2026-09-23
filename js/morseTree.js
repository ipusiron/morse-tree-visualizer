import { MORSE_TABLE } from './morseMap.js';

function node(code) {
  return { code, char: null, depth: code.length, left: null, right: null };
}

export function buildTree(table = MORSE_TABLE, maxDepth = 6, prosigns = []) {
  const root = node('');
  const nodes = new Map([['', root]]);
  const outside = [];
  for (const entry of [...table, ...prosigns]) {
    if (entry.code.length > maxDepth) {
      outside.push(entry);
      continue;
    }
    let current = root;
    for (const symbol of entry.code) {
      const direction = symbol === '.' ? 'left' : 'right';
      if (!current[direction]) {
        current[direction] = node(current.code + symbol);
        nodes.set(current[direction].code, current[direction]);
      }
      current = current[direction];
    }
    if (entry.char !== undefined) current.char = entry.char;
    if (entry.label) current.prosign = entry.label;
  }
  return { root, nodes, outside };
}

export function completeTo(tree, fullDepth = 5) {
  function visit(current) {
    if (current.depth >= fullDepth) return;
    for (const [direction, symbol] of [['left', '.'], ['right', '-']]) {
      if (!current[direction]) {
        current[direction] = node(current.code + symbol);
        tree.nodes.set(current[direction].code, current[direction]);
      }
      visit(current[direction]);
    }
  }
  visit(tree.root);
  return tree;
}

export function layoutTree(tree, { xStep = 30, yStep = 64, x0 = 20, y0 = 30 } = {}) {
  let leaves = 0;
  function visit(current) {
    const children = [current.left, current.right].filter(Boolean);
    children.forEach(visit);
    current.x = children.length ? children.reduce((sum, child) => sum + child.x, 0) / children.length : x0 + leaves++ * xStep;
    current.y = y0 + current.depth * yStep;
  }
  visit(tree.root);
  const all = [...tree.nodes.values()];
  const minX = Math.min(...all.map(n => n.x));
  const maxX = Math.max(...all.map(n => n.x));
  const maxY = Math.max(...all.map(n => n.y));
  return { leaves, minX, maxX, maxY, width: maxX - minX, height: maxY - y0 };
}

export function layoutChart(tree, { xStep = 64, yStep = 56, ox = 360, oy = 40 } = {}) {
  const key = (x, y) => x + ',' + y;
  const shapes = new Map();
  function shape(node, side) {
    if (shapes.has(node.code)) return shapes.get(node.code);
    const cells = new Set([key(0, 0)]);
    const rel = new Map([[node.code, [0, 0]]]);
    const horizontal = side < 0 ? node.right : node.left;
    const down = side < 0 ? node.left : node.right;
    if (horizontal) {
      const hs = shape(horizontal, side);
      for (const c of hs.cells) {
        const [x, y] = c.split(',').map(Number);
        cells.add(key(x + side, y));
      }
      for (const [code, [x, y]] of hs.rel) rel.set(code, [x + side, y]);
    }
    if (down) {
      const ds = shape(down, side);
      let dy = 1;
      for (;;) {
        let clash = false;
        for (let r = 1; r < dy && !clash; r++) if (cells.has(key(0, r))) clash = true;
        if (!clash) for (const c of ds.cells) {
          const [x, y] = c.split(',').map(Number);
          if (cells.has(key(x, y + dy))) {
            clash = true;
            break;
          }
        }
        if (!clash) break;
        dy++;
      }
      for (let r = 1; r < dy; r++) cells.add(key(0, r));
      for (const c of ds.cells) {
        const [x, y] = c.split(',').map(Number);
        cells.add(key(x, y + dy));
      }
      for (const [code, [x, y]] of ds.rel) rel.set(code, [x, y + dy]);
    }
    const result = { cells, rel };
    shapes.set(node.code, result);
    return result;
  }
  const pos = new Map([['', [0, 0]]]);
  if (tree.root.right) for (const [code, [x, y]] of shape(tree.root.right, -1).rel) pos.set(code, [x - 1, y]);
  if (tree.root.left) for (const [code, [x, y]] of shape(tree.root.left, 1).rel) pos.set(code, [x + 1, y]);
  for (const node of tree.nodes.values()) {
    const [col, row] = pos.get(node.code);
    node.col = col;
    node.row = row;
    node.x = ox + col * xStep;
    node.y = oy + row * yStep;
    node.shape = node.depth === 0 ? 'root' : node.code.endsWith('.') ? 'circle' : 'rect';
  }
  const all = [...tree.nodes.values()];
  const minCol = Math.min(...all.map(n => n.col));
  const maxCol = Math.max(...all.map(n => n.col));
  const maxRow = Math.max(...all.map(n => n.row));
  return { minCol, maxCol, maxRow, width: (maxCol - minCol) * xStep + 80, height: maxRow * yStep + 80 };
}
