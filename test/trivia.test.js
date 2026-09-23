import test from 'node:test';
import assert from 'node:assert/strict';
import { computeTrivia, formatTrivia, fillTriviaBody, TRIVIA_CARDS } from '../js/trivia.js';
import { readFileSync } from 'node:fs';
import { setLang } from '../js/messages.js';

test('trivia formats computed values and renders all 16 sourced cards without placeholders', () => {
  const values = formatTrivia();
  assert.equal(values.longForFrequency, 'O（11→5 unit）・Y（13→9 unit）');
  assert.equal(values.prefixExamples, 'A⊂J、A⊂L、A⊂P…');
  assert.equal(values.byLengthSummary, '1要素 2、2要素 4、3要素 8、4要素 12、5要素 16、6要素 12');
  assert.equal(values.savingPct, '26.0');
  assert.equal(values.huffmanBits, '4.20');
  assert.equal(TRIVIA_CARDS.length, 16);
  assert.equal(new Set(TRIVIA_CARDS.map(card => card.id)).size, 16);
  const fields = { math: 3, code: 2, crypto: 2, computer: 3, network: 3, history: 2, survival: 1 };
  for (const [field, count] of Object.entries(fields)) assert.equal(TRIVIA_CARDS.filter(card => card.field === field).length, count);
  for (const card of TRIVIA_CARDS) {
    assert.ok(card.title && Object.hasOwn(fields, card.field));
    assert.ok(card.body.length >= 2 && card.body.length <= 3);
    for (const source of [card.source, card.source.secondary].filter(Boolean)) {
      assert.ok(source.label);
      assert.match(source.url, /^https:\/\//);
    }
    if (card.action) assert.ok(['encode', 'decode', 'study', 'table', 'keying'].includes(card.action.tab));
    for (const paragraph of fillTriviaBody(card, values)) assert.doesNotMatch(paragraph, /[{}]/);
  }
  for (const [index, expected] of [[0, ['6.09', '8.23', '26.0', '5.69', 'O（11→5']],
    [1, ['56', '168']], [2, ['4.17', '4.20']], [3, ['30', '127', '64']]]) {
    const body = fillTriviaBody(TRIVIA_CARDS[index], values).join('');
    for (const value of expected) assert.ok(body.includes(value), value);
  }
  assert.throws(() => fillTriviaBody({ body: ['{unknown}'] }), /Unknown trivia value/);
});

test('shared and trivia inputs use the non-playing conversion path', () => {
  const source = readFileSync(new URL('../js/script.js', import.meta.url), 'utf8');
  assert.match(source, /applyInput\(share.kind, share.value\)/);
  assert.match(source, /dispatchEvent\(new Event\('convert-input'\)\)/);
  for (const name of ['encode', 'decode']) {
    const code = readFileSync(new URL('../js/' + name + '.js', import.meta.url), 'utf8');
    assert.match(code, /addEventListener\('convert-input', \(\) => convert\(false\)\)/);
  }
});

test('computed trivia agrees with the reference values', () => {
  const trivia = computeTrivia();
  for (const [key, value] of Object.entries({
    avgElemUniform: 3.15, avgUnitUniform: 8.23, avgElemWeighted: 2.54, avgUnitWeighted: 6.09,
    reassignedUnits: 5.69, entropyBits: 4.17, huffmanBits: 4.20
  })) assert.equal(Number(trivia[key].toFixed(2)), value, key);
  assert.equal(Number(trivia.savingPct.toFixed(1)), 26.0);
  assert.equal(Number(trivia.reassignedSavingPct.toFixed(1)), 6.6);
  assert.deepEqual(trivia.longForFrequency, [{ char: 'O', actual: 11, ideal: 5 }, { char: 'Y', actual: 13, ideal: 9 }]);
  assert.equal(trivia.fixedBits, 5);
  assert.equal(trivia.prefixPairsLetters, 56);
  assert.equal(trivia.prefixPairsAll, 168);
  assert.deepEqual(trivia.prefixExamples, ['A⊂J', 'A⊂L', 'A⊂P', 'A⊂R', 'A⊂W', 'D⊂B']);
  assert.equal(trivia.fullTreeNodes, 127);
  assert.equal(trivia.pathNodes, 64);
  assert.deepEqual(trivia.byLength.map(({ possible, used, chars }) => [possible, used, chars]), [
    [2, 2, 'ET'], [4, 4, 'AIMN'], [8, 8, 'DGKORSUW'], [16, 12, 'BCFHJLPQVXYZ'],
    [32, 16, 'É1234567890/(=+&'], [64, 12, '.,:?\'-)"@!;_']
  ]);
});

test('English trivia uses the sixteen approved titles and the same placeholders as Japanese', () => {
  assert.deepEqual(TRIVIA_CARDS.map(card => card.titleEn), [
    'E is 1 unit, O is 11', 'Dots and dashes are not enough', 'Compared with Huffman coding', '30 patterns up to length 4',
    'Walking the tree is a binary search', 'ASCII: 7 bits, braille: 6 dots, Morse: 1 to 7 elements',
    'Morse on a phone keyboard', 'QRS: send more slowly', 'Aircraft still identify stations by Morse',
    'From required to optional (2003)', '...---... was fixed in 1906', 'The first telegraph message',
    'Three short, three long, three short with lights and flags', 'Prosigns are sent without gaps',
    'A code is not a cipher', 'Ciphertext traveled in Morse'
  ]);
  const placeholders = body => [...new Set([...body.join('\n').matchAll(/\{(\w+)\}/g)].map(match => match[1]))].sort();
  for (const card of TRIVIA_CARDS) {
    assert.equal(card.bodyEn.length, card.body.length, card.id);
    assert.deepEqual(placeholders(card.bodyEn), placeholders(card.body), card.id);
    const labels = [card.source, card.source.secondary].filter(Boolean).map(source => source.labelEn);
    for (const text of [card.titleEn, ...card.bodyEn, ...labels]) {
      assert.ok(typeof text === 'string' && text.trim().length, card.id);
      assert.doesNotMatch(text, /[ぁ-んァ-ヶ一-龠]/, card.id);
    }
    const body = fillTriviaBody(card, formatTrivia(undefined, 'en'), 'en');
    for (const text of body) assert.doesNotMatch(text, /[{}ぁ-んァ-ヶ一-龠]/, card.id);
  }
  assert.throws(() => fillTriviaBody({ bodyEn: ['{unknown}'] }, {}, 'en'), /Unknown trivia value/);
});

test('English trivia formatting preserves numeric precision and reads the selected language', () => {
  const values = computeTrivia();
  const english = formatTrivia(values, 'en');
  const japanese = formatTrivia(values, 'ja');
  assert.equal(english.longForFrequency, 'O (11→5 units), Y (13→9 units)');
  assert.equal(english.prefixExamples, 'A⊂J, A⊂L, A⊂P…');
  assert.equal(english.byLengthSummary,
    '1 element: 2, 2 elements: 4, 3 elements: 8, 4 elements: 12, 5 elements: 16, 6 elements: 12');
  for (const key of Object.keys(japanese)) {
    if (!['longForFrequency', 'prefixExamples', 'byLengthSummary'].includes(key)) assert.equal(english[key], japanese[key], key);
  }
  try {
    setLang('en');
    assert.deepEqual(formatTrivia(), english);
    assert.deepEqual(fillTriviaBody(TRIVIA_CARDS[0]), fillTriviaBody(TRIVIA_CARDS[0], english, 'en'));
    setLang('ja');
    assert.deepEqual(formatTrivia(), japanese);
  } finally { setLang('ja'); }
});
