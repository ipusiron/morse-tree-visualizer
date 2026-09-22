import { MORSE_TABLE, formatCode } from './morseMap.js';
import { timeline } from './morseCodec.js';
import { t } from './messages.js';

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  for (const child of [children].flat()) node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  return node;
}

export const settings = { notation: 'ja', wpm: 10 };

export function bindSettings() {
  document.querySelectorAll('input[name="notation"]').forEach(input => input.addEventListener('change', () => {
    settings.notation = input.value;
    document.dispatchEvent(new Event('notation-change'));
  }));
}

export function describeChars(items) {
  return items.map(({ char, cp }) => `${char}(${cp})`).join(', ');
}

export async function copyText(text, status) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);
    status.textContent = t('copy.done');
  } catch {
    const field = el('textarea', { class: 'clipboard-fallback', 'aria-label': t('copy.button') });
    field.value = text;
    document.body.append(field);
    field.select();
    try {
      status.textContent = t(document.execCommand('copy') ? 'copy.done' : 'copy.failed');
    } catch {
      status.textContent = t('copy.failed');
    } finally {
      field.remove();
    }
  }
}

export function renderResult(container, words, output, mode) {
  container.replaceChildren();
  const copy = el('button', { type: 'button', class: 'copy-button' }, t('copy.button'));
  const status = el('p', { role: 'status' });
  copy.addEventListener('click', () => copyText(output, status));
  const box = el('div', { class: mode === 'encode' ? 'morse-result-container' : 'decode-result-container' });
  box.append(el('h3', {}, t(mode === 'encode' ? 'result.morse_heading' : 'result.text_heading')),
    el('output', { class: mode === 'encode' ? 'morse-code-display' : 'decoded-text-display', 'aria-live': 'polite' }, output), copy, status);
  const table = el('table', { class: mode === 'encode' ? 'morse-encode-table' : 'morse-decode-table' });
  const head = el('tr');
  const headings = mode === 'encode' ? ['table.char', 'table.code'] : ['table.code', 'table.char'];
  for (const key of [...headings, 'table.kind', 'table.note']) head.append(el('th', { scope: 'col' }, t(key)));
  table.append(el('thead', {}, head));
  const body = el('tbody');
  const rows = [];
  words.forEach((word, wi) => {
    if (wi) body.append(el('tr', { class: 'word-gap' }, [el('td', {}, t('table.word_gap')), el('td', { colspan: 3 }, '/')]));
    word.forEach(({ char, code }) => {
      const entry = MORSE_TABLE.find(e => e.char === char);
      const row = el('tr', { 'data-char': char }, [el('td', {}, char), el('td', {}, formatCode(code, settings.notation)),
        el('td', {}, t(entry.itu ? 'table.itu' : 'table.custom')),
        el('td', {}, code.length > 6 ? t('tree.outside', { n: code.length }) : '')]);
      if (mode === 'decode') row.prepend(row.children[1]);
      body.append(row);
      rows.push(row);
    });
  });
  table.append(body);
  box.append(el('details', {}, [el('summary', {}, t('result.details')), table]));
  container.append(box);
  return rows;
}

export function bindPlayback(host, animator, getCanonical, getRows = () => []) {
  let paused = false;
  const play = host.querySelector('[data-action="play"]');
  const pause = host.querySelector('[data-action="pause"]');
  function run() {
    paused = false;
    pause.textContent = t('anim.pause');
    const rows = getRows();
    rows.forEach(row => { row.classList.remove('current'); row.removeAttribute('aria-current'); });
    let charIndex = 0;
    animator.play(timeline(getCanonical(), settings.wpm).events, { onStep(event) {
      if (event.type === 'letterGap' || event.type === 'wordGap') charIndex++;
      rows.forEach((row, i) => {
        row.classList.toggle('current', i === charIndex);
        if (i === charIndex) row.setAttribute('aria-current', 'true');
        else row.removeAttribute('aria-current');
      });
    } });
  }
  play.addEventListener('click', run);
  pause.addEventListener('click', () => {
    if (paused) animator.resume();
    else animator.pause();
    paused = !paused;
    pause.textContent = t(paused ? 'anim.resume' : 'anim.pause');
  });
  host.querySelector('[data-action="stop"]').addEventListener('click', () => {
    animator.stop();
    paused = false;
    pause.textContent = t('anim.pause');
    getRows().forEach(row => { row.classList.remove('current'); row.removeAttribute('aria-current'); });
  });
  host.querySelector('[data-action="previous"]').addEventListener('click', () => animator.step(-1));
  host.querySelector('[data-action="next"]').addEventListener('click', () => animator.step(1));
  const speed = host.querySelector('select');
  speed.value = settings.wpm;
  speed.addEventListener('change', () => {
    settings.wpm = Number(speed.value);
    document.querySelectorAll('.playback select').forEach(select => { select.value = settings.wpm; });
  });
  document.addEventListener('tab-switch', () => {
    if (animator.isPlaying) {
      animator.pause();
      paused = true;
      pause.textContent = t('anim.resume');
    }
  });
  return run;
}
