import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('source is readable, not minified', () => {
  for (const [file, minimum] of [['style.css', 400], ['index.html', 150], ['js/morseCodec.js', 80]]) {
    assert.ok(readFileSync(new URL('../' + file, import.meta.url), 'utf8').split('\n').length >= minimum, file);
  }
});
