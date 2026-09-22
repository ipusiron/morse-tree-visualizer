import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MESSAGES, t } from '../js/messages.js';

test('dictionary keys, substitution and pure logic source', () => {
  assert.ok(t('error.empty_text'));
  assert.throws(() => t('missing.key'));
  for (const value of Object.values(MESSAGES)) assert.ok(value.length > 0);
  assert.ok(!t('tree.outside', { n: 7 }).includes('{'));
  const ranges = [[0x3040, 0x30ff], [0x4e00, 0x9fff], [0xff01, 0xff60]];
  const pattern = new RegExp('[' + ranges.map(([a, b]) => String.fromCodePoint(a) + '-' + String.fromCodePoint(b)).join('') + ']');
  // Only migrated modules at gate 1; expand to all JS at gate 5.
  for (const file of ['morseMap.js', 'morseTree.js', 'morseCodec.js']) {
    const source = readFileSync(new URL('../js/' + file, import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '');
    assert.doesNotMatch(source, pattern, file);
    assert.doesNotMatch(source, /\b(document|window|navigator|localStorage)\b/);
  }
});
