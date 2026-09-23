import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { readTheme, writeTheme } from '../js/theme.js';

const earlySource = readFileSync(new URL('../js/theme-early.js', import.meta.url), 'utf8');

test('early theme runs synchronously in head immediately before the stylesheet and after CSP', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
  assert.deepEqual([...head.matchAll(/<script\b[^>]*>/g)].map(match => match[0]), ['<script src="js/theme-early.js">']);
  assert.match(head, /<script src="js\/theme-early\.js"><\/script>\s*<link rel="stylesheet" href="style\.css"/);
  assert.ok(head.indexOf('Content-Security-Policy') < head.indexOf('js/theme-early.js'));
  assert.match(head, /script-src 'self';/);
});

test('early theme only applies saved light or dark and only touches the root theme attribute', () => {
  for (const value of ['light', 'dark', 'system', null, undefined, '', 'invalid', 'LIGHT', ' dark', '__proto__']) {
    let reads = 0;
    const writes = [];
    const unexpected = [];
    const dataset = new Proxy({}, {
      set(target, key, next) {
        if (key !== 'theme') unexpected.push(key);
        writes.push(next);
        target[key] = next;
        return true;
      }
    });
    const only = (key, value) => new Proxy({}, {
      get(_target, requested) {
        if (requested !== key) unexpected.push(requested);
        return requested === key ? value : undefined;
      },
      set(_target, key) { unexpected.push(key); return true; }
    });
    const document = only('documentElement', only('dataset', dataset));
    const localStorage = only('getItem', key => {
      assert.equal(key, 'morse-tree-theme');
      reads++;
      return value;
    });
    runInNewContext(earlySource, { document, localStorage }, { timeout: 1000 });
    const expected = value === 'light' || value === 'dark' ? { theme: value } : {};
    assert.deepEqual({ ...dataset }, expected);
    assert.deepEqual(writes, 'theme' in expected ? [value] : []);
    assert.equal(reads, 1);
    assert.deepEqual(unexpected, []);
  }
});

test('early theme guards every storage access and tolerates missing or denied storage', () => {
  const guarded = earlySource.match(/try\s*\{[\s\S]*?\}\s*catch\s*\{[^}]*\}/g);
  assert.equal(guarded.length, 1);
  assert.match(guarded[0], /localStorage\.getItem\('morse-tree-theme'\)/);
  assert.doesNotMatch(earlySource.replace(guarded[0], ''), /localStorage/);
  for (const kind of ['missing', 'getter', 'method']) {
    const dataset = {};
    const context = { document: { documentElement: { dataset } } };
    if (kind === 'getter') {
      Object.defineProperty(context, 'localStorage', { get() { throw new Error('denied'); } });
    } else if (kind === 'method') {
      context.localStorage = { getItem() { throw new Error('denied'); } };
    }
    assert.doesNotThrow(() => runInNewContext(earlySource, context, { timeout: 1000 }));
    assert.deepEqual(dataset, {});
  }
});

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
