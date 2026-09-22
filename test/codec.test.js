import test from 'node:test';
import assert from 'node:assert/strict';
import { encode, decode, normalizeText, normalizeMorse } from '../js/morseCodec.js';
import { MORSE_TABLE } from '../js/morseMap.js';

const encodings = [
  ['SOS', '... --- ...', 1],
  ['HELLO WORLD', '.... . .-.. .-.. --- / .-- --- .-. .-.. -..', 2],
  ['hello', '.... . .-.. .-.. ---', 1],
  ['Hello,\nWorld!', '.... . .-.. .-.. --- --..-- / .-- --- .-. .-.. -.. -.-.--', 2],
  ['A   B', '.- / -...', 2], ['A\u3000B', '.- / -...', 2],
  ['\uff21\uff22\uff23 \uff11\uff12', '.- -... -.-. / .---- ..---', 2],
  ['ATTACK AT DAWN', '.- - - .- -.-. -.- / .- - / -.. .- .-- -.', 3],
  ['73', '--... ...--', 1],
  ['CQ CQ DE JA1ABC', '-.-. --.- / -.-. --.- / -.. . / .--- .- .---- .- -... -.-.', 4],
  ['E-MAIL: A@B.COM', '. -....- -- .- .. .-.. ---... / .- .--.-. -... .-.-.- -.-. --- --', 2],
  ['ß', '... ...', 1], ['é', '..-..', 1], ['A\tB', '.- / -...', 2], ['   ', '', 0]
];
for (const [input, ascii, wordCount] of encodings) {
  test(`encode ${JSON.stringify(input)}`, () => {
    assert.equal(encode(input, 'ascii').morse, ascii);
    assert.equal(encode(input).morse, ascii.replaceAll('.', '\u30fb').replaceAll('-', '\u2212'));
    assert.equal(encode(input).items.length, wordCount);
  });
}

const decodings = [
  ['\u30fb\u2212 \u30fb\u30fb\u30fb', '.- ...', 'AS'], ['.- ...', '.- ...', 'AS'],
  ['.-/...', '.- / ...', 'A S'], ['.- / ...', '.- / ...', 'A S'], ['.-|...', '.- / ...', 'A S'],
  ['.-\n...', '.- / ...', 'A S'], ['.-   ...', '.- / ...', 'A S'], ['.-  ...', '.- ...', 'AS'],
  ['. - . . .', '. - . . .', 'ETEEE'], ['\u00b7\u2212  \u2022\u2014', '.- .-', 'AA'],
  ['.-.-.- --..-- ..--..', '.-.-.- --..-- ..--..', '.,?'],
  ['\u2212\u30fb\u30fb\u2212\u30fb', '-..-.', '/'], ['  .- ', '.-', 'A'],
  ['.- ... /', '.- ...', 'AS'], ['/ .- / / ... /', '.- / ...', 'A S'],
  ['.-  ---  ...', '.- --- ...', 'AOS']
];
for (const [input, canonical, text] of decodings) {
  test(`decode ${JSON.stringify(input)}`, () => {
    assert.deepEqual(decode(input), { ok: true, text, words: decode(input).words, canonical });
  });
}

test('errors, normalization and boundaries', () => {
  assert.deepEqual(encode('A😀B').unsupported, [{ char: '😀', cp: 'U+1F600' }]);
  assert.deepEqual(encode('\u3042').unsupported, [{ char: '\u3042', cp: 'U+3042' }]);
  for (const code of ['........', '...---...', '.-.-.-.-']) {
    assert.deepEqual(decode(code).invalid, [code]);
  }
  assert.deepEqual(decode('.- .-.-.-.-').invalid, ['.-.-.-.-']);
  assert.deepEqual(decode('/'), { ok: false, empty: true });
  assert.deepEqual(decode('ab').unknown, [{ char: 'a', cp: 'U+0061' }, { char: 'b', cp: 'U+0062' }]);
  assert.deepEqual(decode('.- \uff9f').unknown, [{ char: '\uff9f', cp: 'U+FF9F' }]);
  for (const [input, words] of [['Hello,\nWorld!', ['HELLO,', 'WORLD!']], ['A\u3000B', ['A', 'B']],
    ['\uff21\uff22', ['AB']], ['ß', ['SS']]]) {
    assert.deepEqual(normalizeText(input).words.map(w => w.join('')), words);
  }
  assert.equal(normalizeMorse('\u00b7\u2212  \u2022\u2014').canonical, '.- .-');
  assert.equal(normalizeMorse('.-   ...').canonical, '.- / ...');
  assert.equal(normalizeMorse('.-  ...').canonical, '.- ...');
  assert.equal(encode('').morse, '');
  assert.equal(encode('A'.repeat(10000)).items[0].length, 10000);
  assert.equal(encode('e\u0301', 'ascii').morse, '..-..');
  for (const fn of [encode, decode, normalizeText, normalizeMorse]) {
    for (const input of [null, 12]) assert.throws(() => fn(input), TypeError);
  }
});

test('all 55 characters and four phrases round-trip', () => {
  for (const { char } of MORSE_TABLE) assert.equal(decode(encode(char, 'ascii').morse).text, char);
  for (const text of ['HELLO WORLD', 'ATTACK AT DAWN', 'CQ CQ DE JA1ABC', 'E-MAIL: A@B.COM']) {
    assert.equal(decode(encode(text).morse).text, text);
  }
});
