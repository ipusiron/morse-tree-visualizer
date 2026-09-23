import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('four independently named layout controls have legends and both modes', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const controls = [...html.matchAll(/<fieldset class="layout-control">([\s\S]*?)<\/fieldset>/g)].map(m => m[1]);
  assert.equal(controls.length, 4);
  const names = new Set();
  for (const control of controls) {
    assert.match(control, /<legend(?:\sdata-i18n(?:-[a-z-]+)?="[^"]*")*>木の見た目<\/legend>/);
    const inputs = [...control.matchAll(/<input type="radio" name="([^"]+)" value="([^"]+)"/g)];
    assert.deepEqual(inputs.map(m => m[2]), ['tree', 'chart']);
    assert.equal(inputs[0][1], inputs[1][1]);
    names.add(inputs[0][1]);
  }
  assert.equal(names.size, 4);
});

test('secure markup, main and nested tabs, dialog and real label targets', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /http-equiv="Content-Security-Policy"/);
  assert.doesNotMatch(html, /unsafe-inline|frame-ancestors|\sstyle\s*=|\son\w+\s*=/i);
  assert.match(html, /name="referrer" content="no-referrer"/);
  assert.match(html, /<noscript(?:\sdata-i18n(?:-[a-z-]+)?="[^"]*")*>/);
  assert.match(html, /name="color-scheme" content="light dark"/);
  for (const id of ['themeToggle', 'printSheet', 'printTable', 'encodeShare', 'decodeShare']) {
    assert.ok(html.includes(`id="${id}"`));
  }
  assert.deepEqual([...html.matchAll(/<script[^>]*>/g)].map(m => m[0]),
    ['<script src="js/theme-early.js">', '<script type="module" src="js/script.js">']);
  // Six main tabs plus two nested study tabs.
  assert.equal([...html.matchAll(/role="tablist"/g)].length, 2);
  assert.equal([...html.matchAll(/class="tab-button[^>]+role="tab"/g)].length, 6);
  assert.equal([...html.matchAll(/class="tab-content[^>]+role="tabpanel"/g)].length, 6);
  assert.equal([...html.matchAll(/role="tab"/g)].length, 8);
  assert.equal([...html.matchAll(/role="tabpanel"/g)].length, 8);
  const trivia = html.slice(html.indexOf('id="tab-trivia"'), html.indexOf('<!-- ヘルプモーダル -->'));
  assert.match(trivia, /role="tabpanel" aria-labelledby="tab-button-trivia"/);
  assert.equal([...trivia.matchAll(/class="chip"[^>]+aria-pressed="(?:true|false)"/g)].length, 8);
  assert.match(trivia, /id="triviaCount" aria-live="polite"/);
  assert.match(html, /id="helpModal"[^>]+role="dialog"[^>]+aria-modal="true"/);
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
  for (const match of html.matchAll(/\bfor="([^"]+)"/g)) assert.ok(ids.has(match[1]), match[1]);
  for (const id of ['inputText', 'startButton', 'morseInput', 'decodeButton', 'manualCharSelect', 'randomQuizBtn',
    'quizAnswer', 'checkAnswerBtn', 'tree-container', 'tree-container-decode', 'tree-container-study',
    'keyButton', 'keyingText', 'keyingToDecode', 'keyingPending', 'keyingMorse', 'encode-char-wpm', 'decode-char-wpm']) assert.ok(ids.has(id));
  const external = [...html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)];
  assert.ok(external.length > 0);
  external.forEach(m => assert.match(m[0], /rel="noopener noreferrer"/));
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
  assert.equal(pkg.type, 'module');
  assert.equal(pkg.dependencies, undefined);
  assert.equal(pkg.devDependencies, undefined);
  const workflow = readFileSync(new URL('../.github/workflows/test.yml', import.meta.url), 'utf8');
  for (const pattern of [/push/, /pull_request/, /node-version: 22/, /npm test/]) assert.match(workflow, pattern);
});

test('conversion forms share a stacked layout and tree border belongs to the scroll viewport', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
  const forms = [...html.matchAll(/<div class="input-with-button">([\s\S]*?)<\/div>/g)].map(m => m[1]);
  assert.equal(forms.length, 2);
  for (const [i, id] of ['inputText', 'morseInput'].entries()) {
    assert.ok(forms[i].indexOf('<label') < forms[i].indexOf('<textarea'));
    assert.ok(forms[i].indexOf('<textarea') < forms[i].indexOf('<button'));
    assert.ok(forms[i].includes(`id="${id}"`));
  }
  const box = css.match(/\.tree-box\s*\{([^}]+)\}/)[1];
  const wrapper = css.match(/\.tree-scroll-wrapper\s*\{([^}]+)\}/)[1];
  assert.doesNotMatch(box, /border:/);
  assert.match(box, /width: 1080px/);
  assert.match(box, /margin-inline: auto/);
  assert.match(wrapper, /border: 1px solid/);
  assert.match(wrapper, /overflow-x: auto/);
});
