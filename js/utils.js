import { PROSIGN_BY_LABEL, PROSIGN_BY_CODE, formatCode } from './morseMap.js';
import { timeline } from './morseCodec.js';
import { t } from './messages.js';
import { createMorseAudio } from './audio.js';
import { formatShare } from './share.js';
import { messageAttrs, setMessage } from './i18n.js';
import { currentTable } from './system.js';

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  for (const child of [children].flat()) node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  return node;
}

export function msg(tag, key, params = {}, attrs = {}) {
  return el(tag, { ...attrs, ...messageAttrs(key, params) }, t(key, params));
}

export const settings = { system: 'intl', notation: 'ja', charWpm: 15, overallWpm: 10,
  frequency: 700, volume: 50, sound: false, lamp: false };

export function bindSettings() {
  document.querySelectorAll('input[name="notation"]').forEach(input => input.addEventListener('change', () => {
    settings.notation = input.value;
    document.dispatchEvent(new Event('notation-change'));
  }));
}

export function describeChars(items) {
  return items.map(({ char, cp }) => `${char}(${cp})`).join(', ');
}

export function bindShareButton(button, input, kind) {
  const status = document.getElementById('shareStatus');
  const update = () => { button.disabled = !input.value; };
  input.addEventListener('input', update);
  document.addEventListener('share-loaded', update);
  button.addEventListener('click', () => {
    if (input.value.length > 1000) { setMessage(status, 'share.too_long'); return; }
    copyText(location.origin + location.pathname + formatShare(kind, input.value), status);
  });
  update();
}

export async function copyText(text, status) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);
    setMessage(status, 'copy.done');
  } catch {
    const field = el('textarea', { class: 'clipboard-fallback', 'aria-label': t('copy.button') });
    field.value = text;
    document.body.append(field);
    field.select();
    try {
      setMessage(status, document.execCommand('copy') ? 'copy.done' : 'copy.failed');
    } catch {
      setMessage(status, 'copy.failed');
    } finally {
      field.remove();
    }
  }
}

export function renderResult(container, words, output, mode) {
  container.replaceChildren();
  const copy = msg('button', 'copy.button', {}, { type: 'button', class: 'copy-button' });
  const status = el('p', { role: 'status', class: 'copy-status' });
  copy.addEventListener('click', () => copyText(output, status));
  const box = el('div', { class: mode === 'encode' ? 'morse-result-container' : 'decode-result-container' });
  box.append(msg('h3', mode === 'encode' ? 'result.morse_heading' : 'result.text_heading'),
    el('output', { class: mode === 'encode' ? 'morse-code-display' : 'decoded-text-display', 'aria-live': 'polite' }, output), copy, status);
  const table = el('table', { class: mode === 'encode' ? 'morse-encode-table' : 'morse-decode-table' });
  const head = el('tr');
  const headings = mode === 'encode' ? ['table.char', 'table.code'] : ['table.code', 'table.char'];
  for (const key of [...headings, 'table.kind', 'table.note']) head.append(msg('th', key, {}, { scope: 'col' }));
  table.append(el('thead', {}, head));
  const body = el('tbody');
  const rows = [];
  words.forEach((word, wi) => {
    if (wi) body.append(el('tr', { class: 'word-gap' }, [msg('td', 'table.word_gap'), el('td', { colspan: 3 }, '/')]));
    word.forEach(({ char, code, prosign }) => {
      const wabun = settings.system === 'wabun';
      const entry = prosign ? PROSIGN_BY_LABEL.get(prosign) : currentTable().find(e => e.char === char);
      const alias = wabun ? null : PROSIGN_BY_CODE.get(code);
      const notes = [];
      if (wabun && entry.name) notes.push(msg('span', entry.name));
      if (prosign) notes.push(msg('span', entry.ja));
      else if (alias) notes.push(msg('span', 'prosign.alias', { label: alias.label }));
      if (code.length > 6) {
        if (notes.length) notes.push(' / ');
        notes.push(msg('span', 'tree.outside', { n: code.length }));
      }
      const row = el('tr', { 'data-char': char }, [el('td', {}, char), el('td', {}, formatCode(code, settings.notation)),
        msg('td', wabun ? 'wabun.standard' : prosign ? 'group.prosign' : entry.itu ? 'table.itu' : 'table.custom'),
        el('td', {}, notes)]);
      if (mode === 'decode') row.prepend(row.children[1]);
      body.append(row);
      rows.push(row);
    });
  });
  table.append(body);
  box.append(el('details', {}, [msg('summary', 'result.details'), table]));
  container.append(box);
  return rows;
}

