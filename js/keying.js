import { CODE_TO_CHAR, PROSIGN_BY_CODE, formatCode } from './morseMap.js';
import { classifyPress, classifyGap, unitMs } from './morseCodec.js';
import { createTreeView } from './treeRenderer.js';
import { createMorseAudio } from './audio.js';
import { el, settings } from './utils.js';
import { t } from './messages.js';
import { switchTab } from './script.js';

export function initKeying() {
  const panel = document.getElementById('tab-keying');
  const button = document.getElementById('keyButton');
  const speed = document.getElementById('keying-wpm');
  const side = document.getElementById('keying-sidetone');
  const bars = document.getElementById('keyingBars');
  const pendingOutput = document.getElementById('keyingPending');
  const codeOutput = document.getElementById('keyingMorse');
  const textOutput = document.getElementById('keyingText');
  const view = createTreeView(document.getElementById('tree-container-keying'));
  const audio = createMorseAudio();
  const codes = [];
  let pending = '';
  let downAt = null;
  let upAt = null;
  let source;
  let generation = 0;
  let timers = [];
  const unit = () => unitMs(Number(speed.value));
  const character = code => CODE_TO_CHAR.get(code) ?? (PROSIGN_BY_CODE.has(code) ? `<${PROSIGN_BY_CODE.get(code).label}>` : '?');
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  function render(showPending = true) {
    pendingOutput.textContent = showPending ? formatCode(pending, settings.notation) : '';
    codeOutput.replaceChildren(...codes.map(code => el('span', {
      class: code !== '/' && character(code) === '?' ? 'keying-invalid' : ''
    }, (code === '/' ? '/' : formatCode(code, settings.notation)) + ' ')));
    textOutput.textContent = codes.map(code => code === '/' ? ' ' : character(code)).join('');
    document.getElementById('keyingToDecode').disabled = !codes.length && !pending;
  }
  function commit() {
    if (pending) { codes.push(pending); pending = ''; }
    view.clear();
    render();
  }
  function word() {
    commit();
    if (codes.length && codes.at(-1) !== '/') codes.push('/');
    render();
  }
  async function down(kind) {
    if (downAt !== null || panel.hidden) return;
    const now = performance.now();
    clearTimers();
    if (upAt !== null) {
      const gap = classifyGap(now - upAt, unit());
      if (gap === 'word') word(); else if (gap === 'letter') commit();
    }
    downAt = now;
    source = kind;
    const ticket = ++generation;
    button.classList.add('is-down');
    view.clear();
    view.highlight(pending + '.');
    later(() => { view.clear(); view.highlight(pending + '-'); }, 2 * unit());
    audio.setMuted(!settings.sound);
    if (side.checked && settings.sound && await audio.ensureContext() && downAt !== null && ticket === generation) {
      audio.keyDown(settings);
    }
  }
  function up(kind) {
    if (downAt === null || source !== kind) return;
    const now = performance.now();
    const duration = now - downAt;
    clearTimers();
    generation++;
    downAt = null;
    upAt = now;
    audio.keyUp();
    button.classList.remove('is-down');
    pending += classifyPress(duration, unit());
    const bar = el('meter', { min: 0, max: 4, low: 2, high: 2, optimum: 1, value: Math.min(4, duration / unit()),
      'aria-label': t('keying.duration', { ms: Math.round(duration) }), title: t('keying.duration', { ms: Math.round(duration) }) });
    bars.append(el('span', { class: 'press-bar' }, bar));
    while (bars.children.length > 10) bars.firstElementChild.remove();
    render(false);
    later(() => { view.clear(); view.highlight(pending); render(); }, 2 * unit());
    later(commit, 5 * unit());
    later(word, 10 * unit());
  }
  function cancel() {
    clearTimers();
    generation++;
    downAt = null;
    source = null;
    audio.stop();
    button.classList.remove('is-down');
    view.clear();
  }
  button.addEventListener('pointerdown', event => {
    if (event.button !== 0 || downAt !== null) return;
    event.preventDefault();
    button.focus();
    button.setPointerCapture(event.pointerId);
    down('pointer');
  });
  button.addEventListener('pointerup', () => up('pointer'));
  button.addEventListener('pointercancel', cancel);
  const editing = target => target.matches('input, select, textarea, [contenteditable="true"]');
  document.addEventListener('keydown', event => {
    if (event.code !== 'Space' || panel.hidden || editing(event.target) || !document.getElementById('helpModal').hidden) return;
    event.preventDefault();
    if (!event.repeat) down('keyboard');
  });
  document.addEventListener('keyup', event => {
    if (event.code === 'Space' && source === 'keyboard') { event.preventDefault(); up('keyboard'); }
  });
  document.getElementById('keyingClear').addEventListener('click', () => {
    cancel(); codes.length = 0; pending = ''; upAt = null; bars.replaceChildren(); render();
  });
  document.getElementById('keyingToDecode').addEventListener('click', () => {
    const canonical = [...codes, ...(pending ? [pending] : [])].join(' ').trim();
    cancel();
    switchTab('decode');
    document.getElementById('morseInput').value = formatCode(canonical, settings.notation);
    document.getElementById('decodeButton').click();
  });
  speed.addEventListener('change', () => { cancel(); commit(); upAt = null; });
  side.addEventListener('change', () => { if (!side.checked) audio.stop(); });
  document.addEventListener('playback-settings', () => audio.setMuted(!settings.sound));
  document.addEventListener('notation-change', () => render());
  document.addEventListener('tab-switch', cancel);
  window.addEventListener('blur', cancel);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancel(); });
  render();
}
