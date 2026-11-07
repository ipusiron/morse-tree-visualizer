import test from 'node:test';
import assert from 'node:assert/strict';
import { MORSE_TABLE, PROSIGNS } from '../js/morseMap.js';
import { WABUN_TABLE } from '../js/wabunMap.js';
import { completeTo, layoutTree, layoutHTree } from '../js/morseTree.js';
import { buildVisibleTree } from '../js/kinds.js';

function visibleTree(system, shown) {
  const tree = buildVisibleTree(system, shown, system === 'intl' ? MORSE_TABLE : WABUN_TABLE, system === 'intl' ? PROSIGNS : []);
  return completeTo(tree, Math.min(tree.depth, 5));
}

// 実装とは別の置き方: 深さごとに全節を反復で置き、外接枠から余白を足す。
function reference(depth, minEdge = 36, margin = 24) {
  const unit = minEdge * Math.SQRT2 ** (depth - 1);
  const pos = new Map([['', [0, 0]]]);
  for (let d = 1; d <= depth; d++) {
    const length = unit / Math.SQRT2 ** (d - 1);
    for (const [code, [x, y]] of [...pos].filter(([code]) => code.length === d - 1)) {
      pos.set(code + '.', d % 2 ? [x - length, y] : [x, y - length]);
      pos.set(code + '-', d % 2 ? [x + length, y] : [x, y + length]);
    }
  }
  const xs = [...pos.values()].map(p => p[0]);
  const ys = [...pos.values()].map(p => p[1]);
  const shift = [margin - Math.min(...xs), margin - Math.min(...ys)];
  return {
    pos: new Map([...pos].map(([code, [x, y]]) => [code, [x + shift[0], y + shift[1]]])),
    width: Math.max(...xs) - Math.min(...xs) + 2 * margin,
    height: Math.max(...ys) - Math.min(...ys) + 2 * margin
  };
}

function segmentDistance([px, py], [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}

test('H-tree sizes and named positions for depth four, five and six', () => {
  const letters = visibleTree('intl', ['letter']);
  const size = layoutHTree(letters);
  assert.deepEqual([size.depth, size.width, size.height], [4, 353.5, 264]);
  assert.ok(Math.abs(size.unit - 72 * Math.SQRT2) < 1e-9);
  for (const [code, x, y] of [['', 176.7, 132], ['.', 74.9, 132], ['-', 278.6, 132], ['..', 74.9, 60], ['--.-', 227.6, 240]]) {
    assert.deepEqual([letters.nodes.get(code).x, letters.nodes.get(code).y], [x, y], code);
  }
  const five = visibleTree('intl', ['letter', 'digit']);
  assert.deepEqual([layoutHTree(five).width, layoutHTree(five).height], [552, 353.5]);
  const six = visibleTree('intl', ['letter', 'digit', 'punct']);
  assert.deepEqual([layoutHTree(six).width, layoutHTree(six).height], [760.8, 552]);
});

test('H-tree matches an independent placement and keeps every node and edge 36px apart', () => {
  for (const [system, shown] of [['intl', ['letter']], ['intl', ['letter', 'digit']], ['intl', ['letter', 'digit', 'punct', 'prosign']],
    ['wabun', ['kana']], ['wabun', ['kana', 'mark', 'digit', 'symbol']]]) {
    const tree = visibleTree(system, shown);
    const size = layoutHTree(tree);
    const ref = reference(tree.depth);
    assert.ok(Math.abs(size.width - ref.width) < 0.05 && Math.abs(size.height - ref.height) < 0.05, system + shown);
    const nodes = [...tree.nodes.values()];
    for (const node of nodes) {
      const [x, y] = ref.pos.get(node.code);
      assert.ok(Math.abs(node.x - x) < 0.05 && Math.abs(node.y - y) < 0.05, node.code);
      assert.ok(node.x >= 24 - 0.05 && node.x <= size.width - 24 + 0.05 && node.y >= 24 - 0.05 && node.y <= size.height - 24 + 0.05);
      if (!node.code) continue;
      const parent = tree.nodes.get(node.code.slice(0, -1));
      const odd = node.depth % 2 === 1;
      const sign = node.code.endsWith('.') ? -1 : 1;
      // 奇数番目は左右（左＝ドット）、偶数番目は上下（上＝ドット）。
      assert.equal(Math.sign(odd ? node.x - parent.x : node.y - parent.y), sign, node.code);
      assert.ok(Math.abs(odd ? node.y - parent.y : node.x - parent.x) < 0.05, node.code);
    }
    const edges = nodes.filter(node => node.code).map(node => [node.code.slice(0, -1), node.code]);
    let nearest = Infinity;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        nearest = Math.min(nearest, Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y));
      }
      for (const [from, to] of edges) {
        if (nodes[i].code === from || nodes[i].code === to) continue;
        const a = tree.nodes.get(from);
        const b = tree.nodes.get(to);
        nearest = Math.min(nearest, segmentDistance([nodes[i].x, nodes[i].y], [a.x, a.y], [b.x, b.y]));
      }
    }
    assert.ok(nearest > 36 - 0.1, `${system} ${shown}: ${nearest}`);
  }
});

test('binary tree and H-tree draw the same node set for every selection', () => {
  for (const shown of [['letter'], ['digit'], ['letter', 'digit', 'punct'], ['prosign']]) {
    const binary = visibleTree('intl', shown);
    layoutTree(binary);
    const h = visibleTree('intl', shown);
    layoutHTree(h);
    assert.deepEqual([...h.nodes.keys()].sort(), [...binary.nodes.keys()].sort());
  }
});
