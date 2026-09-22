import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { encode, decode } from '../js/morseCodec.js';
import { MORSE_TABLE } from '../js/morseMap.js';

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
  assert.equal(images.length, 4);
  images.forEach(path => assert.ok(existsSync(new URL(path, root)), path));
  const pngs = readdirSync(new URL('assets/', root)).filter(f => f.endsWith('.png')).map(f => 'assets/' + f);
  assert.deepEqual(images.sort(), pngs.sort());
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
