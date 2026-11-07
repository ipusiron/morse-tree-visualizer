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

// Hツリー: 奇数番目の符号は左右、偶数番目は上下に進み、枝は1段ごとに1/√2倍になる。
// 最短の枝をminEdgeにそろえるので、どの深さでも節どうし・節と他の枝はminEdge以上離れる。
export function layoutHTree(tree, { minEdge = 36, margin = 24 } = {}) {
  const depth = Math.max(...[...tree.nodes.values()].map(n => n.depth));
  const unit = minEdge * Math.SQRT2 ** (depth - 1);
  const reach = first => {
    let sum = 0;
    for (let d = first; d <= depth; d += 2) sum += unit / Math.SQRT2 ** (d - 1);
    return sum;
  };
  const half = { x: reach(1), y: reach(2) };
  const round = value => Math.round(value * 10) / 10;
  function visit(node, x, y) {
    node.x = round(margin + half.x + x);
    node.y = round(margin + half.y + y);
    const length = unit / Math.SQRT2 ** node.depth;
    const horizontal = node.depth % 2 === 0;
    for (const [child, sign] of [[node.left, -1], [node.right, 1]]) {
      if (child) visit(child, x + (horizontal ? sign * length : 0), y + (horizontal ? 0 : sign * length));
    }
  }
  visit(tree.root, 0, 0);
  return { depth, unit, width: round(2 * (half.x + margin)), height: round(2 * (half.y + margin)) };
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
