import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { MESSAGES, t } from '../js/messages.js';

test('dictionary keys, substitution and pure logic source', () => {
  assert.ok(t('error.empty_text'));
  assert.throws(() => t('missing.key'));
  for (const value of Object.values(MESSAGES)) assert.ok(value.length > 0);
  assert.ok(!t('tree.outside', { n: 7 }).includes('{'));
  const ranges = [[0x3040, 0x30ff], [0x4e00, 0x9fff], [0xff01, 0xff60]];
  const pattern = new RegExp('[' + ranges.map(([a, b]) => String.fromCodePoint(a) + '-' + String.fromCodePoint(b)).join('') + ']');
  for (const file of readdirSync(new URL('../js/', import.meta.url)).filter(f => f.endsWith('.js') && f !== 'messages.js')) {
    const source = readFileSync(new URL('../js/' + file, import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '');
    assert.doesNotMatch(source, pattern, file);
    if (['morseMap.js', 'morseTree.js', 'morseCodec.js'].includes(file)) {
      assert.doesNotMatch(source, /\b(document|window|navigator|localStorage)\b/);
    }
    assert.doesNotMatch(source, /innerHTML|console\.log|Math\.random/);
    for (const match of source.matchAll(/\bt\(['"]([^'"]+)['"]\s*[,)]/g)) assert.ok(MESSAGES[match[1]], match[1]);
  }
  const dictionary = readFileSync(new URL('../js/messages.js', import.meta.url), 'utf8');
  assert.doesNotMatch(dictionary, /\b(document|window)\b/);
});