function bindSpeedHelp(host, speed) {
  const id = speed.id + '-help';
  const button = el('button', { type: 'button', class: 'wpm-help-button',
    'aria-label': t('wpm.help_label'), 'data-i18n-aria-label': 'wpm.help_label',
    'aria-describedby': id, 'aria-controls': id, 'aria-expanded': 'false' }, '?');
  const tooltip = el('span', { id, class: 'wpm-tooltip', role: 'tooltip', hidden: '' }, [
    msg('strong', 'wpm.help_title'),
    ...['wpm.help_speed', 'wpm.help_example', 'wpm.help_start', 'wpm.help_apply'].map(key => msg('span', key))
  ]);
  const wrapper = el('span', { class: 'wpm-help' }, [button, tooltip]);
  const control = el('span', { class: 'wpm-control' });
  const label = host.querySelector(`label[for="${speed.id}"]`);
  label.before(control);
  control.append(label, wrapper, speed);
  let pinned = false;
  function show(visible) {
    tooltip.hidden = !visible;
    button.setAttribute('aria-expanded', String(visible));
  }
  wrapper.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') show(true);
  });
  wrapper.addEventListener('pointerleave', () => {
    if (!pinned && document.activeElement !== button) show(false);
  });
  button.addEventListener('focus', () => show(true));
  button.addEventListener('blur', () => { pinned = false; show(false); });
  button.addEventListener('click', () => { pinned = !pinned; show(pinned); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') { pinned = false; show(false); }
  });
  document.addEventListener('pointerdown', event => {
    if (!wrapper.contains(event.target)) { pinned = false; show(false); }
  });
  document.addEventListener('tab-switch', () => { pinned = false; show(false); });
}

