import test from 'node:test';
import assert from 'node:assert/strict';
import { WABUN_TABLE, WABUN_CHAR_TO_CODE, WABUN_CODE_TO_CHAR } from '../js/wabunMap.js';
import { CHAR_TO_CODE } from '../js/morseMap.js';
import { normalizeWabun, encodeWabun, decodeWabun, timeline } from '../js/morseCodec.js';
import { buildTree, completeTo, layoutTree, layoutChart } from '../js/morseTree.js';

// Transcribed from Nagisa's day025_ref4b_out.txt, not calculated from WABUN_TABLE.
const expectedTable = `
イ .- kana
ロ .-.- kana
ハ -... kana
ニ -.-. kana
ホ -.. kana
ヘ . kana
ト ..-.. kana
チ ..-. kana
リ --. kana
ヌ .... kana
ル -.--. kana
ヲ .--- kana
ワ -.- kana
カ .-.. kana
ヨ -- kana
タ -. kana
レ --- kana
ソ ---. kana
ツ .--. kana
ネ --.- kana
ナ .-. kana
ラ ... kana
ム - kana
ウ ..- kana
ヰ .-..- kana
ノ ..-- kana
オ .-... kana
ク ...- kana
ヤ .-- kana
マ -..- kana
ケ -.-- kana
フ --.. kana
コ ---- kana
エ -.--- kana
テ .-.-- kana
ア --.-- kana
サ -.-.- kana
キ -.-.. kana
ユ -..-- kana
メ -...- kana
ミ ..-.- kana
シ --.-. kana
ヱ .--.. kana
ヒ --..- kana
モ -..-. kana
セ .---. kana
ス ---.- kana
ン .-.-. kana
゛ .. mark
゜ ..--. mark
1 .---- digit
2 ..--- digit
3 ...-- digit
4 ....- digit
5 ..... digit
6 -.... digit
7 --... digit
8 ---.. digit
9 ----. digit
0 ----- digit
ー .--.- symbol
、 .-.-.- symbol
」 .-.-.. symbol
（ -.--.- symbol
） .-..-. symbol
`.trim().split('\n').map(line => line.split(' '));

test('Wabun has all 65 reference rows in order, unique codes and unchanged digits', () => {
  assert.equal(WABUN_TABLE.length, 65);
  assert.deepEqual(WABUN_TABLE.map(e => [e.char, e.code, e.kind]), expectedTable);
  assert.equal(WABUN_CHAR_TO_CODE.size, 65);
  assert.equal(WABUN_CODE_TO_CHAR.size, 65);
  assert.deepEqual(['kana', 'mark', 'digit', 'symbol'].map(kind => WABUN_TABLE.filter(e => e.kind === kind).length), [48, 2, 10, 5]);
  for (const entry of WABUN_TABLE) {
    assert.match(entry.code, /^[.-]{1,6}$/);
    assert.equal(WABUN_CHAR_TO_CODE.get(entry.char), entry.code);
    assert.equal(WABUN_CODE_TO_CHAR.get(entry.code), entry.char);
    if (entry.kind === 'digit') assert.equal(entry.code, CHAR_TO_CODE.get(entry.char));
    if (entry.kind === 'kana') assert.match(entry.romaji, /^[a-z]+$/);
    if (['mark', 'symbol'].includes(entry.kind)) assert.match(entry.name, /^wabun\./);
  }
  assert.deepEqual(['チ', 'ツ', 'フ', 'シ', 'ヰ', 'ヱ', 'ヲ'].map(char => WABUN_TABLE.find(e => e.char === char).romaji),
    ['chi', 'tsu', 'fu', 'shi', 'wi', 'we', 'wo']);
});

const conversions = [
  ['イロハ', 'イロハ', '.- .-.- -...'],
  ['モールス', 'モールス', '-..-. .--.- -.--. ---.-'],
  ['がっこう', 'カ゛ツコウ', '.-.. .. .--. ---- ..-'],
  ['パン', 'ハ゜ン', '-... ..--. .-.-.'],
  ['ヴ', 'ウ゛', '..- ..'],
  ['キャ', 'キヤ', '-.-.. .--'],
  ['サクラ　サク', 'サクラ サク', '-.-.- ...- ... / -.-.- ...-'],
  ['ﾓｰﾙｽ', 'モールス', '-..-. .--.- -.--. ---.-'],
  ['ヰヱヲ', 'ヰヱヲ', '.-..- .--.. .---'],
  ['123', '123', '.---- ..--- ...--'],
  ['（モ）', '（モ）', '-.--.- -..-. .-..-.'],
  ['(モ)', '（モ）', '-.--.- -..-. .-..-.']
];

test('Wabun normalization matches every reference and expands all small kana', () => {
  for (const [input, normalized] of conversions) assert.equal(normalizeWabun(input), normalized, input);
  assert.equal(normalizeWabun('ぁぃぅぇぉっゃゅょゎゕゖ'), 'アイウエオツヤユヨワカケ');
  assert.equal(normalizeWabun(' ｶﾞ\tﾊﾟ\nヴ '), 'カ゛ ハ゜ ウ゛');
  assert.throws(() => normalizeWabun(null), TypeError);
});

test('Wabun encoding matches all reference examples and both display notations', () => {
  for (const [input, , expected] of conversions) {
    const result = encodeWabun(input, 'ascii');
    assert.equal(result.ok, true, input);
    assert.equal(result.morse, expected, input);
    assert.equal(encodeWabun(input).morse, expected.replace(/\./g, '・').replace(/-/g, '−'));
  }
});

