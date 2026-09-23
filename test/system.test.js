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
import { tableGroups, initMorseTable } from '../js/table.js';
import { formatShare, parseShare } from '../js/share.js';

test('Wabun table groups retain the 48, 2, 10, 5 entries in specified order', () => {
  const groups = tableGroups('wabun');
  assert.deepEqual(groups.map(group => [group.kind, group.entries.length]),
    [['kana', 48], ['mark', 2], ['digit', 10], ['symbol', 5]]);
  assert.deepEqual(groups.flatMap(group => group.entries), WABUN_TABLE);
  assert.equal(tableGroups('intl').flatMap(group => group.entries).length, 64);
});

test('Wabun table and print render all 65 rows and translate names in place', () => {
  const dom = installDOM();
  try {
    settings.system = 'wabun';
    const wrapper = el('div', { class: 'morse-table-wrapper' });
    const print = el('section', { id: 'printSheet' });
    dom.doc.body.append(el('section', { id: 'tab-table' }, wrapper), el('button', { id: 'printTable' }), print);
    initMorseTable();
    assert.deepEqual(wrapper.querySelectorAll('h3').map(node => node.textContent),
      ['仮名 (48)', '濁点・半濁点 (2)', '数字 (10)', '記号 (5)']);
    const rows = wrapper.querySelectorAll('[data-char]');
    const printed = print.querySelectorAll('tr');
    assert.equal(rows.length, 65);
    assert.equal(printed.length, 65);
    assert.deepEqual(rows.map(row => row.dataset.char), WABUN_TABLE.map(entry => entry.char));
    assert.equal(print.querySelector('h1').textContent, '和文モールス符号表（無線局運用規則 別表第一号）');
    assert.deepEqual(print.querySelector('.print-columns').children.map(col => col.querySelectorAll('tr').length), [33, 32]);
    assert.ok(rows.every(row => row.children.length === 3));
    applyLanguage('en');
    assert.deepEqual(wrapper.querySelectorAll('h3').map(node => node.textContent),
      ['Kana (48)', 'Voicing marks (2)', 'Digits (10)', 'Symbols (5)']);
    assert.equal(rows[0].children[2].textContent, 'i');
    assert.equal(rows[7].children[2].textContent, 'chi');
    assert.equal(rows[48].children[2].textContent, 'dakuten (voiced mark)');
    assert.equal(rows[49].children[2].textContent, 'handakuten (semi-voiced mark)');
    assert.equal(rows[60].children[2].textContent, 'Long vowel mark');
    assert.equal(print.querySelector('h1').textContent,
      'Wabun Morse code table (Radio Station Operation Regulations, Appended Table 1)');
    assert.ok(wrapper.querySelectorAll('th').filter((_, i) => i % 3 === 2).every(node => node.textContent === 'Name'));
    assert.ok(rows.every((row, i) => row === wrapper.querySelectorAll('[data-char]')[i]));
    assert.ok(printed.every((row, i) => row === print.querySelectorAll('tr')[i]));
    dom.win.dispatchEvent(new Event('beforeprint'));
    assert.equal(print.querySelectorAll('tr').length, 65);
    assert.match(print.textContent, /dakuten/);
    changeSystem('intl');
    assert.equal(wrapper.querySelectorAll('[data-char]').length, 64);
    assert.equal(print.querySelectorAll('tr').length, 64);
    assert.equal(wrapper.querySelectorAll('h3')[0].textContent, 'Letters (27)');
    changeSystem('wabun');
    assert.equal(wrapper.querySelectorAll('[data-char]').length, 65);
    assert.equal(print.querySelectorAll('tr').length, 65);
  } finally { dom.restore(); }
});

test('Wabun quiz categories and answer normalization use kana, marks, digits and symbols', async () => {
  const dom = installDOM();
  const { quizPool, normalizeQuizCharacter } = await import('../js/study.js');
  dom.restore();
  for (const [kind, count] of [['kana', 48], ['mark', 2], ['digit', 10], ['symbol', 5]]) {
    assert.equal(quizPool([kind], 'wabun').length, count);
  }
  assert.equal(quizPool([], 'wabun').length, 0);
  assert.equal(quizPool(['kana', 'mark', 'digit', 'symbol'], 'wabun').length, 65);
  assert.equal(normalizeQuizCharacter('い', 'wabun'), 'イ');
  assert.equal(normalizeQuizCharacter('゛', 'wabun'), '゛');
  assert.equal(normalizeQuizCharacter('゜', 'wabun'), '゜');
  assert.equal(normalizeQuizCharacter('(', 'wabun'), '（');
  assert.equal(normalizeQuizCharacter('a', 'intl'), 'A');
  const source = readFileSync(new URL('../js/study.js', import.meta.url), 'utf8');
  const reset = source.match(/system-change', \(\) => \{([\s\S]*?)\n  \}\)/)[1];
  for (const part of ['animator.reset()', 'renderManualOptions()', 'total = correct = streak = 0',
    'currentQuizAnswer = null', 'quizContainer.hidden = true', 'renderScope()', 'updateScore()']) assert.ok(reset.includes(part));
  assert.doesNotMatch(reset, /\.play\(|run\(|input.value =/);
});

test('keying composes only valid Wabun voicing pairs and keeps International aliases', async () => {
  const dom = installDOM();
  const { keyingCharacter, keyingText } = await import('../js/keying.js');
  dom.restore();
  assert.equal(keyingText(['.-..', '..'], 'wabun'), 'ガ');
  assert.equal(keyingText(['-...', '..--.'], 'wabun'), 'パ');
  assert.equal(keyingText(['.-.-.', '..'], 'wabun'), 'ン゛');
  assert.equal(keyingText(['.-..', '/', '..'], 'wabun'), 'カ ゛');
  assert.equal(keyingText(['..'], 'wabun'), '゛');
  assert.equal(keyingText(['.-..', '..'], 'intl'), 'LI');
  assert.equal(keyingText(['...', '---', '...'], 'intl'), 'SOS');
  assert.equal(keyingCharacter('.-.-.', 'intl'), '+');
  assert.equal(keyingCharacter('...-.-', 'wabun'), '?');
  assert.equal(keyingCharacter('...-.-', 'intl'), '<SK>');
  try {
    settings.system = 'wabun';
    assert.equal(keyingCharacter('.-'), 'イ');
    settings.system = 'intl';
    assert.equal(keyingCharacter('.-'), 'A');
  } finally { settings.system = 'intl'; }
});

test('Wabun shared text and Morse preserve bounded input and include the code selection', () => {
  for (const [kind, value] of [['text', 'モールス'], ['morse', '-..-. .--.- -.--. ---.-']]) {
    const url = formatShare(kind, value, 'wabun');
    assert.equal(new URLSearchParams(url).get('code'), 'wabun');
    assert.equal(initialSystem(url), 'wabun');
    assert.deepEqual(parseShare(url), { ok: true, kind, value });
  }
  assert.equal(formatShare('text', 'SOS', 'intl'), '?text=SOS');
  assert.equal(formatShare('morse', '... --- ...', 'intl'), '?morse=...%20---%20...');
  assert.throws(() => formatShare('text', 'モ'.repeat(1001), 'wabun'));
  assert.throws(() => formatShare('text', 'SOS', 'invalid'));
  assert.equal(parseShare('?code=wabun&text=モールス').value, 'モールス');
  assert.deepEqual(parseShare('?code=wabun&text=モ&morse=.-'), { ok: false, errorKey: 'share.both' });
});


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
    appendChild(node) { this.append(node); return node; }
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
