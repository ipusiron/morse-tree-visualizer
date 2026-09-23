import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { settings } from '../js/utils.js';
import { createMorseAudio } from '../js/audio.js';
import { DICTIONARIES } from '../js/messages.js';

test('print sheet is dedicated and application adds no network clients or unsafe DOM sinks', () => {
  const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
  assert.match(css, /@media print\s*\{/);
  assert.match(css, /body > \*:not\(#printSheet\)/);
  assert.match(css, /#printSheet\[hidden\]/);
  assert.match(css, /#printSheet td\s*\{\s*padding: 0\.5mm/);
  assert.match(css, /svg:not\(\.show-prosigns\) \.prosign-extension\s*\{\s*display: none/);
  assert.match(css, /svg:not\(\.show-prosigns\) \.tree-node\.prosign-only circle\s*\{\s*r: 8px/);
  assert.match(css, /grid-template-columns: repeat\(auto-fit, minmax\(min\(100%, 32rem\), 1fr\)\)/);
  assert.match(css, /\.morse-table-group\s*\{[^}]*overflow-x: auto/);
  assert.match(css, /\.morse-table td\s*\{[^}]*overflow-wrap: normal/);
  for (const file of readdirSync(new URL('../js/', import.meta.url)).filter(f => f.endsWith('.js'))) {
    const source = readFileSync(new URL('../js/' + file, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|innerHTML|eval\s*\(/, file);
  }
});

test('notation changes render without autoplay and invalidate pending playback', () => {
  for (const name of ['encode', 'decode']) {
    const source = readFileSync(new URL('../js/' + name + '.js', import.meta.url), 'utf8');
    assert.match(source, /function convert\(autoplay = true\)/);
    assert.match(source, /if \(autoplay\) run\(\)/);
    assert.match(source, /if \(rendered\) convert\(false\)/);
  }
  const source = readFileSync(new URL('../js/utils.js', import.meta.url), 'utf8');
  assert.match(source, /notation-change', stopPlayback/);
  assert.match(source, /function stopPlayback\(\)\s*\{\s*generation\+\+/);
  assert.match(source, /async function run\(\)\s*\{\s*if \(host\.closest\('\[hidden\]'\)\) return/);
  assert.match(source, /ticket !== generation \|\| host\.closest\('\[hidden\]'\)/);
});

test('sound defaults off in shared controls and keying while other playback defaults stay unchanged', () => {
  assert.deepEqual(settings, {
    notation: 'ja', charWpm: 15, overallWpm: 10, frequency: 700, volume: 50, sound: false, lamp: false
  });
  const utils = readFileSync(new URL('../js/utils.js', import.meta.url), 'utf8');
  assert.match(utils, /if \(input.type === 'checkbox'\) input.checked = settings\[key\]/);
  assert.match(utils, /reduced.addEventListener\('change', sync\);\s*sync\(\)/);
  assert.match(utils, /settings.sound && navigator.userActivation.isActive && await audio.ensureContext\(\)/);
  const keying = readFileSync(new URL('../js/keying.js', import.meta.url), 'utf8');
  assert.match(keying, /side.checked && settings.sound && await audio.ensureContext\(\)/);
  assert.match(keying, /playback-settings', \(\) => audio.setMuted\(!settings.sound\)/);
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  for (const key of ['help.light', 'keying.audio_note']) {
    assert.ok(html.includes(DICTIONARIES.ja[key]));
    assert.match(DICTIONARIES.en[key], /Sound is off by default/);
  }
  const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
  assert.match(readme, /初期値は音がオフ/);
  const guidance = readFileSync(new URL('../CLAUDE.md', import.meta.url), 'utf8');
  assert.match(guidance, /Default playback has sound off/);
});

test('audio context remains lazy when toggling mute and enabled playback reuses the first context', async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'AudioContext');
  const counts = { contexts: 0, resumes: 0, oscillators: 0 };
  class FakeAudioContext {
    constructor() { counts.contexts++; this.state = 'suspended'; this.currentTime = 0; this.destination = {}; }
    async resume() { counts.resumes++; this.state = 'running'; }
    createGain() {
      return { gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, cancelScheduledValues() {} },
        connect(node) { return node; }, disconnect() {} };
    }
    createOscillator() {
      counts.oscillators++;
      return { frequency: { value: 0 }, connect(node) { return node; }, start() {}, stop() {}, disconnect() {} };
    }
  }
  Object.defineProperty(globalThis, 'AudioContext', { configurable: true, value: FakeAudioContext });
  const audio = createMorseAudio();
  const tones = [{ startMs: 0, endMs: 80 }];
  try {
    audio.setMuted(true);
    audio.schedule(tones);
    audio.stop();
    assert.deepEqual(counts, { contexts: 0, resumes: 0, oscillators: 0 });
    audio.setMuted(false);
    assert.deepEqual(counts, { contexts: 0, resumes: 0, oscillators: 0 });
    assert.equal(await audio.ensureContext(), true);
    audio.schedule(tones);
    assert.deepEqual(counts, { contexts: 1, resumes: 1, oscillators: 1 });
    audio.stop();
    assert.equal(await audio.ensureContext(), true);
    audio.schedule(tones);
    assert.deepEqual(counts, { contexts: 1, resumes: 1, oscillators: 2 });
  } finally {
    audio.stop();
    if (previous) Object.defineProperty(globalThis, 'AudioContext', previous);
    else delete globalThis.AudioContext;
  }
});
