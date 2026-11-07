import test from 'node:test';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { MORSE_TABLE, PROSIGNS } from '../js/morseMap.js';
import { WABUN_TABLE } from '../js/wabunMap.js';
import { completeTo } from '../js/morseTree.js';
import { KIND_GROUPS, kindOf, readKinds, writeKinds, buildVisibleTree } from '../js/kinds.js';

const tables = { intl: [MORSE_TABLE, PROSIGNS], wabun: [WABUN_TABLE, []] };
const visible = (system, shown) => {
  const tree = buildVisibleTree(system, shown, ...tables[system]);
  return completeTo(tree, Math.min(tree.depth, 5));
};
const hidden = tree => [...tree.nodes.values()].filter(node => node.hiddenKind).map(node => node.code).sort();

test('groups follow the table kinds, put É with punctuation and agree with the quiz pool', () => {
  assert.deepEqual(KIND_GROUPS, { intl: ['letter', 'digit', 'punct', 'prosign'], wabun: ['kana', 'mark', 'digit', 'symbol'] });
  const count = (system, list) => KIND_GROUPS[system].map(kind => list.filter(e => kindOf(e, system) === kind).length);
  assert.deepEqual(count('intl', [...MORSE_TABLE, ...PROSIGNS]), [26, 10, 19, 9]);
  assert.deepEqual(count('wabun', WABUN_TABLE), [48, 2, 10, 5]);
  assert.equal(kindOf(MORSE_TABLE.find(e => e.char === 'É'), 'intl'), 'punct');
  // 学習モードの出題範囲も同じ分け方を使う（study.js は DOM を読むので、ここでは呼び出しを確かめる）。
  assert.match(readFileSync(new URL('../js/study.js', import.meta.url), 'utf8'), /kinds\.includes\(kindOf\(e, system\)\)/);
});

test('depth follows the deepest shown character: letters 4, digits 5, punctuation and prosigns 6', () => {
  const cases = [
    ['intl', ['letter'], 4, 31], ['intl', ['letter', 'digit'], 5, 63], ['intl', ['digit'], 5, 63],
    ['intl', ['punct'], 6, 76], ['intl', ['prosign'], 6, 76], ['intl', ['letter', 'prosign'], 6, 76],
    ['intl', ['letter', 'digit', 'punct'], 6, 76], ['wabun', ['kana'], 5, 63], ['wabun', ['mark'], 5, 63],
    ['wabun', ['symbol'], 6, 67], ['wabun', ['kana', 'mark', 'digit', 'symbol'], 6, 67]
  ];
  for (const [system, shown, depth, nodes] of cases) {
    const tree = visible(system, shown);
    assert.deepEqual([tree.depth, tree.nodes.size], [depth, nodes], system + ' ' + shown);
  }
});

test('hidden characters inside the trimmed depth stay as hidden nodes; deeper ones move outside the tree', () => {
  const defaults = visible('intl', ['letter', 'digit', 'punct']);
  assert.deepEqual(hidden(defaults), ['-.-.-', '...-.', '...-.-']);
  assert.deepEqual(defaults.outside.map(e => e.char ?? e.label), ['$', 'HH', 'SOS']);
  const letters = visible('intl', ['letter']);
  assert.deepEqual(hidden(letters), []);
  assert.equal(letters.outside.length, 37);
  assert.ok(letters.outside.some(e => e.char === 'É'));
  assert.deepEqual(hidden(visible('intl', ['letter', 'digit'])),
    ['-.--.', '-.-.-', '-..-.', '-...-', '.-.-.', '.-...', '..-..', '...-.']);
  // 文字と手続き符号が同じ符号の節は、どちらかが表示なら表示する（K と <K>、+ と <AR>）。
  const prosigns = visible('intl', ['letter', 'prosign']);
  for (const code of ['-.-', '.-.-.', '-...-', '.-...', '...-.-']) assert.equal(prosigns.nodes.get(code).hiddenKind, false, code);
  assert.equal(prosigns.nodes.get('-.-.--').hiddenKind, true);
  assert.deepEqual(hidden(visible('intl', ['letter', 'digit', 'punct', 'prosign'])), []);
  assert.deepEqual(hidden(visible('wabun', ['kana', 'mark', 'digit', 'symbol'])), []);
  assert.ok(hidden(visible('wabun', ['kana'])).includes('..'));
});

test('kind choices are validated, saved per code system and survive blocked storage in the same session', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const store = new Map();
  try {
    globalThis.localStorage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) };
    assert.deepEqual(readKinds('intl'), ['letter', 'digit', 'punct']);
    assert.deepEqual(readKinds('wabun'), ['kana', 'mark', 'digit', 'symbol']);
    for (const value of ['not json', '[]', '{"intl":"letter"}', '{"intl":[]}', '{"intl":["nope"]}']) {
      store.set('morse-tree-kinds', value);
      assert.deepEqual(readKinds('intl'), ['letter', 'digit', 'punct'], value);
    }
    store.set('morse-tree-kinds', '{"intl":["prosign","letter","letter","x"]}');
    assert.deepEqual(readKinds('intl'), ['letter', 'prosign']);
    assert.equal(writeKinds('intl', []), false);
    assert.equal(writeKinds('intl', ['nope']), false);
    assert.equal(writeKinds('wabun', ['symbol', 'kana']), true);
    assert.deepEqual(readKinds('wabun'), ['kana', 'symbol']);
    assert.deepEqual(JSON.parse(store.get('morse-tree-kinds')).wabun, ['kana', 'symbol']);
    assert.throws(() => readKinds('other'), RangeError);
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('blocked'); } });
    assert.equal(writeKinds('intl', ['digit']), true);
    assert.deepEqual(readKinds('intl'), ['digit']);
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  }
});
