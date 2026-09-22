import test from 'node:test';
import assert from 'node:assert/strict';
import { unitMs, timeline, pathFor, encode, farnsworthGaps, toneSchedule } from '../js/morseCodec.js';

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

test('Farnsworth reference table and PARIS 50-unit standard', () => {
  const rows = [
    [15, 15, 80, 240, 560, 0, false], [18, 18, 66.7, 200, 466.7, 0, false],
    [18, 10, 66.7, 621.1, 1449.1, 3933.3, true], [18, 5, 66.7, 1568.4, 3659.6, 9933.3, true],
    [15, 10, 80, 555.8, 1296.8, 3520, true], [15, 5, 80, 1503.2, 3507.4, 9520, true],
    [20, 10, 60, 653.7, 1525.3, 4140, true], [12, 8, 100, 694.7, 1621.1, 4400, true],
    [10, 15, 120, 360, 840, 0, false]
  ];
  const round = n => Number(n.toFixed(1));
  for (const [c, s, unit, letter, word, extra, farnsworth] of rows) {
    const g = farnsworthGaps(c, s);
    assert.deepEqual([g.unitMs, g.letterGapMs, g.wordGapMs, g.extraMs].map(round), [unit, letter, word, extra]);
    assert.equal(g.farnsworth, farnsworth);
  }
  for (const [charWpm, overallWpm] of [[18, 18], [18, 10], [18, 5], [15, 10], [20, 10]]) {
    const result = timeline('.--. .- .-. .. ...', { charWpm, overallWpm });
    assert.equal(round(result.totalMs + result.wordGapMs), round(60000 / overallWpm));
  }
  for (const code of ['... --- ...', '...', '.--. .- .-. .. ...']) {
    assert.deepEqual(timeline(code, 10), timeline(code, { charWpm: 10, overallWpm: 10 }));
    timeline(code, 10).events.forEach(e => assert.equal(e.ms, e.units * 120));
  }
  assert.equal(timeline('...', 10).totalMs, 600);
});

test('SOS tone schedule and cumulative clock offsets', () => {
  const tones = toneSchedule('... --- ...', { charWpm: 15, overallWpm: 15 });
  assert.deepEqual(tones.map(e => [e.code, e.startMs, e.endMs]), [
    ['.', 0, 80], ['..', 160, 240], ['...', 320, 400], ['-', 640, 880], ['--', 960, 1200],
    ['---', 1280, 1520], ['.', 1760, 1840], ['..', 1920, 2000], ['...', 2080, 2160]
  ]);
  assert.equal(Number(toneSchedule('... --- ...', { charWpm: 18, overallWpm: 5 }).at(-1).endMs.toFixed(1)), 4536.8);
  const result = timeline('... --- ...', { charWpm: 18, overallWpm: 5 });
  let start = 0;
  for (const event of result.events) {
    assert.equal(event.startMs, start);
    assert.equal(event.on, ['dot', 'dash'].includes(event.type));
    start += event.ms;
  }
  assert.equal(result.totalMs, start);
});