export function bindPlayback(host, animator, getCanonical, getRows = () => []) {
  let paused = false;
  let generation = 0;
  const audio = createMorseAudio();
  const prefix = host.id.replace('-playback', '');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const controls = el('div', { class: 'audio-controls' });
  const lamp = el('span', { id: prefix + '-lamp', class: 'signal-lamp', role: 'img',
    'aria-label': t('audio.lamp'), 'data-i18n-aria-label': 'audio.lamp', hidden: '' });
  host.after(lamp);
  for (const [key, label, choices] of [
    ['overallWpm', 'audio.overall', [5, 8, 10, 12, 15, 18, 20, 25]],
    ['frequency', 'audio.frequency', [500, 600, 700, 800, 900]]
  ]) {
    const id = prefix + (key === 'overallWpm' ? '-overall-wpm' : '-frequency');
    controls.append(msg('label', label, {}, { for: id }), el('select', { id, 'data-setting': key },
      choices.map(n => el('option', { value: n }, n))));
  }
  for (const [key, label] of [['sound', 'audio.sound'], ['lamp', 'audio.lamp']]) {
    controls.append(el('label', { class: 'check-control' }, [
      el('input', { type: 'checkbox', 'data-setting': key, id: prefix + '-' + key + '-enabled' }), msg('span', label)
    ]));
  }
  controls.append(msg('label', 'audio.volume', {}, { for: prefix + '-volume' }),
    el('input', { id: prefix + '-volume', type: 'range', min: 0, max: 100, 'data-setting': 'volume',
      'aria-label': t('audio.volume'), 'data-i18n-aria-label': 'audio.volume' }));
  host.append(controls);
  const play = host.querySelector('[data-action="play"]');
  const pause = host.querySelector('[data-action="pause"]');
  async function run() {
    if (host.closest('[hidden]')) return;
    const ticket = ++generation;
    animator.stop();
    paused = false;
    pause.textContent = t('anim.pause');
    const rows = getRows();
    rows.forEach(row => { row.classList.remove('current'); row.removeAttribute('aria-current'); });
    let charIndex = 0;
    const plan = timeline(getCanonical(), settings);
    const ready = settings.sound && navigator.userActivation.isActive && await audio.ensureContext();
    if (ticket !== generation || host.closest('[hidden]')) return;
    const tones = plan.events.filter(e => e.on).map(e => ({ startMs: e.startMs, endMs: e.startMs + e.ms, code: e.code }));
    let origin;
    function reserve(offset = 0) {
      origin = audio.currentTime - offset / 1000;
      const remaining = tones.filter(e => e.endMs > offset).map(e => ({ ...e,
        startMs: Math.max(0, e.startMs - offset), endMs: e.endMs - offset }));
      audio.schedule(remaining, { startAt: audio.currentTime, frequency: settings.frequency, volume: settings.volume });
    }
    const clock = ready ? { now: () => (audio.currentTime - origin) * 1000,
      pause: () => audio.stop(), stop: () => audio.stop(), resume: reserve } : undefined;
    if (ready) reserve();
    animator.play(plan.events, { onStep(event) {
      lamp.classList.toggle('is-on', Boolean(settings.lamp && event.on && !reduced.matches));
      if (event.type === 'letterGap' || event.type === 'wordGap') charIndex++;
      rows.forEach((row, i) => {
        row.classList.toggle('current', i === charIndex);
        if (i === charIndex) row.setAttribute('aria-current', 'true');
        else row.removeAttribute('aria-current');
      });
    }, onPause() { lamp.classList.remove('is-on'); }, onDone() { lamp.classList.remove('is-on'); } }, clock);
  }
  play.addEventListener('click', run);
  pause.addEventListener('click', () => {
    if (paused) animator.resume();
    else animator.pause();
    paused = !paused;
    pause.textContent = t(paused ? 'anim.resume' : 'anim.pause');
  });
  function stopPlayback() {
    generation++;
    animator.stop();
    paused = false;
    pause.textContent = t('anim.pause');
    getRows().forEach(row => { row.classList.remove('current'); row.removeAttribute('aria-current'); });
  }
  host.querySelector('[data-action="stop"]').addEventListener('click', stopPlayback);
  document.addEventListener('notation-change', stopPlayback);
  document.addEventListener('layout-change', stopPlayback);
  document.addEventListener('system-change', () => { stopPlayback(); animator.reset(); audio.stop(); });
  document.addEventListener('language-change', () => {
    generation++;
    animator.stop({ preserveView: true });
    audio.stop();
    paused = false;
    setMessage(pause, 'anim.pause');
    lamp.classList.remove('is-on');
  });
  host.querySelector('[data-action="previous"]').addEventListener('click', () => animator.step(-1));
  host.querySelector('[data-action="next"]').addEventListener('click', () => animator.step(1));
  const speed = host.querySelector('[data-setting="charWpm"]');
  bindSpeedHelp(host, speed);
  function sync() {
    for (const input of host.querySelectorAll('[data-setting]')) {
      const key = input.dataset.setting;
      if (input.type === 'checkbox') input.checked = settings[key]; else input.value = settings[key];
      if (key === 'overallWpm') for (const option of input.options) option.disabled = Number(option.value) > settings.charWpm;
      if (key === 'lamp') { input.disabled = reduced.matches; if (reduced.matches) input.checked = false; }
    }
    audio.setMuted(!settings.sound);
    lamp.hidden = !settings.lamp || reduced.matches;
  }
  host.querySelectorAll('[data-setting]').forEach(input => input.addEventListener('change', () => {
    settings[input.dataset.setting] = input.type === 'checkbox' ? input.checked : Number(input.value);
    settings.overallWpm = Math.min(settings.overallWpm, settings.charWpm);
    document.dispatchEvent(new Event('playback-settings'));
  }));
  document.addEventListener('playback-settings', sync);
  reduced.addEventListener('change', sync);
  sync();
  document.addEventListener('tab-switch', () => {
    generation++;
    if (animator.isPlaying) {
      animator.pause();
      paused = true;
      pause.textContent = t('anim.resume');
    }
  });
  return run;
}
