import { highlightPath, clearHighlights, renderMorseTree } from './treeRenderer.js';
import { morseMap } from './morseMap.js';
import { morseTree } from './morseTree.js';

// 逆引き用のマップを作成
const reverseMorseMap = {};
for (const [char, code] of Object.entries(morseMap)) {
  reverseMorseMap[code] = char;
}

export function initDecodeTab() {
  // モールスツリーを描画
  renderMorseTree("tree-container-decode");
  
  const decodeButton = document.getElementById('decodeButton');
  const morseInput = document.getElementById('morseInput');
  const resultDiv = document.getElementById('decodeResult');
  const errorDiv = document.getElementById('decodeError');

  if (!decodeButton || !morseInput || !resultDiv || !errorDiv) return;

  // モールス文字入力ボタンのイベントリスナーを追加
  const morseCharButtons = document.querySelectorAll('.morse-char-btn');
  morseCharButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const char = button.dataset.char;
      const currentPos = morseInput.selectionStart;
      const currentValue = morseInput.value;
      
      // カーソル位置に文字を挿入
      const newValue = currentValue.slice(0, currentPos) + char + currentValue.slice(currentPos);
      morseInput.value = newValue;
      
      // カーソル位置を調整
      morseInput.focus();
      morseInput.setSelectionRange(currentPos + char.length, currentPos + char.length);
    });
  });

  decodeButton.addEventListener('click', () => {
    const input = morseInput.value.trim();
    
    // エラーと結果をクリア
    errorDiv.innerHTML = '';
    resultDiv.innerHTML = '';
    clearHighlights();
    
    if (!input) {
      errorDiv.innerHTML = '<p class="error-message">モールス信号を入力してください。</p>';
      return;
    }

    // 入力を単語と文字に分割
    const words = input.split('/').map(word => word.trim()).filter(word => word);
    let decodedText = '';
    let invalidCodes = [];
    const allPaths = [];

    for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
      if (wordIndex > 0) decodedText += ' ';
      
      const codes = words[wordIndex].split(/\s+/).filter(code => code);
      
      for (const code of codes) {
        const char = reverseMorseMap[code];
        if (char) {
          decodedText += char;
          const path = getPathFromCode(code);
          allPaths.push(path);
        } else {
          invalidCodes.push(code);
        }
      }
    }

    // エラーチェック
    if (invalidCodes.length > 0) {
      errorDiv.innerHTML = `
        <p class="error-message">⚠ 以下のモールス信号は認識できません: ${invalidCodes.join(', ')}</p>
      `;
      return;
    }

    if (!decodedText) {
      errorDiv.innerHTML = '<p class="error-message">有効なモールス信号が見つかりません。</p>';
      return;
    }

    // 結果を表示
    const detailTable = createDetailTable(input, decodedText);
    
    resultDiv.innerHTML = `
      <div class="decode-result-container">
        <p><strong>復号結果:</strong></p>
        <div class="decoded-text-display">${decodedText}</div>
        <details>
          <summary>詳細を表示</summary>
          ${detailTable}
        </details>
      </div>
    `;

    // アニメーション実行
    if (allPaths.length > 0) {
      animateDecodeSequence(allPaths);
    }
  });
}

function createDetailTable(input, decodedText) {
  const words = input.split('/').map(word => word.trim()).filter(word => word);
  let table = '<table class="morse-decode-table"><tr><th>モールス信号</th><th>文字</th></tr>';
  
  for (const word of words) {
    const codes = word.split(/\s+/).filter(code => code);
    for (const code of codes) {
      const char = reverseMorseMap[code];
      table += `<tr><td>${code}</td><td>${char || '?'}</td></tr>`;
    }
    if (words.length > 1) {
      table += '<tr><td>/</td><td>スペース</td></tr>';
    }
  }
  
  table += '</table>';
  return table;
}

function getPathFromCode(code) {
  console.log('Getting decode path for code:', code);
  const path = [];
  let node = morseTree;
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
  console.log('Generated decode path:', path);
  return path;
}

function animateDecodeSequence(paths) {
  console.log('Starting decode animation with paths:', paths);
  clearHighlights();
  paths.forEach((path, index) => {
    setTimeout(() => {
      console.log(`Highlighting decode path ${index}:`, path);
      clearHighlights();
      highlightPath(path);
    }, index * 1000);
  });
}