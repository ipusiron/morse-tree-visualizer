import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initialSystem, readSystem, writeSystem, currentTable, initSystem, changeSystem,
  encodeCurrent, decodeCurrent, bindSystemConversion } from '../js/system.js';
import { MORSE_TABLE } from '../js/morseMap.js';
import { WABUN_TABLE, WABUN_SAMPLES } from '../js/wabunMap.js';
import { settings, el } from '../js/utils.js';
import { DICTIONARIES, setLang } from '../js/messages.js';
import { applyLanguage } from '../js/i18n.js';
import { createTreeView } from '../js/treeRenderer.js';
import { createAnimator } from '../js/animator.js';

function override(values) {
  const originals = Object.keys(values).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]);
  for (const [key, value] of Object.entries(values)) Object.defineProperty(globalThis, key, { configurable: true, value });
  return () => {
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
  };
}

test('code selection prioritizes valid URL, valid storage, then International', () => {
  let saved = null;
  const restore = override({ localStorage: {
    getItem(key) { assert.equal(key, 'morse-tree-system'); return saved; },
    setItem(key, value) { assert.equal(key, 'morse-tree-system'); saved = value; }
  } });
  try {
    for (const stored of [null, 'intl', 'wabun', 'invalid']) {
      saved = stored;
      for (const [search, expected] of [
        ['?code=wabun', 'wabun'], ['?code=intl', 'intl'], ['?code=xx', stored === 'wabun' ? 'wabun' : 'intl'],
        ['', stored === 'wabun' ? 'wabun' : 'intl'], ['?text=SOS&code=wabun', 'wabun']
      ]) assert.equal(initialSystem(search), expected);
    }
    writeSystem('wabun');
    assert.equal(readSystem(), 'wabun');
    writeSystem('invalid');
    assert.equal(readSystem(), 'wabun');
    writeSystem('intl');
    assert.equal(readSystem(), 'intl');
  } finally { restore(); }
});

test('code storage tolerates denied getters and methods', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  try {
    for (const descriptor of [
      { get() { throw new Error('blocked'); } },
      { value: { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } } }
    ]) {
      Object.defineProperty(globalThis, 'localStorage', { configurable: true, ...descriptor });
      assert.equal(readSystem(), null);
      assert.doesNotThrow(() => writeSystem('wabun'));
      assert.equal(initialSystem('?code=wabun'), 'wabun');
      assert.equal(initialSystem('?code=intl'), 'intl');
      assert.equal(initialSystem('?code=xx'), 'intl');
    }
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original); else delete globalThis.localStorage;
  }
});

test('current conversion and dictionary keys follow the selected code without changing International', () => {
  try {
    settings.system = 'wabun';
    assert.equal(currentTable(), WABUN_TABLE);
    assert.equal(encodeCurrent('がっこう', 'ascii').morse, '.-.. .. .--. ---- ..-');
    assert.equal(decodeCurrent('.-.. ..').text, 'ガ');
    assert.equal(encodeCurrent('SOS').ok, false);
    settings.system = 'intl';
    assert.equal(currentTable(), MORSE_TABLE);
    assert.equal(encodeCurrent('SOS', 'ascii').morse, '... --- ...');
    assert.equal(decodeCurrent('.-.. ..').text, 'LI');
    for (const key of Object.keys(DICTIONARIES.ja).filter(key => /^(wabun|system)\./.test(key))) {
      assert.ok(DICTIONARIES.en[key], key);
    }
  } finally { settings.system = 'intl'; }
});

