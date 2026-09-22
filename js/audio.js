export function createMorseAudio() {
  let context;
  let oscillator;
  let envelope;
  let output;
  let muted = false;
  let available = false;
  let level = 0.5;
  async function ensureContext() {
    try {
      const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!Audio) return false;
      context ||= new Audio();
      if (context.state !== 'running') await context.resume();
      available = context.state === 'running';
    } catch { available = false; }
    return available;
  }
  function stop() {
    if (!oscillator) return;
    envelope.gain.cancelScheduledValues(context.currentTime);
    envelope.gain.setValueAtTime(0, context.currentTime);
    try { oscillator.stop(); } catch { /* Already stopped. */ }
    oscillator.disconnect();
    envelope.disconnect();
    output.disconnect();
    oscillator = null;
  }
  function start({ frequency = 700, volume = 50 } = {}) {
    stop();
    if (!available) return false;
    oscillator = context.createOscillator();
    envelope = context.createGain();
    output = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = Math.max(400, Math.min(1000, frequency));
    envelope.gain.value = 0;
    level = Math.max(0, Math.min(100, volume)) / 100;
    output.gain.value = muted ? 0 : level;
    oscillator.connect(envelope).connect(output).connect(context.destination);
    oscillator.start();
    return true;
  }
  function schedule(tones, { startAt = context?.currentTime ?? 0, frequency = 700, volume = 50 } = {}) {
    if (muted || !tones.length || !start({ frequency, volume })) return;
    for (const tone of tones) {
      const from = startAt + tone.startMs / 1000;
      const to = startAt + tone.endMs / 1000;
      const ramp = Math.min(0.005, (to - from) / 2);
      envelope.gain.setValueAtTime(0, from);
      envelope.gain.linearRampToValueAtTime(1, from + ramp);
      envelope.gain.setValueAtTime(1, to - ramp);
      envelope.gain.linearRampToValueAtTime(0, to);
    }
    oscillator.stop(startAt + tones.at(-1).endMs / 1000 + 0.01);
  }
  function setMuted(value) {
    muted = value;
    if (output) output.gain.setValueAtTime(value ? 0 : level, context.currentTime);
  }
  function keyDown(options) {
    if (start(options)) envelope.gain.linearRampToValueAtTime(1, context.currentTime + 0.005);
  }
  function keyUp() {
    if (!oscillator) return;
    envelope.gain.cancelScheduledValues(context.currentTime);
    envelope.gain.setValueAtTime(envelope.gain.value, context.currentTime);
    envelope.gain.linearRampToValueAtTime(0, context.currentTime + 0.005);
    oscillator.stop(context.currentTime + 0.01);
  }
  return { ensureContext, schedule, stop, setMuted, keyDown, keyUp,
    get currentTime() { return context?.currentTime ?? 0; }, get available() { return available; } };
}
