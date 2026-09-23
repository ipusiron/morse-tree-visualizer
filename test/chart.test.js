import test from 'node:test';
import assert from 'node:assert/strict';
import { MORSE_TABLE, PROSIGNS } from '../js/morseMap.js';
import { buildTree, completeTo, layoutChart } from '../js/morseTree.js';
import { readLayout, writeLayout } from '../js/layout.js';

test('layout choice accepts only known values and survives blocked storage in the same session', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  try {
    globalThis.localStorage = { getItem: () => 'invalid', setItem() {} };
    assert.equal(readLayout(), 'tree');
    globalThis.localStorage.getItem = () => 'chart';
    assert.equal(readLayout(), 'chart');
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('blocked'); } });
    assert.equal(readLayout(), 'tree');
    writeLayout('chart');
    assert.equal(readLayout(), 'chart');
    writeLayout('invalid');
    assert.equal(readLayout(), 'tree');
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  }
});

const expected = `
ROOT 0 0 root
- -1 0 rect
. 1 0 circle
-- -2 0 rect
-. -1 7 circle
.- 1 7 rect
.. 2 0 circle
--- -3 0 rect
--. -2 4 circle
-.- -2 7 rect
-.. -1 10 circle
.-- 1 10 rect
.-. 2 7 circle
..- 2 4 rect
... 3 0 circle
---- -4 0 rect
---. -3 1 circle
--.- -3 4 rect
--.. -2 5 circle
-.-- -3 7 rect
-.-. -2 9 circle
-..- -2 10 rect
-... -1 12 circle
.--- 1 11 rect
.--. 2 10 circle
.-.- 2 9 rect
.-.. 3 7 circle
..-- 2 5 rect
..-. 3 4 circle
...- 3 2 rect
.... 4 0 circle
----- -5 0 rect
----. -4 1 circle
---.. -3 2 circle
--..- -3 5 rect
--... -2 6 circle
-.--. -3 8 circle
-.-.- -3 9 rect
-..-. -2 11 circle
-...- -2 12 rect
-.... -1 13 circle
.---- 1 12 rect
.--.- 2 11 rect
.-.-. 3 9 circle
.-..- 3 8 rect
.-... 4 7 circle
..--- 2 6 rect
..--. 3 5 circle
..-.. 4 4 circle
...-- 3 3 rect
...-. 4 2 circle
....- 4 1 rect
..... 5 0 circle
---... -3 3 circle
--..-- -4 5 rect
-.--.- -4 8 rect
-.-.-- -4 9 rect
-.-.-. -3 10 circle
-....- -2 13 rect
.----. 2 12 circle
.--.-. 3 11 circle
.-.-.- 3 10 rect
.-..-. 4 8 circle
..--.- 3 6 rect
..--.. 4 5 circle
...-.- 4 3 rect`.trim().split('\n').map(line => {
  const [code, col, row, shape] = line.trim().split(/\s+/);
  return [code === 'ROOT' ? '' : code, Number(col), Number(row), shape];
});

test('chart layout matches the 66-node reference without collisions', () => {
  const tree = buildTree(MORSE_TABLE, 6, PROSIGNS);
  assert.deepEqual(layoutChart(tree), { minCol: -5, maxCol: 5, maxRow: 13, width: 720, height: 808 });
  assert.equal(tree.nodes.size, 66);
  const cells = new Set();
  for (const current of tree.nodes.values()) {
    assert.equal(cells.has(current.col + ',' + current.row), false, current.code);
    cells.add(current.col + ',' + current.row);
  }
  for (const [code, col, row, shape] of expected) {
    const current = tree.nodes.get(code);
    assert.deepEqual([current.col, current.row, current.shape], [col, row, shape], code);
    assert.deepEqual([current.x, current.y], [360 + col * 64, 40 + row * 56], code);
    if (!code) continue;
    const parent = tree.nodes.get(code.slice(0, -1));
    if (parent.col === col) {
      for (let between = parent.row + 1; between < row; between++) {
        assert.equal(cells.has(col + ',' + between), false, `edge to ${code} crosses a node`);
      }
    }
  }
});

test('chart preserves the complete data paths without completing the tree', () => {
  const chart = buildTree(MORSE_TABLE, 6, PROSIGNS);
  layoutChart(chart);
  const binary = completeTo(buildTree(MORSE_TABLE, 6, PROSIGNS));
  const named = nodes => [...nodes.values()].filter(node => node.char || node.prosign).map(node => node.code).sort();
  assert.deepEqual(named(chart.nodes), named(binary.nodes));
  assert.equal(chart.nodes.size, 66);
});
