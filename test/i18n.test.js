import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { DICTIONARIES, MESSAGES, t, getLang, setLang } from '../js/messages.js';
import { initialLang, readLang, writeLang, setMessage, applyLanguage } from '../js/i18n.js';
import { createAnimator } from '../js/animator.js';
import { initMorseTable, formatPrintDate } from '../js/table.js';
import { el } from '../js/utils.js';
import { TRIVIA_CARDS } from '../js/trivia.js';

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
    assert.equal(t('tree.depth', { n: 3 }), 'Depth 3');
    assert.equal(t('tree.depth', { n: 1 }), 'Depth 1');
    assert.equal(t('table.name'), 'Name');
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
    assert.equal(t('tree.depth', { n: 1 }), '1符号');
    assert.equal(t('table.name'), '英語名');
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

test('all fixed HTML text and translated attributes have bilingual keys', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /<button\b[^>]*id="langToggle"[^>]*aria-label="English"[^>]*>EN<\/button>/);
  assert.match(html, /<title data-i18n="app.title">MorseTree Visualizer<\/title>/);
  assert.match(html, /<meta name="description" data-i18n="app.description"/);
  for (const [, key] of html.matchAll(/data-i18n(?:-(?:aria-label|title|placeholder|label))?="([^"]+)"/g)) {
    for (const dictionary of Object.values(DICTIONARIES)) assert.ok(Object.hasOwn(dictionary, key), key);
  }
  const japanese = /[ぁ-んァ-ヶ一-龠]/;
  const stack = [];
  const voids = new Set(['meta', 'link', 'input', 'br', 'hr', 'img']);
  // B-6: the notation radio's symbol-only label is not translated. No prose is excluded.
  const untranslatedText = new Set(['・−']);
  for (const token of html.match(/<!--[\s\S]*?-->|<[^>]+>|[^<]+/g)) {
    if (token.startsWith('<!--') || token.startsWith('<!')) continue;
    if (token.startsWith('</')) { stack.pop(); continue; }
    if (token.startsWith('<')) {
      for (const [, attr, value] of token.matchAll(/\s(aria-label|title|placeholder)="([^"]+)"/g)) {
        if (japanese.test(value)) assert.ok(token.includes(`data-i18n-${attr}="`), token);
      }
      if (!voids.has(token.match(/^<([\w-]+)/)[1])) stack.push(token);
    } else if (japanese.test(token) && !untranslatedText.has(token.trim())) {
      assert.match(stack.at(-1), /\sdata-i18n="[^"]+"/, token);
    }
  }
});

