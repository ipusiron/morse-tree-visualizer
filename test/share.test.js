import test from 'node:test';
import assert from 'node:assert/strict';
import { parseShare, formatShare } from '../js/share.js';

test('shared input parsing, exclusivity and length limit', () => {
  for (const [search, kind, value] of [
    ['?text=SOS', 'text', 'SOS'], ['?text=HELLO%20WORLD', 'text', 'HELLO WORLD'],
    ['?morse=...%20---%20...', 'morse', '... --- ...'], ['?morse=%E3%83%BB%E2%88%92', 'morse', '\u30fb\u2212']
  ]) assert.deepEqual(parseShare(search), { ok: true, kind, value });
  assert.deepEqual(parseShare('?text=A&morse=B'), { ok: false, errorKey: 'share.both' });
  assert.deepEqual(parseShare('?tab=decode'), { ok: false, errorKey: 'share.none' });
  assert.deepEqual(parseShare('?text=' + 'A'.repeat(1001)), { ok: false, errorKey: 'share.too_long', length: 1001 });
  assert.equal(parseShare('?text=' + 'A'.repeat(1000)).ok, true);
  assert.equal(parseShare('?text=').value, '');
});

test('share formatting encodes only the supplied input', () => {
  assert.equal(formatShare('text', 'HELLO WORLD'), '?text=HELLO%20WORLD');
  assert.equal(formatShare('text', 'Hello,\nWorld!'), '?text=Hello%2C%0AWorld!');
  assert.equal(formatShare('morse', '... --- ...'), '?morse=...%20---%20...');
  assert.throws(() => formatShare('other', 'SOS'));
  assert.throws(() => formatShare('text', 'A'.repeat(1001)));
});
