import { morseTree } from './morseTree.js';

let svgRoot;
let edgesGroup;
let nodesGroup;
let currentX = 0;

export function renderMorseTree(containerId = 'tree-container') {
  const container = document.getElementById(containerId);
  if (!container) return;

  // 既存内容クリア
  container.innerHTML = '';

  // 座標計算
  currentX = 0;
  layoutTree(morseTree, 0);

  // ツリーの境界を取得（高さも含む）
  const bounds = getBounds(morseTree);
  // ラベル分の余白を考慮
  bounds.minY -= 40; // ラベル用の余白
  const marginX = 50;
  const marginY = 30;
  const viewWidth = bounds.maxX - bounds.minX + marginX * 2;
  const viewHeight = bounds.maxY - bounds.minY + marginY * 2;

  // SVG構築
  svgRoot = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgRoot.setAttribute('width', '100%');
  svgRoot.setAttribute('height', viewHeight);
  svgRoot.setAttribute('viewBox', `${bounds.minX - marginX} ${bounds.minY - marginY} ${viewWidth} ${viewHeight}`);

  // グループ作成
  edgesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  edgesGroup.setAttribute('id', 'edges');
  svgRoot.appendChild(edgesGroup);

  nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  nodesGroup.setAttribute('id', 'nodes');
  svgRoot.appendChild(nodesGroup);

  container.appendChild(svgRoot);

  drawTree(morseTree, []);

  // --- 矢印ラベルを描画（左：ドット、右：ダッシュ） ---
  const labelGroup = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'g'
  );
  labelGroup.setAttribute('id', 'direction-labels');

  // ドット（左）
  const leftLabel = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'text'
  );
  leftLabel.setAttribute('x', morseTree.left.x);
  leftLabel.setAttribute('y', bounds.minY - 20);
  leftLabel.setAttribute('text-anchor', 'middle');
  leftLabel.setAttribute('font-size', '16');
  leftLabel.setAttribute('font-weight', 'bold');
  leftLabel.setAttribute('fill', '#333');
  leftLabel.textContent = '← ・（ドット）';

  // ダッシュ（右）
  const rightLabel = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'text'
  );
  rightLabel.setAttribute('x', morseTree.right.x);
  rightLabel.setAttribute('y', bounds.minY - 20);
  rightLabel.setAttribute('text-anchor', 'middle');
  rightLabel.setAttribute('font-size', '16');
  rightLabel.setAttribute('font-weight', 'bold');
  rightLabel.setAttribute('fill', '#333');
  rightLabel.textContent = '−（ダッシュ） →';

  labelGroup.appendChild(leftLabel);
  labelGroup.appendChild(rightLabel);
  svgRoot.appendChild(labelGroup);
}

function layoutTree(node, depth) {
  if (!node) return;

  if (!node.left && !node.right) {
    node.x = currentX * 35 + 30;
    currentX++;
  } else {
    layoutTree(node.left, depth + 1);
    layoutTree(node.right, depth + 1);
    const lx = node.left?.x ?? 0;
    const rx = node.right?.x ?? 0;
    node.x = (lx + rx) / 2;
  }

  node.y = depth * 70 + 30;
}

function getBounds(node, bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }) {
  if (!node) return bounds;
  if (node.x < bounds.minX) bounds.minX = node.x;
  if (node.x > bounds.maxX) bounds.maxX = node.x;
  if (node.y < bounds.minY) bounds.minY = node.y;
  if (node.y > bounds.maxY) bounds.maxY = node.y;
  getBounds(node.left, bounds);
  getBounds(node.right, bounds);
  return bounds;
}

function drawTree(node, path) {
  if (!node) return;

  // 線描画（パスを渡す）
  if (node.left) {
    const leftPath = [...path, 'left'];
    drawLine(node.x, node.y, node.left.x, node.left.y, leftPath);
    drawTree(node.left, leftPath);
  }
  if (node.right) {
    const rightPath = [...path, 'right'];
    drawLine(node.x, node.y, node.right.x, node.right.y, rightPath);
    drawTree(node.right, rightPath);
  }

  // ノード描画
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.setAttribute('data-path', path.join('-'));
  group.classList.add('tree-node');

  const circle = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'circle'
  );
  circle.setAttribute('cx', node.x);
  circle.setAttribute('cy', node.y);
  circle.setAttribute('r', 16);
  circle.setAttribute('fill', '#eee');
  circle.setAttribute('stroke', '#666');
  group.appendChild(circle);

  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', node.x);
  text.setAttribute('y', node.y + 4);
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('font-size', '12');
  text.textContent = node.label || '';
  group.appendChild(text);

  nodesGroup.appendChild(group);
}

function drawLine(x1, y1, x2, y2, path) {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', x1);
  line.setAttribute('y1', y1);
  line.setAttribute('x2', x2);
  line.setAttribute('y2', y2);
  line.setAttribute('stroke', '#bbb');
  if (path) {
    line.setAttribute('data-path', path.join('-'));
  }
  edgesGroup.appendChild(line);
}

// ノード（g[data-path]）と線（line[data-path]）を個別に指定
export function highlightPath(path) {
  clearHighlights();

  // ✅ ルートノードを点灯
  const rootNode = svgRoot.querySelector(`g[data-path=""]`);
  if (rootNode) rootNode.classList.add('highlight');

  let currentPath = [];
  for (const dir of path) {
    currentPath.push(dir);
    const pathStr = currentPath.join('-');

    const node = svgRoot.querySelector(`g[data-path="${pathStr}"]`);
    if (node) node.classList.add('highlight');

    const line = svgRoot.querySelector(`line[data-path="${pathStr}"]`);
    if (line) line.classList.add('highlight');
  }
}

export function clearHighlights() {
  if (!svgRoot) return;

  const highlightedNodes = svgRoot.querySelectorAll('.highlight');
  highlightedNodes.forEach((el) => el.classList.remove('highlight'));
}

