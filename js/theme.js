import { t } from './messages.js';

export function readTheme() {
  try {
    const value = localStorage.getItem('morse-tree-theme');
    return ['light', 'dark', 'system'].includes(value) ? value : 'system';
  } catch { return 'system'; }
}

export function writeTheme(value) {
  try { localStorage.setItem('morse-tree-theme', value); } catch { /* Storage is optional. */ }
}

export function initTheme() {
  const button = document.getElementById('themeToggle');
  let choice = readTheme();
  function render() {
    if (choice === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.dataset.theme = choice;
    button.textContent = { light: '\u2600\ufe0f', dark: '\ud83c\udf19', system: '\ud83d\udda5' }[choice];
    button.setAttribute('aria-label', t('theme.label', { theme: t('theme.' + choice) }));
    button.title = button.getAttribute('aria-label');
  }
  button.addEventListener('click', () => {
    choice = { light: 'dark', dark: 'system', system: 'light' }[choice];
    writeTheme(choice);
    render();
  });
  render();
}
