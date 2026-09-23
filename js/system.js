import { MORSE_TABLE } from './morseMap.js';
import { WABUN_TABLE, WABUN_SAMPLES } from './wabunMap.js';
import { encode, decode, encodeWabun, decodeWabun } from './morseCodec.js';
import { settings } from './utils.js';
import { t } from './messages.js';
import { setMessage } from './i18n.js';

const isSystem = value => value === 'intl' || value === 'wabun';

export function readSystem() {
  try {
    const value = localStorage.getItem('morse-tree-system');
    return isSystem(value) ? value : null;
  } catch { return null; }
}

export function writeSystem(system) {
  if (!isSystem(system)) return;
  try { localStorage.setItem('morse-tree-system', system); } catch { /* Storage is optional. */ }
}

export function initialSystem(search = globalThis.location?.search ?? '') {
  const requested = new URLSearchParams(String(search).replace(/^\?/, '')).get('code');
  return isSystem(requested) ? requested : readSystem() ?? 'intl';
}

export function currentTable(system = settings.system) {
  return system === 'wabun' ? WABUN_TABLE : MORSE_TABLE;
}

export function encodeCurrent(text, notation = settings.notation) {
  return (settings.system === 'wabun' ? encodeWabun : encode)(text, notation);
}

export function decodeCurrent(text) {
  return (settings.system === 'wabun' ? decodeWabun : decode)(text);
}

function updateSystemText() {
  const wabun = settings.system === 'wabun';
  for (const key of ['tab.encode', 'tab.encode_short', 'tab.decode', 'tab.decode_short', 'tree.legend']) {
    for (const node of document.querySelectorAll('[data-i18n="' + key + '"], [data-i18n="wabun.' + key + '"]')) {
      setMessage(node, wabun ? 'wabun.' + key : key);
    }
  }
  for (const [id, key] of [['inputText', 'encode.placeholder'], ['morseInput', 'decode.placeholder']]) {
    const node = document.getElementById(id);
    if (!node) continue;
    const selected = wabun ? 'wabun.' + key : key;
    const params = wabun && id === 'inputText' ? { sample: WABUN_SAMPLES[0] } : {};
    node.setAttribute('data-i18n-placeholder', selected);
    node.setAttribute('data-i18n-params', JSON.stringify(params));
    node.setAttribute('placeholder', t(selected, params));
  }
  document.querySelectorAll('[data-sample]').forEach((button, index) => {
    button.dataset.intlSample ??= button.dataset.sample;
    const text = wabun ? WABUN_SAMPLES[index] : button.dataset.intlSample;
    button.dataset.sample = text;
    button.textContent = text;
  });
}

export function changeSystem(system) {
  if (!isSystem(system) || settings.system === system) return;
  settings.system = system;
  writeSystem(system);
  document.querySelectorAll('[name="system"]').forEach(input => { input.checked = input.value === system; });
  updateSystemText();
  document.dispatchEvent(new Event('system-change'));
}

export function initSystem(search) {
  settings.system = initialSystem(search);
  document.querySelectorAll('[name="system"]').forEach(input => {
    input.checked = input.value === settings.system;
    input.addEventListener('change', () => { if (input.checked) changeSystem(input.value); });
  });
  updateSystemText();
}

export function bindSystemConversion(panel, convert) {
  let stale = false;
  const refresh = () => {
    if (!stale || panel.hidden) return;
    stale = false;
    convert(false);
  };
  document.addEventListener('system-change', () => { stale = true; refresh(); });
  document.addEventListener('tab-activated', refresh);
}
