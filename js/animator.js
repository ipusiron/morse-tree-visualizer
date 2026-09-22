export function createAnimator(view) {
  let events = [];
  let index = -1;
  let timer;
  let playing = false;
  let callbacks = {};
  const signals = () => events.map((e, i) => e.code === undefined ? -1 : i).filter(i => i >= 0);
  function apply(i) {
    const e = events[i];
    if (!e) return;
    if (e.code !== undefined) {
      // A seven-symbol character stays outside the tree for its entire duration.
      const rest = events.slice(i).findIndex(next => next.type === 'letterGap' || next.type === 'wordGap');
      const end = rest < 0 ? events.length : i + rest;
      const last = events.slice(i, end).filter(next => next.code !== undefined).at(-1);
      if (last.code.length <= 6) {
        view.highlight(e.code);
        view.setCurrent(e.code);
        view.scrollToCode(e.code);
      }
    } else if (e.type === 'letterGap' || e.type === 'wordGap') view.clear();
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
  function pause() {
    clearTimeout(timer);
    playing = false;
  }
  function stop() {
    pause();
    index = -1;
    view.clear();
  }
  function play(nextEvents, nextCallbacks = {}) {
    stop();
    events = nextEvents;
    callbacks = nextCallbacks;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      events.forEach((e, i) => {
        const next = events[i + 1];
        if (e.code !== undefined && (!next || next.type === 'letterGap' || next.type === 'wordGap')) view.highlight(e.code);
      });
      callbacks.onDone?.();
      return;
    }
    playing = true;
    advance();
  }
  function resume() {
    if (playing || index >= events.length) return;
    playing = true;
    advance();
  }
  function step(direction) {
    pause();
    const all = signals();
    const next = direction > 0 ? all.find(i => i > index) : all.findLast(i => i < index);
    if (next === undefined) return;
    index = next;
    view.clear();
    apply(index);
  }
  return { play, pause, resume, stop, step, get isPlaying() { return playing; } };
}
