import test from 'node:test';
import assert from 'node:assert/strict';
import { PROSIGNS, PROSIGN_BY_LABEL, PROSIGN_BY_CODE } from '../js/morseMap.js';
import { encode, decode } from '../js/morseCodec.js';

test('nine procedural signs, eight ITU and one customary', () => {
  assert.deepEqual(PROSIGNS.map(p => [p.label, p.code, p.sameAs]), [
    ['AR', '.-.-.', '+'], ['SK', '...-.-', undefined], ['BT', '-...-', '='], ['KA', '-.-.-', undefined],
    ['SN', '...-.', undefined], ['HH', '........', undefined], ['K', '-.-', 'K'], ['AS', '.-...', '&'],
    ['SOS', '...---...', undefined]
  ]);
  assert.equal(PROSIGNS.filter(p => p.itu).length, 8);
  assert.deepEqual(PROSIGNS.filter(p => !p.itu).map(p => p.label), ['SOS']);
  assert.equal(PROSIGN_BY_LABEL.size, 9);
  assert.equal(PROSIGN_BY_CODE.size, 9);
});

test('procedural encode reference examples', () => {
  const examples = [
    ['CQ CQ DE JA1ABC <K>', '-.-. --.- / -.-. --.- / -.. . / .--- .- .---- .- -... -.-. -.-'],
    ['HELLO <AR>', '.... . .-.. .-.. --- .-.-.'], ['<SOS>', '...---...'],
    ['A <SK> B', '.- ...-.- -...'], ['A<BT>B', '.- -...- -...']
  ];
  for (const [input, expected] of examples) assert.equal(encode(input, 'ascii').morse, expected);
  assert.deepEqual(encode('<XX>'), { ok: false, unknownProsign: 'XX' });
  assert.deepEqual(encode('<sk>').items, [[{ char: '<SK>', code: '...-.-', prosign: 'SK' }]]);
});

test('procedural decode preserves character aliases', () => {
  const examples = [
    ['... --- ...', 'SOS'], ['...---...', '<SOS>'], ['...-.-', '<SK>'], ['.-.-.', '+'],
    ['........', '<HH>'], ['-.-.- .... ..', '<KA>HI'], ['...-. / ...-.-', '<SN> <SK>']
  ];
  for (const [input, expected] of examples) assert.equal(decode(input).text, expected);
  assert.deepEqual(decode('...-.-').words, [[{ code: '...-.-', char: '<SK>', prosign: 'SK' }]]);
});
