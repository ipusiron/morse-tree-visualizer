import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function luminance(hex) {
  if (hex.length === 4) hex = '#' + [...hex.slice(1)].map(c => c + c).join('');
  const values = hex.slice(1).match(/../g).map(c => parseInt(c, 16) / 255)
    .map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return values.reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
}

test('all J-1 foreground/background pairs meet WCAG 4.5:1', () => {
  const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
  const root = css.match(/:root\s*\{([^}]+)\}/)[1];
  const colors = Object.fromEntries([...root.matchAll(/--([\w-]+):\s*(#[\da-f]+);/g)].map(m => [m[1], m[2]]));
  const pairs = [['paper', 'primary'], ['paper', 'primary-dark'], ['primary', 'paper'], ['text', 'tab-bg'],
    ['primary-dark', 'tab-bg'], ['success', 'paper'], ['success', 'success-bg'], ['error', 'error-bg'],
    ['error', 'paper'], ['hint', 'page-bg'], ['primary-dark', 'paper'], ['paper', 'success'], ['custom-text', 'custom-bg'],
    ['node-text', 'node-fill'], ['node-text', 'node-hl-fill'], ['node-text', 'node-custom-fill'], ['depth-text', 'paper']];
  for (const [foreground, background] of pairs) {
    assert.ok(colors[foreground] && colors[background]);
    const values = [luminance(colors[foreground]), luminance(colors[background])].sort((a, b) => b - a);
    assert.ok((values[0] + 0.05) / (values[1] + 0.05) >= 4.5, `${foreground}/${background}`);
  }
});