test('applyLanguage updates text, metadata and attributes without replacing interactive state', () => {
  const previous = ['document', 'window'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]);
  class Element {
    constructor(tagName) { this.tagName = tagName; this.attributes = {}; this.dataset = {}; this.scrollLeft = 0; this.scrollTop = 0; }
    setAttribute(key, value) {
      this.attributes[key] = String(value);
      if (key.startsWith('data-')) this.dataset[key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = String(value);
    }
    getAttribute(key) { return this.attributes[key] ?? null; }
    removeAttribute(key) {
      delete this.attributes[key];
      if (key === 'data-i18n') delete this.dataset.i18n;
      if (key === 'data-i18n-params') delete this.dataset.i18nParams;
    }
  }
  const heading = new Element('H3');
  const error = new Element('P');
  const meta = new Element('META');
  const input = new Element('TEXTAREA');
  const button = new Element('BUTTON');
  const tree = new Element('DIV');
  const details = new Element('DETAILS');
  const nodes = [heading, error, meta, input, button, tree, details];
  const doc = new EventTarget();
  doc.documentElement = { lang: 'ja' };
  doc.querySelectorAll = selector => selector === '*' ? nodes : nodes.filter(node => node.getAttribute(selector.slice(1, -1)) !== null);
  doc.getElementById = id => { assert.equal(id, 'langToggle'); return button; };
  const win = { scrollX: 2, scrollY: 90, scrollTo({ left, top }) { this.scrollX = left; this.scrollY = top; } };
  Object.defineProperty(globalThis, 'document', { configurable: true, value: doc });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: win });
  try {
    setLang('ja');
    setMessage(heading, 'result.details');
    setMessage(error, 'error.invalid_codes', { list: '------' });
    meta.setAttribute('data-i18n', 'app.description');
    input.setAttribute('data-i18n-placeholder', 'encode.placeholder');
    input.value = 'UNCONVERTED INPUT';
    input.selectionStart = 4;
    tree.highlight = ['.', '..', '...'];
    tree.scrollLeft = 170;
    tree.scrollTop = 12;
    details.open = true;
    let events = 0;
    doc.addEventListener('language-change', () => { events++; tree.scrollLeft = 0; win.scrollY = 0; });
    applyLanguage('en');
    assert.equal(doc.documentElement.lang, 'en');
    assert.equal(heading.textContent, 'Show details');
    assert.equal(error.textContent, '⚠ These Morse codes have no corresponding character: ------');
    assert.equal(meta.getAttribute('content'), DICTIONARIES.en['app.description']);
    assert.equal(input.getAttribute('placeholder'), 'Enter HELLO, for example');
    assert.equal(button.textContent, 'JA');
    // B-2 explicitly requires the target language name in its own script.
    assert.equal(button.getAttribute('aria-label'), '日本語');
    assert.equal(input.value, 'UNCONVERTED INPUT');
    assert.equal(input.selectionStart, 4);
    assert.equal(details.open, true);
    assert.deepEqual(tree.highlight, ['.', '..', '...']);
    assert.deepEqual([tree.scrollLeft, tree.scrollTop, win.scrollX, win.scrollY], [170, 12, 2, 90]);
    setMessage(error, null);
    applyLanguage('ja');
    assert.equal(error.textContent, '');
    assert.equal(button.textContent, 'EN');
    assert.equal(events, 2);
  } finally {
    setLang('ja');
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
  }
});

test('language stop halts animation and its clock without clearing the highlighted path', () => {
  const saved = ['matchMedia', 'requestAnimationFrame', 'cancelAnimationFrame'].map(key => [key, globalThis[key]]);
  globalThis.matchMedia = () => ({ matches: false });
  globalThis.requestAnimationFrame = () => 1;
  globalThis.cancelAnimationFrame = () => {};
  let clears = 0;
  let pauses = 0;
  let stops = 0;
  const lit = new Set();
  try {
    const view = { clear() { clears++; lit.clear(); }, highlight(code) { lit.add(code); }, setCurrent() {}, scrollToCode() {} };
    const animator = createAnimator(view);
    animator.play([{ code: '.', ms: 100, startMs: 0 }], {}, {
      now: () => 0, pause() { pauses++; }, stop() { stops++; }
    });
    assert.equal(animator.isPlaying, true);
    const before = clears;
    animator.stop({ preserveView: true });
    assert.equal(animator.isPlaying, false);
    assert.equal(clears, before);
    assert.deepEqual([...lit], ['.']);
    assert.equal(pauses, 1);
    assert.equal(stops, 1);
    animator.stop();
    assert.equal(lit.size, 0);
  } finally {
    for (const [key, value] of saved) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value; }
  }
});

