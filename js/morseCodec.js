import { CHAR_TO_CODE, CODE_TO_CHAR, PROSIGN_BY_LABEL, PROSIGN_BY_CODE, NOTATIONS, formatCode } from './morseMap.js';

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
  requireString(text);
  if (/<[a-z]{1,3}>/i.test(text)) return encodeProsigns(text, notation);
  const { words, unsupported } = normalizeText(text);
  if (unsupported.length) return { ok: false, unsupported };
  const items = words.map(word => word.map(char => ({ char, code: CHAR_TO_CODE.get(char) })));
  const n = NOTATIONS[notation];
  const morse = items.map(word => word.map(item => formatCode(item.code, notation)).join(n.letterGap)).join(n.wordGap);
  return { ok: true, morse, items };
}

function encodeProsigns(text, notation) {
  const items = [];
  const append = words => {
    if (!words.length) return;
    if (items.length) items.at(-1).push(...words[0]);
    else items.push(words[0]);
    items.push(...words.slice(1));
  };
  // Match the specified notation: surrounding whitespace is not a word gap.
  for (const part of text.split(/(<[a-z]{1,3}>)/i).filter(Boolean)) {
    if (/^<[a-z]{1,3}>$/i.test(part)) {
      const label = part.slice(1, -1).toUpperCase();
      const p = PROSIGN_BY_LABEL.get(label);
      if (!p) return { ok: false, unknownProsign: label };
      append([[{ char: `<${label}>`, code: p.code, prosign: label }]]);
    } else {
      const result = encode(part, notation);
      if (!result.ok) return result;
      append(result.items);
    }
  }
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
  const words = canonical.split(' / ').map(word => word.split(' ').map(code => {
    const char = CODE_TO_CHAR.get(code);
    if (char !== undefined) return { code, char };
    const p = PROSIGN_BY_CODE.get(code);
    return p ? { code, char: `<${p.label}>`, prosign: p.label } : { code, char: null };
  }));
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

export function farnsworthGaps(charWpm, overallWpm) {
  const c = Number(charWpm);
  const s = Math.min(Number(overallWpm), c);
  if (![c, s].every(n => Number.isFinite(n) && n > 0)) throw new RangeError('Invalid speed');
  const unit = unitMs(c);
  if (s >= c) return { unitMs: unit, letterGapMs: 3 * unit, wordGapMs: 7 * unit, extraMs: 0, farnsworth: false };
  const extraMs = (60 * c - 37.2 * s) / (s * c) * 1000;
  return { unitMs: unit, letterGapMs: 3 * extraMs / 19, wordGapMs: 7 * extraMs / 19, extraMs, farnsworth: true };
}

export function timeline(canonical, options = 10) {
  const { charWpm = 15, overallWpm = charWpm } = typeof options === 'number'
    ? { charWpm: options, overallWpm: options } : options;
  const gaps = farnsworthGaps(charWpm, overallWpm);
  const unit = gaps.unitMs;
  const events = [];
  let cursor = 0;
  const add = (type, units, code) => {
    const ms = type === 'letterGap' ? gaps.letterGapMs : type === 'wordGap' ? gaps.wordGapMs : units * unit;
    const event = { type, units, ms, startMs: cursor, on: type === 'dot' || type === 'dash' };
    if (code !== undefined) event.code = code;
    events.push(event);
    cursor += ms;
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
  return { events, totalUnits, totalMs: cursor, ...gaps };
}

export function toneSchedule(canonical, options) {
  return timeline(canonical, options).events.filter(e => e.on).map(e => ({ startMs: e.startMs, endMs: e.startMs + e.ms, code: e.code }));
}

function requireDuration(ms, unit) {
  if (!Number.isFinite(ms) || ms < 0 || !Number.isFinite(unit) || unit <= 0) throw new RangeError('Invalid duration');
}

export function classifyPress(ms, unit) {
  requireDuration(ms, unit);
  return ms < 2 * unit ? '.' : '-';
}

export function classifyGap(ms, unit) {
  requireDuration(ms, unit);
  return ms < 2 * unit ? 'intra' : ms < 5 * unit ? 'letter' : 'word';
}

export function keyedToMorse(times, unit, { prosigns = false } = {}) {
  requireDuration(0, unit);
  if (!Array.isArray(times) || times.length % 2) throw new TypeError('Expected down/up pairs');
  times.forEach((time, i) => {
    requireDuration(time, unit);
    if (i && time < times[i - 1]) throw new RangeError('Times must be ordered');
  });
  const codes = [];
  let pending = '';
  for (let i = 0; i < times.length; i += 2) {
    if (i) {
      const gap = classifyGap(times[i] - times[i - 1], unit);
      if (gap !== 'intra') {
        codes.push(pending);
        pending = '';
        if (gap === 'word') codes.push('/');
      }
    }
    pending += classifyPress(times[i + 1] - times[i], unit);
  }
  const text = codes.map(code => code === '/' ? ' ' : CODE_TO_CHAR.get(code)
    ?? (prosigns ? PROSIGN_BY_CODE.get(code)?.label : undefined) ?? '?').join('').replace(/ +/g, ' ');
  return { codes, pending, canonical: codes.join(' '), text };
}
