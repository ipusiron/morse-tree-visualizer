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
