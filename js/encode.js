import { highlightPath, clearHighlights } from './treeRenderer.js';

export function initEncodeTab() {
  const startButton = document.getElementById('startButton');
  const inputText = document.getElementById('inputText');
  const resultDiv = document.getElementById('morseResult');

  if (!startButton || !inputText || !resultDiv) return;

  startButton.addEventListener('click', () => {
    const text = inputText.value.toUpperCase();
    const morseMap = window.morseMap || {};
    const morseTree = window.morseTree || {};

    let result = '';
    let table = '<table><tr><th>文字</th><th>モールス符号</th><th>経路</th></tr>';

    const pathList = [];

    for (const char of text) {
      const code = morseMap[char];
      if (code) {
        const path = getPathFromCode(code, morseTree);
        pathList.push(path);
        table += `<tr><td>${char}</td><td>${code}</td><td>${path.join(' > ')}</td></tr>`;
        result += code + ' ';
      }
    }

    table += '</table>';
    resultDiv.innerHTML = `<p><strong>変換結果:</strong> ${result.trim()}</p>${table}`;

    animateHighlightSequence(pathList);
  });
}

function getPathFromCode(code, tree) {
  const path = [];
  let node = tree;
  for (const symbol of code) {
    if (symbol === '・') {
      node = node.left;
      path.push('left');
    } else if (symbol === '−') {
      node = node.right;
      path.push('right');
    }
    if (!node) break;
  }
  return path;
}

function animateHighlightSequence(paths) {
  clearHighlights();
  paths.forEach((path, index) => {
    setTimeout(() => {
      highlightPath(path);
    }, index * 600);
  });
}
