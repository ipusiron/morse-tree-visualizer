import { morseTree } from './morseTree.js';

let svgRoot;
let edgesGroup;
let nodesGroup;
let currentX = 0;

export function renderMorseTree(containerId = 'tree-container') {
  const container = document.getElementById(containerId);
  if (!container) return;

  // 既存の中身をクリア
  container.innerHTML = '';

  // ノードの座標を事前計算
  currentX = 0;
  layoutTree(morseTree, 0);

  // SVG要素生成
  svgRoot = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svgRoot.setAttribute("width", "100%");
  svgRoot.setAttribute("height", "600");

  const bounds = getXBounds(morseTree);
  const margin = 50;
  const viewWidth = bounds.max - bounds.min + margin * 2;
  svgRoot.setAttribute("viewBox", `${bounds.min - margin} 0 ${viewWidth} 600`);

  // グループ作成（線とノード分離）
  edgesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  nodesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

  edgesGroup.setAttribute("id", "edges");
  nodesGroup.setAttribute("id", "nodes");

  svgRoot.appendChild(edgesGroup);
  svgRoot.appendChild(nodesGroup);
  container.appendChild(svgRoot);

  drawTree(morseTree, []);
}

// ノード位置計算
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

// X範囲取得（viewBox補正）
function getXBounds(node, bounds = { min: Infinity, max: -Infinity }) {
  if (!node) return bounds;
  if (node.x < bounds.min) bounds.min = node.x;
  if (node.x > bounds.max) bounds.max = node.x;
  getXBounds(node.left, bounds);
  getXBounds(node.right, bounds);
  return bounds;
}

// ツリー描画
function drawTree(node, path) {
  if (!node) return;

  if (node.left) {
    drawLine(node.x, node.y, node.left.x, node.left.y);
    drawTree(node.left, [...path, "left"]);
  }
  if (node.right) {
    drawLine(node.x, node.y, node.right.x, node.right.y);
    drawTree(node.right, [...path, "right"]);
  }

  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("data-path", path.join("-"));
  group.classList.add("tree-node");

  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", node.x);
  circle.setAttribute("cy", node.y);
  circle.setAttribute("r", 16);
  circle.setAttribute("fill", "#eee");
  circle.setAttribute("stroke", "#666");
  group.appendChild(circle);

  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("x", node.x);
  text.setAttribute("y", node.y + 4);
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("font-size", "12");
  text.textContent = node.label || "";
  group.appendChild(text);

  nodesGroup.appendChild(group);
}

// 線描画（背面）
function drawLine(x1, y1, x2, y2) {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", x1);
  line.setAttribute("y1", y1);
  line.setAttribute("x2", x2);
  line.setAttribute("y2", y2);
  line.setAttribute("stroke", "#bbb");
  edgesGroup.appendChild(line);
}

// 経路ハイライト
export function highlightPath(path) {
  clearHighlights();

  // ✅ ルートノード（空パス）を光らせる
  const rootNode = svgRoot.querySelector(`[data-path=""]`);
  if (rootNode) rootNode.classList.add("highlight");

  // 続きのパスも光らせる
  let currentPath = [];
  for (const dir of path) {
    currentPath.push(dir);
    const selector = `[data-path="${currentPath.join("-")}"]`;
    const node = svgRoot.querySelector(selector);
    if (node) node.classList.add("highlight");
  }
}

// ハイライト解除
export function clearHighlights() {
  const highlighted = svgRoot.querySelectorAll(".highlight");
  highlighted.forEach(el => el.classList.remove("highlight"));
}