test('Wabun rejects ABC and the full stop without substituting a separator', () => {
  assert.deepEqual(encodeWabun('ABC'), { ok: false, unsupported: [
    { char: 'A', cp: 'U+0041' }, { char: 'B', cp: 'U+0042' }, { char: 'C', cp: 'U+0043' }
  ] });
  assert.deepEqual(encodeWabun('ア。'), { ok: false, unsupported: [{ char: '。', cp: 'U+3002' }] });
});

test('Wabun decoding matches all references and only composes valid voiced characters', () => {
  for (const [input, expected] of [
    ['.- .-.- -...', 'イロハ'], ['-..-. .--.- -.--. ---.-', 'モールス'], ['.-.. ..', 'ガ'],
    ['-... ..--.', 'パ'], ['.-.-. ..', 'ン゛'], ['-. -- / -..', 'タヨ ホ'],
    ['..', '゛'], ['..--.', '゜'], ['.-.-. ..--.', 'ン゜'], ['.-.. / ..', 'カ ゛'],
    ['..- ..', 'ヴ'], ['.- ..', 'イ゛'], ['.-.. .. ..', 'ガ゛']
  ]) assert.equal(decodeWabun(input).text, expected, input);
  assert.deepEqual(decodeWabun(''), { ok: false, empty: true });
  assert.equal(decodeWabun('...---...').ok, false);
  assert.deepEqual(decodeWabun('...---...').invalid, ['...---...']);
  assert.deepEqual(decodeWabun('.- X').unknown, [{ char: 'X', cp: 'U+0058' }]);
});

test('Wabun binary tree has 67 nodes, 33 leaves and all six reference depth groups', () => {
  const tree = completeTo(buildTree(WABUN_TABLE, 6));
  assert.equal(tree.nodes.size, 67);
  assert.equal(layoutTree(tree).leaves, 33);
  assert.equal(tree.outside.length, 0);
  assert.deepEqual([1, 2, 3, 4, 5, 6].map(depth =>
    [...tree.nodes.values()].filter(n => n.depth === depth && n.char).map(n => n.char).join('')), [
    'ヘム', 'イタ゛ヨ', 'ナホワウリラヤレ', 'ロハニチヌケヲカソツネノクマフコ',
    'トルヰオエテアサキユメミシヱヒモセスン゜1234567890ー', '、」（）'
  ]);
});

const expectedChart = `
ROOT 0 0 root
- -1 0 rect
. 1 0 circle
-- -2 0 rect
-. -1 8 circle
.- 1 7 rect
.. 2 0 circle
--- -3 0 rect
--. -2 4 circle
-.- -2 8 rect
-.. -1 12 circle
.-- 1 11 rect
.-. 2 7 circle
..- 2 3 rect
... 3 0 circle
---- -4 0 rect
---. -3 2 circle
--.- -3 4 rect
--.. -2 6 circle
-.-- -3 8 rect
-.-. -2 10 circle
-..- -2 12 rect
-... -1 14 circle
.--- 1 13 rect
.--. 2 11 circle
.-.- 2 9 rect
.-.. 3 7 circle
..-- 2 5 rect
..-. 3 3 circle
...- 3 1 rect
.... 4 0 circle
----- -5 0 rect
----. -4 1 circle
---.- -4 2 rect
---.. -3 3 circle
--.-- -4 4 rect
--.-. -3 5 circle
--..- -3 6 rect
--... -2 7 circle
-.--- -4 8 rect
-.--. -3 9 circle
-.-.- -3 10 rect
-.-.. -2 11 circle
-..-- -3 12 rect
-..-. -2 13 circle
-...- -2 14 rect
-.... -1 15 circle
.---- 1 14 rect
.---. 2 13 circle
.--.- 2 12 rect
.--.. 3 11 circle
.-.-- 2 10 rect
.-.-. 3 9 circle
.-..- 3 8 rect
.-... 4 7 circle
..--- 2 6 rect
..--. 3 5 circle
..-.- 3 4 rect
..-.. 4 3 circle
...-- 3 2 rect
....- 4 1 rect
..... 5 0 circle
-.--.- -4 9 rect
.-.-.- 3 10 rect
.-.-.. 4 9 circle
.-..-. 4 8 circle
`.trim().split('\n').map(line => {
  const [code, col, row, shape] = line.split(' ');
  return [code === 'ROOT' ? '' : code, Number(col), Number(row), shape];
});

test('Wabun chart matches all 66 reference coordinates with no node or connector collisions', () => {
  const tree = buildTree(WABUN_TABLE, 6);
  assert.deepEqual(layoutChart(tree), { minCol: -5, maxCol: 5, maxRow: 15, width: 720, height: 920 });
  assert.equal(tree.nodes.size, 66);
  const cells = new Set([...tree.nodes.values()].map(n => n.col + ',' + n.row));
  assert.equal(cells.size, 66);
  assert.equal(expectedChart.length, 66);
  for (const [code, col, row, shape] of expectedChart) {
    const node = tree.nodes.get(code);
    assert.deepEqual([node.col, node.row, node.shape], [col, row, shape], code);
    assert.deepEqual([node.x, node.y], [360 + col * 64, 40 + row * 56]);
    if (!code) continue;
    const parent = tree.nodes.get(code.slice(0, -1));
    if (parent.col === col) for (let between = parent.row + 1; between < row; between++) {
      assert.equal(cells.has(col + ',' + between), false, code);
    }
  }
});

test('Wabun uses the unchanged 1:3 tones and 1:3:7 gaps in the shared timeline', () => {
  const schedule = timeline(encodeWabun('イム ヘ', 'ascii').morse, 10);
  assert.deepEqual(schedule.events.map(e => [e.type, e.units]), [
    ['dot', 1], ['gap', 1], ['dash', 3], ['letterGap', 3], ['dash', 3], ['wordGap', 7], ['dot', 1]
  ]);
  assert.equal(schedule.totalUnits, 19);
  assert.equal(schedule.totalMs, 2280);
});
