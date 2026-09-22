import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyPress, classifyGap, keyedToMorse } from '../js/morseCodec.js';

function timesFor(codes, dot = 80, dash = 240, intra = 80, letter = 240, word = 560) {
  const times = [];
  let cursor = 0;
  codes.split(' / ').forEach((group, wi) => {
    if (wi) cursor += word;
    group.split(' ').forEach((code, ci) => {
      if (ci) cursor += letter;
      [...code].forEach((symbol, si) => {
        if (si) cursor += intra;
        times.push(cursor);
        cursor += symbol === '.' ? dot : dash;
        times.push(cursor);
      });
    });
  });
  return times;
}

test('press and gap boundary values', () => {
  for (const ms of [40, 80, 120, 159, 159.9]) assert.equal(classifyPress(ms, 80), '.');
  for (const ms of [160, 240, 400]) assert.equal(classifyPress(ms, 80), '-');
  for (const ms of [40, 100, 159, 159.9]) assert.equal(classifyGap(ms, 80), 'intra');
  for (const ms of [160, 240, 399]) assert.equal(classifyGap(ms, 80), 'letter');
  for (const ms of [400, 560, 1000]) assert.equal(classifyGap(ms, 80), 'word');
});

test('ideal, irregular and procedural keying keep the last letter pending', () => {
  const times = timesFor('... --- ... / .');
  const before = [...times];
  assert.deepEqual(keyedToMorse(times, 80), {
    codes: ['...', '---', '...', '/'], pending: '.', canonical: '... --- ... /', text: 'SOS '
  });
  assert.deepEqual(times, before);
  const irregular = keyedToMorse(timesFor('... --- ...', 100, 200, 90, 300), 80);
  assert.deepEqual(irregular.codes, ['...', '---']);
  assert.equal(irregular.pending, '...');
  const sk = keyedToMorse(timesFor('...-.- .'), 80, { prosigns: true });
  assert.deepEqual(sk.codes, ['...-.-']);
  assert.equal(sk.text, 'SK');
  assert.equal(keyedToMorse(timesFor('...-.- .'), 80).text, '?');
  assert.deepEqual(keyedToMorse([], 80), { codes: [], pending: '', canonical: '', text: '' });
});

test('invalid durations and time arrays are rejected', () => {
  for (const fn of [classifyPress, classifyGap]) {
    assert.throws(() => fn(-1, 80));
    assert.throws(() => fn(1, 0));
    assert.throws(() => fn(NaN, 80));
  }
  for (const times of [[0], [-1, 10], [10, 5], [0, 80, 40, 120], null]) {
    assert.throws(() => keyedToMorse(times, 80));
  }
});
