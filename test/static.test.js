import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

test('print sheet is dedicated and application adds no network clients or unsafe DOM sinks', () => {
  const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
  assert.match(css, /@media print\s*\{/);
  assert.match(css, /body > \*:not\(#printSheet\)/);
  assert.match(css, /#printSheet\[hidden\]/);
  for (const file of readdirSync(new URL('../js/', import.meta.url)).filter(f => f.endsWith('.js'))) {
    const source = readFileSync(new URL('../js/' + file, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|innerHTML|eval\s*\(/, file);
  }
});
