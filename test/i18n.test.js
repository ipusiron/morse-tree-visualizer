import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { DICTIONARIES, MESSAGES, t, getLang, setLang } from '../js/messages.js';
import { initialLang, readLang, writeLang } from '../js/i18n.js';

const placeholders = text => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();

test('JA and EN dictionaries have matching nonempty keys and parameters, with no Japanese in EN', () => {
  assert.equal(DICTIONARIES.ja, MESSAGES);
  assert.deepEqual(Object.keys(DICTIONARIES.en).sort(), Object.keys(MESSAGES).sort());
  for (const [key, value] of Object.entries(DICTIONARIES.en)) {
    assert.ok(value.trim(), key);
    assert.doesNotMatch(value, /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u, key);
    assert.deepEqual(placeholders(value), placeholders(MESSAGES[key]), key);
  }
  for (const file of readdirSync(new URL('../js/', import.meta.url)).filter(name => name.endsWith('.js'))) {
    const source = readFileSync(new URL('../js/' + file, import.meta.url), 'utf8');
    for (const [, key] of source.matchAll(/\bt\(['"]([^'"]+)['"]\s*[,)]/g)) {
      for (const dictionary of Object.values(DICTIONARIES)) assert.ok(Object.hasOwn(dictionary, key), `${file}: ${key}`);
    }
  }
});

test('t switches language, interpolates and rejects invalid keys, parameters and languages', () => {
  try {
    setLang('en');
    assert.equal(getLang(), 'en');
    assert.equal(t('layout.tree'), 'Binary tree');
    assert.equal(t('tree.depth', { n: 3 }), '3 elements');
    assert.throws(() => t('unknown'));
    assert.throws(() => t('tree.depth'));
    assert.throws(() => setLang('xx'), RangeError);
    assert.equal(getLang(), 'en');
    const previous = DICTIONARIES.en['layout.tree'];
    try {
      delete DICTIONARIES.en['layout.tree'];
      assert.throws(() => t('layout.tree'), /Unknown message/);
    } finally { DICTIONARIES.en['layout.tree'] = previous; }
    setLang('ja');
    assert.equal(t('layout.tree'), MESSAGES['layout.tree']);
  } finally { setLang('ja'); }
});

test('initial language prioritizes a valid URL over storage, then navigator', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  let saved = null;
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: key => key === 'morse-tree-lang' ? saved : null,
    setItem: (key, value) => { assert.equal(key, 'morse-tree-lang'); saved = value; }
  } });
  try {
    for (const [search, nav, expected] of [
      ['?lang=en', 'ja-JP', 'en'], ['?lang=ja', 'en-US', 'ja'], ['', 'ja', 'ja'], ['', 'fr-FR', 'en'],
      ['?lang=xx', 'ja-JP', 'ja'], ['?lang=xx', 'fr-FR', 'en'], ['?text=SOS&lang=en', 'ja', 'en']
    ]) assert.equal(initialLang(search, nav), expected);
    writeLang('en');
    assert.equal(readLang(), 'en');
    assert.equal(initialLang('', 'ja'), 'en');
    assert.equal(initialLang('?lang=ja', 'en'), 'ja');
    assert.equal(initialLang('?lang=xx', 'ja'), 'en');
    writeLang('xx');
    assert.equal(readLang(), 'en');
    saved = 'invalid';
    assert.equal(readLang(), null);
    assert.equal(initialLang('', 'ja-JP'), 'ja');
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  }
});

test('language storage is optional, including throwing accessors', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  try {
    for (const descriptor of [
      { get() { throw new Error('blocked'); } },
      { value: { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } } }
    ]) {
      Object.defineProperty(globalThis, 'localStorage', { configurable: true, ...descriptor });
      assert.equal(readLang(), null);
      assert.doesNotThrow(() => writeLang('en'));
      assert.equal(initialLang('?lang=en', 'ja'), 'en');
      assert.equal(initialLang('', 'ja'), 'ja');
      assert.equal(initialLang('', 'en'), 'en');
    }
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  }
});
