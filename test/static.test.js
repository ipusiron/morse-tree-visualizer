import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

test('print sheet is dedicated and application adds no network clients or unsafe DOM sinks', () => {
  const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
  assert.match(css, /@media print\s*\{/);
  assert.match(css, /body > \*:not\(#printSheet\)/);
  assert.match(css, /#printSheet\[hidden\]/);
  assert.match(css, /#printSheet td\s*\{\s*padding: 0\.5mm/);
  assert.match(css, /svg:not\(\.show-prosigns\) \.prosign-extension\s*\{\s*display: none/);
  assert.match(css, /svg:not\(\.show-prosigns\) \.tree-node\.prosign-only circle\s*\{\s*r: 8px/);
  assert.match(css, /grid-template-columns: repeat\(auto-fit, minmax\(min\(100%, 32rem\), 1fr\)\)/);
  assert.match(css, /\.morse-table-group\s*\{[^}]*overflow-x: auto/);
  assert.match(css, /\.morse-table td\s*\{[^}]*overflow-wrap: normal/);
  for (const file of readdirSync(new URL('../js/', import.meta.url)).filter(f => f.endsWith('.js'))) {
    const source = readFileSync(new URL('../js/' + file, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|innerHTML|eval\s*\(/, file);
  }
});

test('notation changes render without autoplay and invalidate pending playback', () => {
  for (const name of ['encode', 'decode']) {
    const source = readFileSync(new URL('../js/' + name + '.js', import.meta.url), 'utf8');
    assert.match(source, /function convert\(autoplay = true\)/);
    assert.match(source, /if \(autoplay\) run\(\)/);
    assert.match(source, /if \(rendered\) convert\(false\)/);
  }
  const source = readFileSync(new URL('../js/utils.js', import.meta.url), 'utf8');
  assert.match(source, /notation-change', stopPlayback/);
  assert.match(source, /function stopPlayback\(\)\s*\{\s*generation\+\+/);
  assert.match(source, /async function run\(\)\s*\{\s*if \(host\.closest\('\[hidden\]'\)\) return/);
  assert.match(source, /ticket !== generation \|\| host\.closest\('\[hidden\]'\)/);
});