// This DOM checks application state and generated nodes, not browser geometry or accessibility.
function installDOM() {
  class Element extends EventTarget {
    constructor(tag) {
      super();
      this.tagName = tag.toUpperCase();
      this.attributes = {};
      this.childNodes = [];
      this.hidden = false;
      this.scrollLeft = this.scrollTop = 0;
      this._text = '';
      this.dataset = new Proxy({}, {
        get: (_, key) => this.getAttribute('data-' + key.replace(/[A-Z]/g, c => '-' + c.toLowerCase())) ?? undefined,
        set: (_, key, value) => { this.setAttribute('data-' + key.replace(/[A-Z]/g, c => '-' + c.toLowerCase()), value); return true; }
      });
      this.classList = {
        contains: value => this.className.split(' ').includes(value),
        add: (...values) => { this.className = [...new Set([...this.className.split(' ').filter(Boolean), ...values])].join(' '); },
        remove: (...values) => { this.className = this.className.split(' ').filter(v => !values.includes(v)).join(' '); },
        toggle: (value, force) => {
          const on = force ?? !this.classList.contains(value);
          this.classList[on ? 'add' : 'remove'](value);
          return on;
        }
      };
    }
    get className() { return this.getAttribute('class') ?? ''; }
    set className(value) { this.setAttribute('class', value); }
    get children() { return this.childNodes.filter(n => n.tagName !== '#TEXT'); }
    get lastChild() { return this.childNodes.at(-1); }
    get previousElementSibling() { return this.parentElement?.children[this.parentElement.children.indexOf(this) - 1]; }
    get textContent() { return this._text + this.childNodes.map(n => n.textContent).join(''); }
    set textContent(value) { this._text = String(value); this.childNodes = []; }
    setAttribute(key, value) { this.attributes[key] = String(value); }
    getAttribute(key) { return this.attributes[key] ?? null; }
    removeAttribute(key) { delete this.attributes[key]; }
    append(...nodes) { nodes.forEach(node => { node.parentElement = this; this.childNodes.push(node); }); }
    replaceChildren(...nodes) { this._text = ''; this.childNodes = []; this.append(...nodes); }
    before(node) {
      node.parentElement = this.parentElement;
      this.parentElement.childNodes.splice(this.parentElement.childNodes.indexOf(this), 0, node);
    }
    remove() { this.parentElement?.childNodes.splice(this.parentElement.childNodes.indexOf(this), 1); }
    matches(selector) {
      if (selector === '*') return true;
      if (selector.startsWith('#')) return this.getAttribute('id') === selector.slice(1);
      if (selector.startsWith('.')) return this.classList.contains(selector.slice(1));
      if (selector.startsWith('[')) {
        const [, key, value] = selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
        return value === undefined ? this.getAttribute(key) !== null : this.getAttribute(key) === value;
      }
      return this.tagName === selector.toUpperCase();
    }
    querySelectorAll(selector) {
      const all = this.children.flatMap(node => [node, ...node.querySelectorAll('*')]);
      return all.filter(node => selector.split(',').some(part => node.matches(part.trim())));
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
    closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector) ?? null; }
  }
  const doc = new EventTarget();
  doc.documentElement = new Element('html');
  doc.body = new Element('body');
  doc.documentElement.append(doc.body);
  doc.createElement = tag => new Element(tag);
  doc.createElementNS = (_, tag) => new Element(tag);
  doc.createTextNode = text => { const node = new Element('#text'); node.textContent = text; return node; };
  doc.querySelectorAll = selector => doc.documentElement.querySelectorAll(selector);
  doc.getElementById = id => doc.documentElement.querySelector('#' + id);
  const win = new EventTarget();
  win.scrollX = win.scrollY = 0;
  win.scrollTo = () => {};
  const restore = override({ document: doc, window: win, Node: Element });
  doc.body.append(el('button', { id: 'langToggle' }));
  return { doc, win, restore() { settings.system = 'intl'; setLang('ja'); restore(); } };
}

