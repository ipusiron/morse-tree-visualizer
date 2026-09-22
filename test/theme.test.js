import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readTheme, writeTheme } from '../js/theme.js';

test('theme storage accepts only known values and survives blocked storage', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  try {
    let value = 'dark';
    globalThis.localStorage = { getItem: () => value, setItem: (_key, next) => { value = next; } };
    assert.equal(readTheme(), 'dark');
    writeTheme('light');
    assert.equal(readTheme(), 'light');
    value = 'invalid';
    assert.equal(readTheme(), 'system');
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('blocked'); } });
    assert.equal(readTheme(), 'system');
    assert.doesNotThrow(() => writeTheme('dark'));
  } finally {
    delete globalThis.localStorage;
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
  }
  const source = readFileSync(new URL('../js/theme.js', import.meta.url), 'utf8');
  const guarded = source.match(/try\s*\{[^}]*localStorage[^}]*\}\s*catch/g);
  assert.equal(guarded.length, 2);
  assert.doesNotMatch(source.replace(/try\s*\{[^}]*\}/g, ''), /localStorage/);
});

test('light, explicit dark and system dark define identical variable sets', () => {
  const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
  const blocks = [/:root\s*\{([^}]+)\}/, /:root\[data-theme="dark"\]\s*\{([^}]+)\}/,
    /:root:not\(\[data-theme="light"\]\)\s*\{([^}]+)\}/].map(pattern => css.match(pattern)[1]);
  const variables = blocks.map(block => [...block.matchAll(/--([\w-]+):/g)].map(m => m[1]).sort());
  assert.deepEqual(variables[1], variables[0]);
  assert.deepEqual(variables[2], variables[0]);
});
