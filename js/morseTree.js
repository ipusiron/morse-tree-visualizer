import { MORSE_TABLE } from './morseMap.js';

function node(code) {
  return { code, char: null, depth: code.length, left: null, right: null };
}

export function buildTree(table = MORSE_TABLE, maxDepth = 6) {
  const root = node('');
  const nodes = new Map([['', root]]);
  const outside = [];
  for (const entry of table) {
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
    current.char = entry.char;
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
