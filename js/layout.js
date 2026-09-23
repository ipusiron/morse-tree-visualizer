import { t } from './messages.js';

let sessionLayout;
const valid = value => value === 'chart' ? 'chart' : 'tree';

export function readLayout() {
  if (sessionLayout !== undefined) return sessionLayout;
  try { return valid(localStorage.getItem('morse-tree-layout')); } catch { return 'tree'; }
}

export function writeLayout(mode) {
  sessionLayout = valid(mode);
  try { localStorage.setItem('morse-tree-layout', sessionLayout); } catch { /* Storage is optional. */ }
}

export function changeLayout(mode) {
  writeLayout(mode);
  const layout = readLayout();
  document.querySelectorAll('.layout-control input').forEach(input => { input.checked = input.value === layout; });
  document.dispatchEvent(new CustomEvent('layout-change', { detail: { layout } }));
}

export function initLayout() {
  const layout = readLayout();
  document.querySelectorAll('.layout-control').forEach(control => {
    control.querySelector('legend').textContent = t('layout.legend');
    control.querySelectorAll('input').forEach(input => {
      input.checked = input.value === layout;
      input.nextElementSibling.textContent = t('layout.' + input.value);
      input.addEventListener('change', () => { if (input.checked) changeLayout(input.value); });
    });
  });
}
