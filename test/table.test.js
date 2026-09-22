import test from 'node:test';
import assert from 'node:assert/strict';
import { MORSE_TABLE, CHAR_TO_CODE, CODE_TO_CHAR, formatCode } from '../js/morseMap.js';

test('55 entries, ITU order, unique codes and 5 customary signs', () => {
  assert.equal(MORSE_TABLE.length, 55);
  assert.equal(MORSE_TABLE.filter(e => e.itu).length, 50);
  assert.deepEqual(MORSE_TABLE.filter(e => !e.itu).map(e => e.char), ['!', '&', ';', '_', '$']);
  assert.equal(CODE_TO_CHAR.size, 55);
  assert.equal(CHAR_TO_CODE.size, 55);
  assert.deepEqual([0, 26, 27, 36, 37, 54].map(i => MORSE_TABLE[i].char), ['A', 'É', '1', '0', '.', '$']);
  assert.equal(CHAR_TO_CODE.get('É'), '..-..');
  for (const e of MORSE_TABLE) {
    assert.match(e.code, /^[.-]{1,7}$/);
    assert.ok(e.name);
    assert.equal(formatCode(e.code), e.code.replaceAll('.', '\u30fb').replaceAll('-', '\u2212'));
  }
  const expected = ['.-.-.-', '--..--', '---...', '..--..', '.----.', '-....-', '-..-.',
    '-.--.', '-.--.-', '.-..-.', '-...-', '.-.-.', '.--.-.'];
  assert.deepEqual(MORSE_TABLE.filter(e => e.itu && e.kind === 'punct').map(e => e.code), expected);
});
