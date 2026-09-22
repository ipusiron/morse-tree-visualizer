import test from 'node:test';
import assert from 'node:assert/strict';
import { MORSE_TABLE, PROSIGNS } from '../js/morseMap.js';
import { buildTree, completeTo, layoutTree } from '../js/morseTree.js';

test('procedural tree adds SK without moving existing coordinates', () => {
  const old = completeTo(buildTree());
  const tree = completeTo(buildTree(MORSE_TABLE, 6, PROSIGNS));
  layoutTree(old);
  assert.equal(layoutTree(tree).leaves, 34);
  assert.equal(tree.nodes.size, 76);
  assert.equal([...tree.nodes.values()].filter(n => n.depth === 6).length, 13);
  assert.deepEqual([tree.nodes.get('...-.-').x, tree.nodes.get('...-.-').y], [80, 414]);
  assert.equal(tree.nodes.get('...-.').x, 80);
  for (const [code, n] of old.nodes) assert.deepEqual([tree.nodes.get(code).x, tree.nodes.get(code).y], [n.x, n.y]);
  assert.deepEqual(tree.outside.map(e => e.char ?? e.label), ['$', 'HH', 'SOS']);
  for (const [code, char] of [['.-.-.', '+'], ['-...-', '='], ['.-...', '&'], ['-.-', 'K']]) {
    assert.equal(tree.nodes.get(code).char, char);
  }
});

test('75 nodes, depth distribution, empty and asymmetric nodes', () => {
  const tree = completeTo(buildTree());
  const nodes = [...tree.nodes.values()];
  assert.equal(nodes.length, 75);
  assert.deepEqual(Array.from({ length: 7 }, (_, d) => nodes.filter(n => n.depth === d).length), [1, 2, 4, 8, 16, 32, 12]);
  assert.deepEqual(tree.outside.map(e => e.char), ['$']);
  assert.equal(buildTree(MORSE_TABLE, 5).outside.length, 13);
  const empty = '--..- ..--. .-..- .--.- -.-.- ...-. ..-.- .-.-- .--.. .---. -..-- -.-.. -.--- --.-. --.-- ---.-';
  assert.deepEqual(nodes.filter(n => n.depth === 5 && !n.char).map(n => n.code).sort(), empty.split(' ').sort());
  const one = '.---- -.... ---.. .-.-. --..- -.--. .-..- .--.-';
  assert.deepEqual(nodes.filter(n => Boolean(n.left) !== Boolean(n.right)).map(n => n.code).sort(), one.split(' ').sort());
  assert.deepEqual(nodes.filter(n => n.depth === 5 && n.left && n.right).map(n => n.code).sort(), ['..--.', '-.-.-'].sort());
  assert.deepEqual(layoutTree(tree), { leaves: 34, minX: 20, maxX: 1010, maxY: 414, width: 990, height: 384 });
  for (const n of nodes.filter(n => Boolean(n.left) !== Boolean(n.right))) assert.equal(n.x, (n.left || n.right).x);
});

test('all specified coordinates and depth five/six positions', () => {
  const tree = completeTo(buildTree());
  layoutTree(tree);
  const coordinates = [
    ['', 518.75, 30], ['.', 262.8125, 94], ['-', 774.6875, 94], ['.-', 395, 158], ['..', 130.625, 158],
    ['....', 35, 286], ['.....', 20, 350], ['....-', 50, 350], ['-----', 1010, 350],
    ['.-.-.', 350, 350], ['.-.-.-', 350, 414], ['-.-.-', 695, 350], ['-.-.-.', 680, 414], ['-.-.--', 710, 414],
    ['..--.', 215, 350], ['..--..', 200, 414], ['..--.-', 230, 414], ['...-.', 80, 350], ['.-...', 290, 350],
    ['-.--.', 740, 350], ['-.--.-', 740, 414], ['.----', 500, 350], ['.----.', 500, 414],
    ['---..', 920, 350], ['---...', 920, 414], ['--..-', 830, 350], ['--..--', 830, 414], ['..-..', 140, 350]
  ];
  for (const [code, x, y] of coordinates) assert.deepEqual([tree.nodes.get(code).x, tree.nodes.get(code).y], [x, y], code);
  const byDepth = d => [...tree.nodes.values()].filter(n => n.depth === d).sort((a, b) => a.x - b.x);
  assert.deepEqual(byDepth(5).map(n => n.x), [20, 50, 80, 110, 140, 170, 215, 260, 290, 320, 350, 380, 410, 440, 470, 500,
    530, 560, 590, 620, 650, 695, 740, 770, 800, 830, 860, 890, 920, 950, 980, 1010]);
  assert.deepEqual(byDepth(6).map(n => [n.char, n.x]), [ ['?', 200], ['_', 230], ['"', 320], ['.', 350], ['@', 440],
    ["'", 500], ['-', 530], [';', 680], ['!', 710], [')', 740], [',', 830], [':', 920] ]);
});
