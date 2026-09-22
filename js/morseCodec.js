import { CHAR_TO_CODE, CODE_TO_CHAR, NOTATIONS, formatCode } from './morseMap.js';

function requireString(value) {
  if (typeof value !== 'string') throw new TypeError('Expected a string');
}

function uniqueChars(chars) {
  return [...new Set(chars)].map(char => ({ char, cp: 'U+' + char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0') }));
}

export function normalizeText(text) {
  requireString(text);
  const normalized = text.normalize('NFKC').toUpperCase().replace(/[\s\u00a0\u3000]+/g, ' ').trim();
  const unsupported = [];
  const words = normalized ? normalized.split(' ').map(word => [...word].filter(char => {
    if (CHAR_TO_CODE.has(char)) return true;
    unsupported.push(char);
    return false;
  })) : [];
  return { words, unsupported: uniqueChars(unsupported) };
}

export function encode(text, notation = 'ja') {
  const { words, unsupported } = normalizeText(text);
  if (unsupported.length) return { ok: false, unsupported };
  const items = words.map(word => word.map(char => ({ char, code: CHAR_TO_CODE.get(char) })));
  const n = NOTATIONS[notation];
  const morse = items.map(word => word.map(item => formatCode(item.code, notation)).join(n.letterGap)).join(n.wordGap);
  return { ok: true, morse, items };
}

export function normalizeMorse(input) {
  requireString(input);
  const unknown = [];
  let normalized = '';
  for (const char of input) {
    if ('.\u30fb\u00b7\u2022\u2219\u3002'.includes(char)) normalized += '.';
    else if ('-\u2212\u2013\u2014\u2015_\u30fc\uff0d'.includes(char)) normalized += '-';
    else if ('/|\n\r'.includes(char)) normalized += '/';
    else if (' \t\u00a0\u3000'.includes(char)) normalized += ' ';
    else unknown.push(char);
  }
  normalized = normalized.replace(/ {3,}/g, '/');
  const words = normalized.split('/').map(word => word.trim().split(/ +/).filter(Boolean)).filter(word => word.length);
  return { canonical: words.map(word => word.join(' ')).join(' / '), unknown: uniqueChars(unknown) };
}

export function decode(input) {
  const { canonical, unknown } = normalizeMorse(input);
  if (unknown.length) return { ok: false, unknown };
  if (!canonical) return { ok: false, empty: true };
  const words = canonical.split(' / ').map(word => word.split(' ').map(code => ({ code, char: CODE_TO_CHAR.get(code) ?? null })));
  const invalid = [...new Set(words.flat().filter(item => item.char === null).map(item => item.code))];
  if (invalid.length) return { ok: false, invalid, words, canonical };
  return { ok: true, text: words.map(word => word.map(item => item.char).join('')).join(' '), words, canonical };
}

export function pathFor(code) {
  return [...code].map(symbol => symbol === '.' ? 'left' : 'right');
}

export function unitMs(wpm) {
  return 1200 / wpm;
}

export function timeline(canonical, wpm = 10) {
  const unit = unitMs(wpm);
  const events = [];
  const add = (type, units, code) => {
    const event = { type, units, ms: units * unit };
    if (code !== undefined) event.code = code;
    events.push(event);
  };
  if (canonical) canonical.split(' / ').forEach((word, wi) => {
    if (wi) add('wordGap', 7);
    word.split(' ').forEach((code, ci) => {
      if (ci) add('letterGap', 3);
      [...code].forEach((symbol, si) => {
        if (si) add('gap', 1);
        add(symbol === '.' ? 'dot' : 'dash', symbol === '.' ? 1 : 3, code.slice(0, si + 1));
      });
    });
  });
  const totalUnits = events.reduce((sum, event) => sum + event.units, 0);
  return { events, totalUnits, totalMs: totalUnits * unit, unitMs: unit };
}
