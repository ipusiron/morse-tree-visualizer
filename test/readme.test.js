import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { encode, decode, farnsworthGaps } from '../js/morseCodec.js';
import { MORSE_TABLE, PROSIGNS } from '../js/morseMap.js';
import { TRIVIA_CARDS, formatTrivia } from '../js/trivia.js';

const root = new URL('../', import.meta.url);
const readme = readFileSync(new URL('README.md', root), 'utf8');

test('README examples and punctuation table agree with the canonical data', () => {
  const examples = [...readme.matchAll(/^\| (encode|decode) \| `([^`]+)` \| `([^`]+)` \|$/gm)];
  assert.equal(examples.length, 5);
  for (const [, operation, written, expected] of examples) {
    const input = written.replace('（改行）', '\n').replace('（空白3つ）', '   ');
    const actual = operation === 'encode' ? encode(input).morse : decode(input).text;
    assert.equal(actual, expected, written);
  }
  const signs = [...readme.matchAll(/^\| (ITU|慣用) \| `([^`]+)` \| `([.-]+)` \|$/gm)];
  assert.equal(signs.length, 18);
  assert.equal(signs.filter(m => m[1] === 'ITU').length, 13);
  assert.deepEqual(signs.map(m => [m[2], m[3], m[1] === 'ITU']),
    MORSE_TABLE.filter(e => e.kind === 'punct').map(e => [e.char, e.code, e.itu]));
  for (const [kind, label] of [['letter', '英字'], ['digit', '数字'], ['punct', '記号']]) {
    assert.ok(readme.includes(label + MORSE_TABLE.filter(e => e.kind === kind).length));
  }
  assert.match(readme, /ITU 50文字と慣用5文字/);
  assert.match(readme, /## 🧪 テスト/);
  assert.doesNotMatch(readme, /リアルタイム変換/);
});

test('README metadata and image references are intact', () => {
  const yaml = readme.match(/^<!--\s*\n---\n([\s\S]*?)\n---\n-->/)[1];
  for (const key of ['category_ja', 'category_en', 'tags']) assert.match(yaml, new RegExp(key + ':\\n  - '));
  for (const expected of ['id: day025', 'slug: morse-tree-visualizer', 'hub: true',
    'repo_url: "https://github.com/ipusiron/morse-tree-visualizer"',
    'demo_url: "https://ipusiron.github.io/morse-tree-visualizer/"']) assert.ok(yaml.includes(expected));
  const images = [...readme.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map(m => m[1]).filter(p => !p.startsWith('https:'));
  assert.equal(images.length, 9);
  images.forEach(path => assert.ok(existsSync(new URL(path, root)), path));
  const pngs = readdirSync(new URL('assets/', root)).filter(f => f.endsWith('.png')).map(f => 'assets/' + f);
  assert.deepEqual(images.sort(), pngs.sort());
  for (const name of ['screenshot8.png', 'screenshot9.png']) {
    const data = readFileSync(new URL('assets/' + name, root));
    assert.deepEqual([...data.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.deepEqual([data.readUInt32BE(16), data.readUInt32BE(20)], [1280, 1100]);
    assert.ok(data.length <= 300 * 1024, name);
  }
});

test('README explains both layouts and all sourced cards with the computed values', () => {
  assert.ok(readme.includes('## 🧭 チャート型の見た目'));
  assert.ok(readme.includes('## 🔍 雑学（他の分野とのつながり）'));
  for (const card of TRIVIA_CARDS) {
    assert.ok(readme.includes(card.title), card.id);
    for (const source of [card.source, card.source.secondary].filter(Boolean)) assert.ok(readme.includes(source.url), source.url);
  }
  const values = formatTrivia();
  for (const key of ['avgElemUniform', 'avgElemWeighted', 'avgUnitUniform', 'avgUnitWeighted',
    'savingPct', 'reassignedUnits', 'reassignedSavingPct', 'entropyBits', 'huffmanBits']) {
    assert.ok(readme.includes(values[key]), key);
  }
  for (const text of ['66ノード', '64ノード', '11列×14段', '720×808px', 'layoutChart', 'computeTrivia', '5,141,270']) {
    assert.ok(readme.includes(text), text);
  }
});

test('README Farnsworth and nine prosign tables agree with executable definitions', () => {
  const timing = [...readme.matchAll(/^\| (\d+) \| (\d+) \| ([\d.]+) \| ([\d.]+) \| ([\d.]+) \|$/gm)];
  assert.equal(timing.length, 3);
  for (const [, c, s, unit, letter, word] of timing) {
    const g = farnsworthGaps(Number(c), Number(s));
    assert.deepEqual([g.unitMs, g.letterGapMs, g.wordGapMs].map(n => n.toFixed(1)), [unit, letter, word]);
  }
  const signs = [...readme.matchAll(/^\| ([A-Z]+) \| `([.-]+)` \| ([^|]+) \| (ITU|慣用) \| ([^|]+) \|$/gm)];
  assert.equal(signs.length, 9);
  assert.deepEqual(signs.map(m => [m[1], m[2], m[4] === 'ITU', m[5] === '—' ? undefined : m[5]]),
    PROSIGNS.map(p => [p.label, p.code, p.itu, p.sameAs]));
  assert.ok(readme.includes('ITU-R M.1677-1にはない'));
  assert.ok(readme.includes('76ノード'));
  assert.ok(readme.includes('64行'));
});

test('README tree contains every repository file and directory with aligned descriptions', () => {
  const tree = readme.match(/## 📁 ディレクトリー構造\s+```text\n([\s\S]*?)\n```/)[1].split('\n');
  const positions = tree.map(line => line.indexOf('#'));
  assert.ok(positions.every(n => n === positions[0] && n > 0));
  tree.forEach(line => assert.match(line, /# \S.+$/));
  const represented = new Set();
  const parents = [];
  for (const line of tree.slice(1)) {
    const match = line.match(/^(.*?)├── (\S+)|^(.*?)└── (\S+)/);
    assert.ok(match, line);
    const prefix = match[1] ?? match[3];
    const name = match[2] ?? match[4];
    const depth = prefix.length / 4;
    parents.length = depth;
    const path = [...parents, name.replace(/\/$/, '')].join('/');
    represented.add(path);
    if (name.endsWith('/')) parents.push(name.slice(0, -1));
  }
  function walk(prefix = '') {
    return readdirSync(new URL(prefix || './', root), { withFileTypes: true }).flatMap(entry => {
      if (['.git', '.claude', 'node_modules', '.DS_Store'].includes(entry.name) || entry.name.endsWith('.log')) return [];
      const path = prefix + entry.name;
      return entry.isDirectory() ? [path, ...walk(path + '/')] : [path];
    });
  }
  assert.deepEqual([...represented].sort(), walk().sort());
});

const englishReadmePath = new URL('README.en.md', root);

test('English README has every section in order, matching icons and reciprocal language links', () => {
  assert.ok(existsSync(englishReadmePath));
  const english = readFileSync(englishReadmePath, 'utf8');
  const [languageLink, ...body] = english.split('\n');
  assert.equal(languageLink, 'English · [日本語](README.md)');
  assert.ok(readme.includes('[English](README.en.md) · 日本語'));
  // Only the exact first-line language link is exempt, not arbitrary Japanese elsewhere.
  assert.doesNotMatch(body.join('\n'), /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u);
  const sections = text => [...text.matchAll(/^## (\S+) (.+)$/gm)];
  const ja = sections(readme), en = sections(english);
  assert.equal(en.length, ja.length);
  assert.deepEqual(en.map(m => m[1]), ja.map(m => m[1]));
  assert.deepEqual(en.map(m => m[2]), [
    'Demo', 'Screenshots', 'Features', 'Usage', 'Interface', 'Use cases', 'Sound and Farnsworth timing',
    'Learning by keying', 'Prosigns', 'Sharing input', 'Themes', 'Printing (save as PDF)', 'Chart view',
    'Trivia (connections to other fields)', 'Technical details', 'Security', 'Limitations', 'FAQ',
    'References', 'Tests', 'Directory structure', 'Requirements', 'License', 'About this tool'
  ]);
});

test('English README matches the Japanese file inventory, commands and external link destinations', () => {
  const english = readFileSync(englishReadmePath, 'utf8');
  const tree = text => text.match(/## 📁 [^\n]+\s+```text\n([\s\S]*?)\n```/)[1].split('\n');
  const ja = tree(readme), en = tree(english);
  assert.equal(en.length, ja.length);
  assert.deepEqual(en.map(line => line.split('#')[0]), ja.map(line => line.split('#')[0]));
  assert.ok(en.every(line => line.indexOf('#') === en[0].indexOf('#')));
  en.forEach(line => assert.match(line, /# \S.+$/));
  const commands = text => [...text.matchAll(/```bash\n([\s\S]*?)\n```/g)].map(m => m[1]);
  assert.deepEqual(commands(english), commands(readme));
  const links = text => [...new Set([...text.matchAll(/\]\((https?:[^)]+)\)/g)].map(m => m[1]))].sort();
  assert.deepEqual(links(english), links(readme));
});

test('English README references exactly nine real English PNGs with accurate size captions', () => {
  const english = readFileSync(englishReadmePath, 'utf8');
  const images = [...english.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map(m => m[1]).filter(p => !p.startsWith('https:'));
  const names = Array.from({ length: 9 }, (_, i) => `screenshot${i ? i + 1 : ''}.png`);
  assert.deepEqual(images, names.map(name => 'assets/en/' + name));
  assert.deepEqual(readdirSync(new URL('assets/en/', root)).sort(), [...names].sort());
  for (const path of images) {
    assert.ok(existsSync(new URL(path, root)), path);
    const png = readFileSync(new URL(path, root));
    assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
    assert.deepEqual([width, height], [1280, 1100]);
    assert.ok(png.length > 0 && png.length <= 300 * 1024, path);
    const caption = english.split('](' + path + ')\n')[1].split('\n')[0];
    assert.ok(caption.includes(`${width}×${height} px, ${png.length.toLocaleString('en-US')} bytes.`), path);
  }
});

test('English README examples, punctuation, Farnsworth and prosigns retain the executable values', () => {
  const english = readFileSync(englishReadmePath, 'utf8');
  const examples = [...english.matchAll(/^\| (encode|decode) \| `([^`]+)` \| `([^`]+)` \|$/gm)];
  assert.equal(examples.length, 5);
  for (const [, operation, written, expected] of examples) {
    const input = written.replace('(newline)', '\n').replace('(3 spaces)', '   ');
    assert.equal(operation === 'encode' ? encode(input).morse : decode(input).text, expected, written);
  }
  const signs = [...english.matchAll(/^\| (ITU|customary) \| `([^`]+)` \| `([.-]+)` \|$/gm)];
  assert.equal(signs.length, 18);
  assert.deepEqual(signs.map(m => [m[2], m[3], m[1] === 'ITU']),
    MORSE_TABLE.filter(e => e.kind === 'punct').map(e => [e.char, e.code, e.itu]));
  const timing = [...english.matchAll(/^\| (\d+) \| (\d+) \| ([\d.]+) \| ([\d.]+) \| ([\d.]+) \|$/gm)];
  assert.equal(timing.length, 3);
  for (const [, c, s, unit, letter, word] of timing) {
    const gaps = farnsworthGaps(Number(c), Number(s));
    assert.deepEqual([gaps.unitMs, gaps.letterGapMs, gaps.wordGapMs].map(n => n.toFixed(1)), [unit, letter, word]);
  }
  const prosigns = [...english.matchAll(/^\| ([A-Z]+) \| `([.-]+)` \| ([^|]+) \| (ITU|customary) \| ([^|]+) \|$/gm)];
  assert.equal(prosigns.length, 9);
  assert.deepEqual(prosigns.map(m => [m[1], m[2], m[4] === 'ITU', m[5] === '—' ? undefined : m[5]]),
    PROSIGNS.map(p => [p.label, p.code, p.itu, p.sameAs]));
});

test('English README documents every approved trivia title and source, computed values and sound-off defaults', () => {
  const english = readFileSync(englishReadmePath, 'utf8');
  for (const card of TRIVIA_CARDS) {
    assert.ok(english.includes(card.titleEn), card.id);
    for (const source of [card.source, card.source.secondary].filter(Boolean)) assert.ok(english.includes(source.url), source.url);
  }
  const values = formatTrivia(undefined, 'en');
  for (const key of ['avgElemUniform', 'avgElemWeighted', 'avgUnitUniform', 'avgUnitWeighted',
    'savingPct', 'reassignedUnits', 'reassignedSavingPct', 'entropyBits', 'huffmanBits']) {
    assert.ok(english.includes(values[key]), key);
  }
  assert.ok(english.includes('Default playback has sound off'));
  assert.ok(english.includes('Sound is off by default.'));
  assert.ok(english.includes('Enabling Sound alone does not create an AudioContext'));
  assert.ok(english.includes('It is silent by default too.'));
  assert.ok(english.includes('Wabun (Japanese Morse) and PNG export are not supported'));
});
