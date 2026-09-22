import test from 'node:test';
import assert from 'node:assert/strict';
import { LETTER_FREQUENCY } from '../js/frequency.js';

test('frequency table has normalized Day018 rankings', () => {
  const entries = Object.entries(LETTER_FREQUENCY);
  assert.equal(entries.length, 26);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  assert.ok(total >= 99.5 && total <= 100.5);
  assert.equal(LETTER_FREQUENCY.E, Math.max(...Object.values(LETTER_FREQUENCY)));
  const normalized = entries.map(([char, value]) => [char, Number((value / total * 100).toFixed(1))])
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  assert.deepEqual(normalized.slice(0, 5), [['E', 12.3], ['T', 9.1], ['A', 8.1], ['O', 7.8], ['I', 6.9]]);
});
