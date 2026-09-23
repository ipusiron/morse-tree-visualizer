import { t, getLang, setLang } from './messages.js';

const isLanguage = value => value === 'ja' || value === 'en';

export function readLang() {
  try {
    const value = localStorage.getItem('morse-tree-lang');
    return isLanguage(value) ? value : null;
  } catch { return null; }
}

export function writeLang(lang) {
  if (!isLanguage(lang)) return;
  try { localStorage.setItem('morse-tree-lang', lang); } catch { /* Storage is optional. */ }
}

export function initialLang(search = globalThis.location?.search ?? '', nav = globalThis.navigator?.language ?? '') {
  const requested = new URLSearchParams(String(search).replace(/^\?/, '')).get('lang');
  if (isLanguage(requested)) return requested;
  return readLang() ?? (String(nav).toLowerCase().startsWith('ja') ? 'ja' : 'en');
}

export function messageAttrs(key, params = {}) {
  return { 'data-i18n': key, 'data-i18n-params': JSON.stringify(params) };
}

export function setMessage(node, key, params = {}) {
  if (!key) {
    node.removeAttribute('data-i18n');
    node.removeAttribute('data-i18n-params');
    node.textContent = '';
  } else {
    for (const [name, value] of Object.entries(messageAttrs(key, params))) node.setAttribute(name, value);
    node.textContent = t(key, params);
  }
  return node;
}

export function translateElements(root = document) {
  for (const node of root.querySelectorAll('[data-i18n]')) {
    const text = t(node.dataset.i18n, JSON.parse(node.dataset.i18nParams || '{}'));
    if (node.tagName === 'META') node.setAttribute('content', text);
    else node.textContent = text;
  }
  for (const attribute of ['aria-label', 'title', 'placeholder', 'label']) {
    for (const node of root.querySelectorAll(`[data-i18n-${attribute}]`)) {
      node.setAttribute(attribute, t(node.getAttribute(`data-i18n-${attribute}`), JSON.parse(node.dataset.i18nParams || '{}')));
    }
  }
}

export function applyLanguage(lang = getLang()) {
  setLang(lang);
  const scroll = [...document.querySelectorAll('*')].filter(node => node.scrollTop || node.scrollLeft)
    .map(node => [node, node.scrollLeft, node.scrollTop]);
  const page = [window.scrollX, window.scrollY];
  document.documentElement.lang = getLang();
  translateElements();
  const button = document.getElementById('langToggle');
  button.textContent = getLang() === 'ja' ? 'EN' : 'JA';
  button.setAttribute('aria-label', getLang() === 'ja' ? 'English' : '\u65e5\u672c\u8a9e');
  document.dispatchEvent(new Event('language-change'));
  for (const [node, left, top] of scroll) { node.scrollLeft = left; node.scrollTop = top; }
  window.scrollTo({ left: page[0], top: page[1], behavior: 'instant' });
}
