import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function luminance(hex) {
  if (hex.length === 4) hex = '#' + [...hex.slice(1)].map(c => c + c).join('');
  const values = hex.slice(1).match(/../g).map(c => parseInt(c, 16) / 255)
    .map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return values.reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
}

test('actual semantic foreground/background pairs meet WCAG 4.5:1 in both themes', () => {
  const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
  const roots = [css.match(/:root\s*\{([^}]+)\}/)[1], css.match(/:root\[data-theme="dark"\]\s*\{([^}]+)\}/)[1]];
  // Approved semantic pairs: highlighted text and on-primary differ from ordinary text in dark mode.
  const pairs = [['on-primary', 'primary'], ['on-primary', 'primary-dark'], ['link', 'paper'], ['text', 'tab-bg'],
    ['link', 'tab-bg'], ['success', 'paper'], ['success', 'success-bg'], ['error', 'error-bg'],
    ['error', 'paper'], ['hint', 'page-bg'], ['paper', 'success'], ['custom-text', 'custom-bg'],
    ['node-text', 'node-fill'], ['node-hl-text', 'node-hl-fill'], ['node-text', 'node-custom-fill'], ['depth-text', 'paper'],
    ['link', 'page-bg'], ['text', 'surface'], ['text', 'details-bg']];
  for (const root of roots) {
    const colors = Object.fromEntries([...root.matchAll(/--([\w-]+):\s*(#[\da-f]+);/g)].map(m => [m[1], m[2]]));
    for (const [foreground, background] of pairs) {
    assert.ok(colors[foreground] && colors[background]);
    const values = [luminance(colors[foreground]), luminance(colors[background])].sort((a, b) => b - a);
    assert.ok((values[0] + 0.05) / (values[1] + 0.05) >= 4.5, `${foreground}/${background}`);
    }
  }
});
