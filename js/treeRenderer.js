import { MORSE_TABLE, PROSIGNS, formatCode } from './morseMap.js';
import { buildTree, completeTo, layoutTree, layoutChart } from './morseTree.js';
import { readLayout } from './layout.js';
import { t } from './messages.js';

export function createTreeView(container, { layout = readLayout() } = {}) {
  let tree;
  let mode;
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
  const label = document.createElement('label');
  label.className = 'check-control';
  const toggle = document.createElement('input');
  toggle.type = 'checkbox';
  toggle.className = 'prosign-toggle';
  label.append(toggle, document.createTextNode(t('prosign.show')));
  if (controls?.classList.contains('tree-controls')) controls.append(label); else wrapper.before(label);
  const legend = document.createElement('p');
  legend.className = 'chart-legend';
  legend.textContent = t('chart.legend');
  wrapper.before(legend);
  toggle.addEventListener('change', () => svg.classList.toggle('show-prosigns', toggle.checked));

  function setLayout(next) {
    mode = next === 'chart' ? 'chart' : 'tree';
    const chart = mode === 'chart';
    // Always pack all prosign paths; hiding them must never move the other nodes.
    tree = buildTree(MORSE_TABLE, 6, PROSIGNS);
    let width = 1080;
    let height = 470;
    if (chart) ({ width, height } = layoutChart(tree));
    else { completeTo(tree); layoutTree(tree); }
    svg.setAttribute('viewBox', chart ? `0 0 ${width} ${height}` : '-50 -30 1080 470');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('aria-label', t(chart ? 'chart.label' : 'tree.label'));
    svg.classList.toggle('chart', chart);
    container.classList.toggle('chart-box', chart);
    legend.hidden = !chart;
    groups.clear();
    edges.clear();
    const lines = make('g');
    const nodes = make('g');
    svg.replaceChildren(lines, nodes);
    const extension = node => node.prosign && !node.char && (node.depth > 5 || (chart && node.prosign === 'SN'));
    for (const n of tree.nodes.values()) {
      for (const child of [n.left, n.right].filter(Boolean)) {
        const line = make('line', { x1: n.x, y1: n.y, x2: child.x, y2: child.y, 'data-code': child.code });
        if (extension(child)) line.classList.add('prosign-extension');
        edges.set(child.code, line);
        lines.append(line);
      }
      const entry = MORSE_TABLE.find(e => e.code === n.code);
      const empty = !n.char && !n.prosign && n.depth !== 0;
      const group = make('g', { class: 'tree-node' + (empty ? ' empty' : '') + (entry && !entry.itu ? ' custom' : ''),
        'data-code': n.code });
      const inside = chart && n.prosign && !n.char;
      if (n.prosign && !n.char) group.classList.add('prosign-only');
      if (extension(n)) group.classList.add('prosign-extension');
      if (chart && n.shape === 'rect') {
        const w = empty ? 28 : 48;
        const h = empty ? 18 : 30;
        group.append(make('rect', { x: n.x - w / 2, y: n.y - h / 2, width: w, height: h, rx: 3 }));
      } else group.append(make('circle', { cx: n.x, cy: n.y, r: empty ? 8 : chart && n.depth ? 15 : 13 }));
      group.append(make('text', { x: n.x, y: n.y + 4, 'text-anchor': 'middle', 'font-size': n.depth ? 13 : 10,
        class: inside ? 'chart-prosign' : 'node-label' }, n.depth ? n.char || (inside ? n.prosign : '') : 'start'));
      group.append(make('title', {}, (n.char || n.prosign || '') + ' ' + formatCode(n.code)));
      if (n.prosign && !inside) {
        group.append(make('text', { x: n.x + 13, y: n.y + 19, class: 'prosign-label', 'font-size': 11 }, n.prosign));
      }
      nodes.append(group);
      groups.set(n.code, group);
    }
    if (chart) {
      for (const [x, key] of [[220, 'chart.dir_dash'], [500, 'chart.dir_dot']]) {
        svg.append(make('text', { x, y: 16, class: 'direction-label', 'text-anchor': 'middle' }, t(key)));
      }
    } else {
      for (const [side, key] of [['left', 'tree.dir_dot'], ['right', 'tree.dir_dash']]) {
        svg.append(make('text', { x: tree.root[side].x, y: -12, class: 'direction-label', 'text-anchor': 'middle' }, t(key)));
      }
      for (let depth = 1; depth <= 6; depth++) {
        svg.append(make('text', { x: 0, y: 30 + depth * 64 + 4, class: 'depth-label', 'text-anchor': 'end', 'font-size': 11 },
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
    const x = n.x + (mode === 'tree' ? 50 : 0);
    if (x < wrapper.scrollLeft + 24 || x > wrapper.scrollLeft + wrapper.clientWidth - 24) {
      wrapper.scrollTo({ left: Math.max(0, x - wrapper.clientWidth / 2), behavior });
    }
    if (mode === 'chart') {
      const group = groups.get(code);
      const rect = group.getBoundingClientRect();
      if (rect.top < 0 || rect.bottom > window.innerHeight) {
        group.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior });
      }
    }
  }
  const onLayout = event => setLayout(event.detail.layout);
  document.addEventListener('layout-change', onLayout);
  setLayout(layout);
  return { svg, highlight, clear, setCurrent, scrollToCode, setLayout, destroy() {
    document.removeEventListener('layout-change', onLayout);
    label.remove();
    legend.remove();
    svg.remove();
  } };
}