test('language events invalidate pending audio and do not restart conversions or change notation', () => {
  const read = name => readFileSync(new URL('../js/' + name + '.js', import.meta.url), 'utf8');
  const utils = read('utils');
  assert.match(utils, /language-change', \(\) => \{\s*generation\+\+;\s*animator.stop\(\{ preserveView: true \}\);\s*audio.stop\(\)/);
  assert.match(read('keying'), /language-change', \(\) => cancel\(\{ preserveView: true \}\)/);
  const script = read('script');
  assert.match(script, /initialLang\(location.search, navigator.language\)/);
  assert.match(script, /settings.notation = lang === 'en' \? 'ascii' : 'ja'/);
  const toggle = script.match(/getElementById\('langToggle'\).addEventListener\('click', \(\) => \{([\s\S]*?)\}\)/)[1];
  assert.doesNotMatch(toggle, /notation|convert|play\(/);
  const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
  assert.match(css, /#themeToggle, #langToggle\s*\{\s*min-width: 44px;\s*min-height: 44px/);
  assert.match(css, /\.wpm-control\s*\{[^}]*flex-wrap: wrap/);
});

test('print dates use local calendar dates in English and retain Japanese formatting', () => {
  const date = new Date(2026, 0, 2, 0, 5);
  assert.equal(formatPrintDate(date, 'en'), '2026-01-02');
  assert.equal(formatPrintDate(date, 'ja'), date.toLocaleDateString('ja-JP'));
  try {
    setLang('en');
    assert.equal(formatPrintDate(date), '2026-01-02');
  } finally { setLang('ja'); }
});

// Minimal DOM for exercising the real table/card renderers; this is not a browser layout test.
function installRenderDOM() {
  const previous = ['document', 'window', 'Node'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]);
  class Element extends EventTarget {
    constructor(tagName) {
      super();
      this.tagName = tagName.toUpperCase();
      this.attributes = {};
      this.dataset = {};
      this.childNodes = [];
      this._text = '';
      this.hidden = false;
      this.scrollTop = 0;
      this.scrollLeft = 0;
    }
    get children() { return this.childNodes.filter(node => node.tagName !== '#TEXT'); }
    get lastChild() { return this.childNodes.at(-1); }
    get textContent() { return this._text + this.childNodes.map(node => node.textContent).join(''); }
    set textContent(value) { this._text = String(value); this.childNodes = []; }
    setAttribute(key, value) {
      this.attributes[key] = String(value);
      if (key.startsWith('data-')) this.dataset[key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = String(value);
    }
    getAttribute(key) { return this.attributes[key] ?? null; }
    removeAttribute(key) { delete this.attributes[key]; }
    append(...nodes) { this.childNodes.push(...nodes); }
    appendChild(node) { this.append(node); return node; }
    replaceChildren(...nodes) { this._text = ''; this.childNodes = [...nodes]; }
    querySelectorAll(selector) {
      const descendants = this.children.flatMap(node => [node, ...node.querySelectorAll('*')]);
      return descendants.filter(node => {
        if (selector === '*') return true;
        if (selector.startsWith('#')) return node.getAttribute('id') === selector.slice(1);
        if (selector.startsWith('.')) return (node.getAttribute('class') || '').split(' ').includes(selector.slice(1));
        if (selector.startsWith('[')) {
          const [, key, value] = selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
          return value === undefined ? node.getAttribute(key) !== null : node.getAttribute(key) === value;
        }
        return node.tagName === selector.toUpperCase();
      });
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
  }
  const doc = new EventTarget();
  doc.documentElement = new Element('html');
  doc.body = new Element('body');
  doc.documentElement.append(doc.body);
  doc.createElement = tag => new Element(tag);
  doc.createTextNode = text => { const node = new Element('#text'); node.textContent = text; return node; };
  doc.querySelectorAll = selector => doc.documentElement.querySelectorAll(selector);
  doc.getElementById = id => doc.documentElement.querySelector('#' + id);
  const win = new EventTarget();
  win.scrollX = 0;
  win.scrollY = 0;
  win.scrollTo = ({ left, top }) => { win.scrollX = left; win.scrollY = top; };
  let prints = 0;
  win.print = () => { prints++; };
  for (const [key, value] of [['document', doc], ['window', win], ['Node', Element]]) {
    Object.defineProperty(globalThis, key, { configurable: true, value });
  }
  doc.body.append(el('button', { id: 'langToggle' }));
  return { doc, win, get prints() { return prints; }, restore() {
    setLang('ja');
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
  } };
}

test('table and print labels switch in place with 64 unchanged rows, focus and scroll preserved', () => {
  const dom = installRenderDOM();
  try {
    setLang('ja');
    const wrapper = el('div', { class: 'morse-table-wrapper' });
    const print = el('section', { id: 'printSheet' });
    dom.doc.body.append(el('section', { id: 'tab-table' }, wrapper), el('button', { id: 'printTable' }), print);
    initMorseTable();
    const groups = wrapper.querySelectorAll('.morse-table-group');
    const rows = wrapper.querySelectorAll('[data-char]');
    const printRows = print.querySelectorAll('tr');
    const codes = rows.map(row => row.children[1].textContent);
    assert.equal(rows.length, 64);
    assert.equal(printRows.length, 64);
    dom.doc.activeElement = groups[2];
    groups[2].scrollLeft = 130;
    applyLanguage('en');
    assert.doesNotMatch(wrapper.textContent + print.textContent, /[ぁ-んァ-ヶ一-龠]/);
    assert.deepEqual(wrapper.querySelectorAll('h3').map(node => node.textContent),
      ['Letters (27)', 'Digits (10)', 'Punctuation (18)', 'Prosigns (9)']);
    assert.match(wrapper.textContent, /Same code as the ITU Wait prosign/);
    assert.match(wrapper.textContent, /End of transmission \(same code as \+\)/);
    assert.match(dom.doc.getElementById('printDate').textContent, /^Generated \d{4}-\d{2}-\d{2}$/);
    rows.forEach((row, i) => assert.equal(wrapper.querySelectorAll('[data-char]')[i], row));
    printRows.forEach((row, i) => assert.equal(print.querySelectorAll('tr')[i], row));
    assert.deepEqual(rows.map(row => row.children[1].textContent), codes);
    assert.equal(groups[2].scrollLeft, 130);
    assert.equal(dom.doc.activeElement, groups[2]);
    assert.equal(dom.prints, 0);
    dom.win.dispatchEvent(new Event('beforeprint'));
    assert.equal(print.querySelectorAll('tr').length, 64);
    assert.doesNotMatch(print.textContent, /[ぁ-んァ-ヶ一-龠]/);
    applyLanguage('ja');
    assert.match(wrapper.textContent, /手続き符号 \(9\)/);
  } finally { dom.restore(); }
});

test('all trivia cards switch in place without resetting the selected field, links or buttons', async () => {
  const dom = installRenderDOM();
  try {
    setLang('ja');
    const grid = el('div', { class: 'trivia-grid' });
    const chips = ['all', 'math', 'code', 'crypto', 'computer', 'network', 'history', 'survival'].map(field =>
      el('button', { class: 'chip', 'data-field': field, 'data-i18n': 'trivia.' + field }, t('trivia.' + field)));
    const panel = el('section', { id: 'tab-trivia' }, [grid, ...chips, el('p', { id: 'triviaCount' })]);
    dom.doc.body.append(panel);
    const { initTriviaTab } = await import('../js/script.js');
    initTriviaTab();
    const cards = grid.querySelectorAll('article');
    const links = grid.querySelectorAll('a');
    const buttons = grid.querySelectorAll('button');
    assert.equal(cards.length, 16);
    assert.equal(links.length, 20);
    assert.equal(buttons.length, 14);
    chips[1].dispatchEvent(new Event('click'));
    dom.doc.activeElement = chips[1];
    grid.scrollTop = 85;
    applyLanguage('en');
    assert.doesNotMatch(panel.textContent, /[ぁ-んァ-ヶ一-龠]/);
    assert.deepEqual(grid.querySelectorAll('h3').map(node => node.textContent), TRIVIA_CARDS.map(card => card.titleEn));
    assert.equal(dom.doc.getElementById('triviaCount').textContent, 'Math: 3 cards');
    assert.equal(cards.filter(card => !card.hidden).length, 3);
    assert.equal(chips[1].getAttribute('aria-pressed'), 'true');
    assert.equal(dom.doc.activeElement, chips[1]);
    assert.equal(grid.scrollTop, 85);
    cards.forEach((card, i) => assert.equal(grid.querySelectorAll('article')[i], card));
    links.forEach((link, i) => assert.equal(grid.querySelectorAll('a')[i], link));
    buttons.forEach((button, i) => assert.equal(grid.querySelectorAll('button')[i], button));
    assert.match(cards[0].textContent, /6\.09/);
    assert.match(cards[0].textContent, /The 2 letters/);
    applyLanguage('ja');
    assert.equal(dom.doc.getElementById('triviaCount').textContent, '数学：3枚');
    assert.equal(cards.filter(card => !card.hidden).length, 3);
  } finally { dom.restore(); }
});
