import test from 'node:test';
import assert from 'node:assert/strict';
import { computeTrivia, formatTrivia, fillTriviaBody, TRIVIA_CARDS } from '../js/trivia.js';
import { readFileSync } from 'node:fs';

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
