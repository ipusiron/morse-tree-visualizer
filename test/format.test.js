import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

test('source is readable, not minified', () => {
  for (const [file, minimum] of [['style.css', 400], ['index.html', 150], ['js/morseCodec.js', 80]]) {
    assert.ok(readFileSync(new URL('../' + file, import.meta.url), 'utf8').split('\n').length >= minimum, file);
  }
  const files = ['style.css', 'index.html', ...['js', 'test'].flatMap(dir =>
    readdirSync(new URL('../' + dir, import.meta.url)).filter(f => f.endsWith('.js')).map(f => dir + '/' + f))];
  for (const file of files) {
    const lines = readFileSync(new URL('../' + file, import.meta.url), 'utf8').split('\n');
    lines.forEach((line, i) => assert.ok(line.length <= (file === 'index.html' ? 250 : 160), `${file}:${i + 1} (${line.length})`));
  }
});