test('code controls update labels and samples, preserve input, and reconvert only visible panels without playback', () => {
  const dom = installDOM();
  try {
    const input = el('textarea', { id: 'inputText' });
    const morse = el('textarea', { id: 'morseInput' });
    input.value = 'UNCONVERTED INPUT';
    morse.value = '.-.. ..';
    const radios = ['intl', 'wabun'].map(value => { const node = el('input', { name: 'system' }); node.value = value; return node; });
    const samples = ['SOS', 'HELLO', 'PARIS', 'HELLO WORLD'].map(value => el('button', { 'data-sample': value }, value));
    const tab = el('span', { 'data-i18n': 'tab.encode' });
    dom.doc.body.append(input, morse, tab, ...radios, ...samples);
    initSystem('?code=intl');
    const panels = [el('section'), el('section')];
    panels[1].hidden = true;
    const calls = [[], []];
    panels.forEach((panel, i) => bindSystemConversion(panel, autoplay => calls[i].push(autoplay)));
    changeSystem('wabun');
    assert.deepEqual(calls, [[false], []]);
    assert.deepEqual(radios.map(node => node.checked), [false, true]);
    assert.deepEqual(samples.map(node => node.dataset.sample), WABUN_SAMPLES);
    assert.equal(input.value, 'UNCONVERTED INPUT');
    assert.equal(morse.value, '.-.. ..');
    assert.match(input.getAttribute('placeholder'), /モールス/);
    applyLanguage('en');
    assert.match(tab.textContent, /Wabun/);
    assert.match(input.getAttribute('placeholder'), /Enter kana/);
    assert.deepEqual(calls, [[false], []]);
    panels[0].hidden = true;
    panels[1].hidden = false;
    dom.doc.dispatchEvent(new Event('tab-activated'));
    assert.deepEqual(calls, [[false], [false]]);
    changeSystem('intl');
    assert.deepEqual(calls, [[false], [false, false]]);
    assert.deepEqual(samples.map(node => node.dataset.sample), ['SOS', 'HELLO', 'PARIS', 'HELLO WORLD']);
    changeSystem('intl');
    changeSystem('invalid');
    assert.deepEqual(calls, [[false], [false, false]]);
  } finally { dom.restore(); }
});

test('all four tree views rebuild to 67 binary or 66 chart nodes with no Wabun prosigns or custom nodes', () => {
  const dom = installDOM();
  const views = [];
  try {
    for (let i = 0; i < 4; i++) {
      const host = el('div');
      dom.doc.body.append(el('div', {}, host));
      views.push(createTreeView(host, { layout: 'tree' }));
    }
    changeSystem('wabun');
    for (const view of views) {
      assert.equal(view.svg.querySelectorAll('.tree-node').length, 67);
      assert.equal(view.svg.getAttribute('viewBox'), '-50 -30 1080 470');
      assert.equal(view.svg.querySelectorAll('.custom').length, 0);
      assert.equal(view.svg.querySelectorAll('.prosign-only').length, 0);
      for (const code of ['..', '..--.']) {
        const mark = view.svg.querySelectorAll('.tree-node').find(node => node.dataset.code === code);
        assert.equal(mark.querySelector('text').getAttribute('font-size'), '20');
        assert.match(mark.querySelector('title').textContent, /濁点/);
      }
      view.setLayout('chart');
      assert.equal(view.svg.querySelectorAll('.tree-node').length, 66);
      assert.equal(view.svg.getAttribute('viewBox'), '0 0 720 920');
    }
    assert.ok(dom.doc.querySelectorAll('.check-control').every(node => node.hidden));
    applyLanguage('en');
    assert.ok(views.every(view => view.svg.textContent.includes('dakuten (voiced mark)')));
    changeSystem('intl');
    assert.ok(dom.doc.querySelectorAll('.check-control').every(node => !node.hidden));
    for (const view of views) assert.equal(view.svg.getAttribute('viewBox'), '0 0 720 808');
  } finally { views.forEach(view => view.destroy()); dom.restore(); }
});

test('system changes cancel pending playback and reset old animation events', () => {
  const source = name => readFileSync(new URL('../js/' + name + '.js', import.meta.url), 'utf8');
  assert.match(source('utils'), /system-change', \(\) => \{ stopPlayback\(\); animator.reset\(\); audio.stop\(\); \}/);
  assert.match(source('keying'), /system-change', cancel/);
  assert.ok(source('script').indexOf('initSystem(location.search)') < source('script').indexOf('parseShare(location.search)'));
  const restore = override({ matchMedia: () => ({ matches: false }), requestAnimationFrame: () => 1, cancelAnimationFrame: () => {} });
  let steps = 0;
  try {
    const animator = createAnimator({ clear() {}, highlight() {}, setCurrent() {}, scrollToCode() {} });
    animator.play([{ code: '.', ms: 100, startMs: 0 }], { onStep() { steps++; } }, { now: () => 0, stop() {} });
    assert.equal(steps, 1);
    animator.reset();
    animator.step(1);
    animator.resume();
    assert.equal(steps, 1);
    assert.equal(animator.isPlaying, false);
  } finally { restore(); }
});

