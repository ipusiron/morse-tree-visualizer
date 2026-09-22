import { MORSE_TABLE, PROSIGNS, formatCode } from './morseMap.js';
import { buildTree, completeTo, layoutTree } from './morseTree.js';
import { t } from './messages.js';

export function createTreeView(container) {
  const tree = completeTo(buildTree(MORSE_TABLE, 6, PROSIGNS));
  layoutTree(tree);
  const groups = new Map();
  const edges = new Map();
  const make = (name, attributes = {}, text = '') => {
    const element = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
    element.textContent = text;
    return element;
  };
  const svg = make('svg', { viewBox: '-50 -30 1080 470', width: 1080, height: 470,
    role: 'img', 'aria-label': t('tree.label') });
  const lines = make('g');
  const nodes = make('g');
  svg.append(lines, nodes);
  container.replaceChildren(svg);
  container.classList.add('tree-box');
  const wrapper = container.closest('.tree-scroll-wrapper') || container;
  wrapper.classList.add('tree-scroll-wrapper');
  const label = document.createElement('label');
  label.className = 'check-control';
  const toggle = document.createElement('input');
  toggle.type = 'checkbox';
  toggle.className = 'prosign-toggle';
  label.append(toggle, document.createTextNode(t('prosign.show')));
  wrapper.before(label);
  toggle.addEventListener('change', () => svg.classList.toggle('show-prosigns', toggle.checked));
  for (const n of tree.nodes.values()) {
    for (const child of [n.left, n.right].filter(Boolean)) {
      const line = make('line', { x1: n.x, y1: n.y, x2: child.x, y2: child.y, 'data-code': child.code });
      edges.set(child.code, line);
      lines.append(line);
    }
    const entry = MORSE_TABLE.find(e => e.code === n.code);
    const empty = !n.char && !n.prosign && n.depth !== 0;
    const group = make('g', { class: 'tree-node' + (empty ? ' empty' : '') + (entry && !entry.itu ? ' custom' : ''),
      'data-code': n.code });
    group.append(make('circle', { cx: n.x, cy: n.y, r: empty ? 8 : 13 }));
    group.append(make('text', { x: n.x, y: n.y + 4, 'text-anchor': 'middle', 'font-size': n.depth ? 13 : 10 },
      n.depth ? n.char || '' : 'start'));
    group.append(make('title', {}, (n.char || '') + ' ' + formatCode(n.code)));
    if (n.prosign) group.append(make('text', { x: n.x + 13, y: n.y + 19, class: 'prosign-label', 'font-size': 11 }, n.prosign));
    nodes.append(group);
    groups.set(n.code, group);
  }
  for (const [side, key] of [['left', 'tree.dir_dot'], ['right', 'tree.dir_dash']]) {
    svg.append(make('text', { x: tree.root[side].x, y: -12, class: 'direction-label', 'text-anchor': 'middle' }, t(key)));
  }
  for (let depth = 1; depth <= 6; depth++) {
    svg.append(make('text', { x: 0, y: 30 + depth * 64 + 4, class: 'depth-label', 'text-anchor': 'end', 'font-size': 11 },
      t('tree.depth', { n: depth })));
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
    const x = n.x + 50;
    if (x < wrapper.scrollLeft + 24 || x > wrapper.scrollLeft + wrapper.clientWidth - 24) {
      wrapper.scrollTo({ left: Math.max(0, x - wrapper.clientWidth / 2),
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  }
  return { svg, highlight, clear, setCurrent, scrollToCode, destroy() { svg.remove(); } };
}
