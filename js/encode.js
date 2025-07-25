import { highlightPath, clearHighlights, renderMorseTree } from './treeRenderer.js';
import { morseMap } from './morseMap.js';
import { morseTree } from './morseTree.js';

export function initEncodeTab() {
  // モールスツリーを描画
  renderMorseTree("tree-container");
  
  const startButton = document.getElementById('startButton');
  const inputText = document.getElementById('inputText');
  const resultDiv = document.getElementById('morseResult');

  if (!startButton || !inputText || !resultDiv) return;

  startButton.addEventListener('click', () => {
    const text = inputText.value.toUpperCase().trim();
    
    if (!text) {
      resultDiv.innerHTML = '<p style="color: #666;">テキストを入力してください。</p>';
      clearHighlights();
      return;
    }

    let result = '';
    let morseOutput = [];
    let invalidChars = [];
    const pathList = [];

    // 各文字を処理
    for (const char of text) {
      if (char === ' ') {
        morseOutput.push('/'); // スペースは / で表現
        continue;
      }
      
      const code = morseMap[char];
      if (code) {
        const path = getPathFromCode(code, morseTree);
        pathList.push(path);
        morseOutput.push(code);
      } else {
        invalidChars.push(char);
      }
    }

    // 結果を表示
    if (invalidChars.length > 0) {
      resultDiv.innerHTML = `
        <p style="color: #d32f2f;">⚠ 以下の文字は変換できません: ${invalidChars.join(', ')}</p>
      `;
      clearHighlights();
      return;
    }

    result = morseOutput.join(' ');
    
    // 詳細表を作成
    let table = '<table class="morse-encode-table"><tr><th>文字</th><th>モールス符号</th></tr>';
    for (const char of text) {
      if (char === ' ') {
        table += `<tr><td>スペース</td><td>/</td></tr>`;
      } else {
        const code = morseMap[char];
        table += `<tr><td>${char}</td><td>${code}</td></tr>`;
      }
    }
    table += '</table>';
    
    resultDiv.innerHTML = `
      <div class="morse-result-container">
        <p><strong>変換結果:</strong></p>
        <div class="morse-code-display">${result}</div>
        <details>
          <summary>詳細を表示</summary>
          ${table}
        </details>
      </div>
    `;

    // アニメーション実行
    if (pathList.length > 0) {
      animateHighlightSequence(pathList);
    }
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
      clearHighlights();
      highlightPath(path);
    }, index * 1000);
  });
}
