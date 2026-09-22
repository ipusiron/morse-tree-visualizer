import test from 'node:test';
import assert from 'node:assert/strict';
import { computeTrivia } from '../js/trivia.js';

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
