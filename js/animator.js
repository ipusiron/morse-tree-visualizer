export function createAnimator(view) {
  let events = [];
  let index = -1;
  let timer;
  let playing = false;
  let callbacks = {};
  let clock;
  let frame;
  let elapsed = 0;
  let reduced = false;
  const signals = () => events.map((e, i) => e.code === undefined ? -1 : i).filter(i => i >= 0);
  function apply(i) {
    const e = events[i];
    if (!e) return;
    if (!reduced && e.code !== undefined) {
      // A seven-symbol character stays outside the tree for its entire duration.
      const rest = events.slice(i).findIndex(next => next.type === 'letterGap' || next.type === 'wordGap');
      const end = rest < 0 ? events.length : i + rest;
      const last = events.slice(i, end).filter(next => next.code !== undefined).at(-1);
      if (last.code.length <= 6) {
        view.highlight(e.code);
        view.setCurrent(e.code);
        view.scrollToCode(e.code);
      }
    } else if (!reduced && (e.type === 'letterGap' || e.type === 'wordGap')) view.clear();
    callbacks.onStep?.(e, i);
  }
  function advance() {
    if (!playing) return;
    index++;
    if (index >= events.length) {
      playing = false;
      callbacks.onDone?.();
      return;
    }
    apply(index);
    timer = setTimeout(advance, events[index].ms);
  }
  function tick() {
    if (!playing) return;
    elapsed = clock.now();
    while (index + 1 < events.length && events[index + 1].startMs <= elapsed) apply(++index);
    const last = events.at(-1);
    if (!last || elapsed >= last.startMs + last.ms) {
      playing = false;
      clock.stop?.();
      callbacks.onDone?.();
    } else frame = requestAnimationFrame(tick);
  }
  function pause() {
    clearTimeout(timer);
    cancelAnimationFrame(frame);
    if (clock && playing) elapsed = clock.now();
    clock?.pause?.(elapsed);
    playing = false;
    callbacks.onPause?.();
  }
  function stop({ preserveView = false } = {}) {
    pause();
    index = -1;
    elapsed = 0;
    clock?.stop?.();
    clock = undefined;
    if (!preserveView) view.clear();
  }
  function play(nextEvents, nextCallbacks = {}, nextClock) {
    stop();
    events = nextEvents;
    callbacks = nextCallbacks;
    clock = nextClock;
    reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      events.forEach((e, i) => {
        const next = events[i + 1];
        if (e.code !== undefined && (!next || next.type === 'letterGap' || next.type === 'wordGap')) view.highlight(e.code);
      });
      if (!clock) {
        callbacks.onDone?.();
        return;
      }
    }
    playing = true;
    if (clock) tick(); else advance();
  }
  function resume() {
    if (playing || index >= events.length) return;
    playing = true;
    if (clock) { clock.resume?.(elapsed); tick(); } else advance();
  }
  function step(direction) {
    pause();
    const all = signals();
    const next = direction > 0 ? all.find(i => i > index) : all.findLast(i => i < index);
    if (next === undefined) return;
    index = next;
    elapsed = events[index].startMs;
    view.clear();
    const previous = reduced;
    reduced = false;
    apply(index);
    reduced = previous;
  }
  return { play, pause, resume, stop, step, get isPlaying() { return playing; } };
}
