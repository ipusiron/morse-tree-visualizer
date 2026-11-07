import { PROSIGNS, formatCode } from './morseMap.js';
import { KIND_GROUPS, readKinds, writeKinds, layoutVisibleTree } from './kinds.js';
import { readLayout } from './layout.js';
import { t } from './messages.js';
import { el, msg, settings } from './utils.js';
import { currentTable } from './system.js';
import { setMessage } from './i18n.js';

const KIND_LABELS = { letter: 'group.letter', digit: 'group.digit', punct: 'group.punct_e', prosign: 'group.prosign',
  kana: 'group.kana', mark: 'group.mark', symbol: 'group.symbol' };
const LEGENDS = { chart: 'chart.legend', htree: 'htree.legend' };

// 4つの木で共通の設定なので、変更は文書全体のイベントで知らせる。
export function changeKinds(list, system = settings.system) {
  if (!writeKinds(system, list)) return false;
  document.dispatchEvent(new CustomEvent('kinds-change', { detail: { system } }));
  return true;
}

export function createTreeView(container, { layout = readLayout() } = {}) {
  let tree;
  let mode;
  let origin = 0;
  const groups = new Map();
  const edges = new Map();
  const make = (name, attributes = {}, text = '') => {
    const element = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
    element.textContent = text;
    return element;
  };
  const svg = make('svg', { role: 'img' });
  container.replaceChildren(svg);
  container.classList.add('tree-box');
  const wrapper = container.closest('.tree-scroll-wrapper') || container;
  wrapper.classList.add('tree-scroll-wrapper');
  const controls = wrapper.previousElementSibling;
  const kindControl = el('fieldset', { class: 'kind-control' });
  if (controls?.classList.contains('tree-controls')) controls.append(kindControl); else wrapper.before(kindControl);
  const legend = el('p', { class: 'chart-legend' });
  wrapper.before(legend);

  function buildKindControl() {
    const shown = readKinds(settings.system);
    const status = el('span', { class: 'kind-status', role: 'status' });
    const labels = KIND_GROUPS[settings.system].map(kind => {
      const input = el('input', { type: 'checkbox', value: kind });
      input.value = kind;
      input.checked = shown.includes(kind);
      input.addEventListener('change', () => {
        const next = boxes.filter(box => box.checked).map(box => box.value);
        // 文字種を1つも選ばない状態は作らない。外したチェックを戻して理由を表示する。
        if (!next.length) {
          input.checked = true;
          setMessage(status, 'kinds.need_one');
          return;
        }
        setMessage(status, null);
        changeKinds(next);
      });
      return el('label', { class: 'check-control' }, [input, msg('span', KIND_LABELS[kind])]);
    });
    const boxes = labels.map(label => label.querySelector('input'));
    kindControl.replaceChildren(msg('legend', 'kinds.legend'), ...labels, status);
  }
  function syncKindControl() {
    const shown = readKinds(settings.system);
    kindControl.querySelectorAll('input').forEach(input => { input.checked = shown.includes(input.value); });
    setMessage(kindControl.querySelector('.kind-status'), null);
  }

  function setLayout(next) {
    mode = next === 'chart' || next === 'htree' ? next : 'tree';
    const chart = mode === 'chart';
    const system = settings.system;
    const wabun = system === 'wabun';
    const table = currentTable();
    const shown = readKinds(system);
    // 表示する文字のうち最も深いものに合わせて木を刈り込み、範囲内の非表示の文字は灰色の点で残す。
    let box;
    ({ tree, box } = layoutVisibleTree(system, shown, table, wabun ? [] : PROSIGNS, mode));
    svg.classList.toggle('wabun', wabun);
    svg.classList.toggle('show-prosigns', !wabun && shown.includes('prosign'));
    origin = box[0];
    svg.setAttribute('viewBox', box.join(' '));
    svg.setAttribute('width', box[2]);
    svg.setAttribute('height', box[3]);
    const labelKey = mode + '.label';
    svg.setAttribute('aria-label', t(labelKey));
    svg.setAttribute('data-i18n-aria-label', labelKey);
    svg.classList.toggle('chart', chart);
    svg.classList.toggle('htree', mode === 'htree');
    container.classList.toggle('chart-box', chart);
    legend.hidden = !LEGENDS[mode];
    if (LEGENDS[mode]) setMessage(legend, LEGENDS[mode]);
    groups.clear();
    edges.clear();
    const lines = make('g');
    const nodes = make('g');
    svg.replaceChildren(lines, nodes);
    for (const n of tree.nodes.values()) {
      for (const child of [n.left, n.right].filter(Boolean)) {
        const line = make('line', { x1: n.x, y1: n.y, x2: child.x, y2: child.y, 'data-code': child.code });
        edges.set(child.code, line);
        lines.append(line);
      }
      const entry = table.find(e => e.code === n.code);
      const empty = !n.char && !n.prosign && n.depth !== 0;
      const group = make('g', { class: 'tree-node' + (empty ? ' empty' : '') + (!wabun && entry && !entry.itu ? ' custom' : '')
        + (n.hiddenKind ? ' hidden-kind' : ''), 'data-code': n.code });
      const inside = chart && n.prosign && !n.char;
      if (n.prosign && !n.char) group.classList.add('prosign-only');
      if (chart && n.shape === 'rect') {
        const w = empty ? 28 : 48;
        const h = empty ? 18 : 30;
        group.append(make('rect', { x: n.x - w / 2, y: n.y - h / 2, width: w, height: h, rx: 3 }));
      } else group.append(make('circle', { cx: n.x, cy: n.y, r: empty ? 8 : chart && n.depth ? 15 : 13 }));
      if (wabun && entry?.kind === 'mark') {
        // Draw spacing voicing marks independently of the font's glyph metrics.
        const mark = make('g', { class: 'voicing-mark', 'aria-hidden': 'true' });
        if (entry.name === 'wabun.dakuten') {
          for (const offset of [0, 4]) {
            mark.append(make('line', { x1: n.x - 2 + offset, y1: n.y - 6, x2: n.x + 2 + offset, y2: n.y - 2 }));
          }
        } else mark.append(make('circle', { cx: n.x, cy: n.y, r: 4 }));
        group.append(mark);
      } else {
        group.append(make('text', { x: n.x, y: n.y + 4, 'text-anchor': 'middle', 'font-size': n.depth ? 13 : 10,
          class: inside ? 'chart-prosign' : 'node-label' }, n.depth ? n.char || (inside ? n.prosign : '') : 'start'));
      }
      group.append(make('title', {}, nodeTitle(n)));
      if (n.prosign && !inside) {
        group.append(make('text', { x: n.x + 13, y: n.y + 19, class: 'prosign-label', 'font-size': 11 }, n.prosign));
      }
      nodes.append(group);
      groups.set(n.code, group);
    }
    if (chart) {
      for (const [x, key] of [[220, 'chart.dir_dash'], [500, 'chart.dir_dot']]) {
        svg.append(make('text', { x, y: 16, class: 'direction-label', 'text-anchor': 'middle', 'data-i18n': key }, t(key)));
      }
    } else if (mode === 'tree') {
      for (const [side, key] of [['left', 'tree.dir_dot'], ['right', 'tree.dir_dash']]) {
        svg.append(make('text', { x: tree.root[side].x, y: -12, class: 'direction-label',
          'text-anchor': 'middle', 'data-i18n': key }, t(key)));
      }
      for (let depth = 1; depth <= tree.depth; depth++) {
        svg.append(make('text', { x: 0, y: 30 + depth * 64 + 4, class: 'depth-label', 'text-anchor': 'end', 'font-size': 11,
          'data-i18n': 'tree.depth', 'data-i18n-params': JSON.stringify({ n: depth }) },
          t('tree.depth', { n: depth })));
      }
    }
  }
  function clear() {
    svg.querySelectorAll('.highlight, .current').forEach(e => e.classList.remove('highlight', 'current'));
  }
  function highlight(code) {
    if (!groups.has(code)) return false;
    for (let i = 0; i <= code.length; i++) {
      groups.get(code.slice(0, i))?.classList.add('highlight');
      edges.get(code.slice(0, i))?.classList.add('highlight');
    }
    return true;
  }
  function setCurrent(code) {
    svg.querySelectorAll('.current').forEach(e => e.classList.remove('current'));
    groups.get(code)?.classList.add('current');
  }
  function scrollToCode(code) {
    const n = tree.nodes.get(code);
    if (!n) return;
    const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    const x = n.x - origin;
    if (x < wrapper.scrollLeft + 24 || x > wrapper.scrollLeft + wrapper.clientWidth - 24) {
      wrapper.scrollTo({ left: Math.max(0, x - wrapper.clientWidth / 2), behavior });
    }
    if (mode !== 'tree') {
      // 図が画面の高さに収まるなら、図全体を一度だけ画面に入れる。
      // 節ごとに寄せると、上下に飛ぶHツリーでは再生中にページが小刻みに動く。
      const box = wrapper.getBoundingClientRect();
      if (box.height <= window.innerHeight) {
        if (box.top < 0 || box.bottom > window.innerHeight) wrapper.scrollIntoView({ block: 'nearest', behavior });
        return;
      }
      const group = groups.get(code);
      const rect = group.getBoundingClientRect();
      if (rect.top < 0 || rect.bottom > window.innerHeight) {
        group.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior });
      }
    }
  }
  const onLayout = event => setLayout(event.detail.layout);
  const onSystem = () => { buildKindControl(); setLayout(mode); };
  const onKinds = () => { syncKindControl(); setLayout(mode); };
  function nodeTitle(node) {
    const entry = currentTable().find(e => e.code === node.code);
    const name = settings.system === 'wabun' && entry?.name ? ' ' + t(entry.name) : '';
    return (node.char || node.prosign || '') + name + ' ' + formatCode(node.code, settings.notation);
  }
  const onLanguage = () => {
    for (const n of tree.nodes.values()) {
      groups.get(n.code).querySelector('title').textContent = nodeTitle(n);
    }
  };
  document.addEventListener('layout-change', onLayout);
  document.addEventListener('system-change', onSystem);
  document.addEventListener('kinds-change', onKinds);
  document.addEventListener('language-change', onLanguage);
  document.addEventListener('notation-change', onLanguage);
  buildKindControl();
  setLayout(layout);
  // 木に描かれている符号か（刈り込みで外れた文字は、再生しても木を光らせない）。
  const has = code => groups.has(code);
  return { svg, highlight, clear, setCurrent, scrollToCode, setLayout, has, destroy() {
    document.removeEventListener('layout-change', onLayout);
    document.removeEventListener('system-change', onSystem);
    document.removeEventListener('kinds-change', onKinds);
    document.removeEventListener('language-change', onLanguage);
    document.removeEventListener('notation-change', onLanguage);
    kindControl.remove();
    legend.remove();
    svg.remove();
  } };
}
