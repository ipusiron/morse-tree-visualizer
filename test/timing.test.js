import test from 'node:test';
import assert from 'node:assert/strict';
import { unitMs, timeline, pathFor, encode } from '../js/morseCodec.js';

test('ITU signal and spacing durations', () => {
  assert.deepEqual([5, 10, 12, 15, 20, 25].map(unitMs), [240, 120, 100, 80, 60, 48]);
  const sos = timeline('... --- ...', 10);
  assert.equal(sos.events.length, 17);
  assert.equal(sos.totalUnits, 27);
  assert.equal(sos.totalMs, 3240);
  assert.deepEqual(sos.events.map(e => [e.type, e.units, e.code]), [
    ['dot', 1, '.'], ['gap', 1, undefined], ['dot', 1, '..'], ['gap', 1, undefined], ['dot', 1, '...'],
    ['letterGap', 3, undefined], ['dash', 3, '-'], ['gap', 1, undefined], ['dash', 3, '--'], ['gap', 1, undefined],
    ['dash', 3, '---'], ['letterGap', 3, undefined], ['dot', 1, '.'], ['gap', 1, undefined], ['dot', 1, '..'],
    ['gap', 1, undefined], ['dot', 1, '...']
  ]);
  for (const e of sos.events) assert.equal(e.ms, e.units * 120);
  const paris = timeline('.--. .- .-. .. ...');
  assert.equal(paris.events.length, 27);
  assert.equal(paris.totalUnits + 7, 50);
  const hello = timeline(encode('HELLO WORLD', 'ascii').morse);
  assert.equal(hello.events.length, 63);
  assert.equal(hello.totalUnits, 111);
  assert.equal(hello.totalMs, 13320);
  assert.equal(timeline('.').totalUnits, 1);
  assert.equal(timeline('.-').totalUnits, 5);
  assert.deepEqual(pathFor('.-.-.-'), ['left', 'right', 'left', 'right', 'left', 'right']);
  assert.deepEqual(pathFor('-.--.'), ['right', 'left', 'right', 'right', 'left']);
});
