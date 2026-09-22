let view;
let animator;
import { createTreeView } from './treeRenderer.js';
import { createAnimator } from './animator.js';
import { normalizeMorse, pathFor, timeline } from './morseCodec.js';
import { morseMap } from './morseMap.js';

import { escapeAndJoin } from './utils.js';

export function initEncodeTab() {
  // モールスツリーを描画
  view = createTreeView(document.getElementById('tree-container'));
  animator = createAnimator(view);
  document.addEventListener('tab-switch', () => animator.stop());
  
  const startButton = document.getElementById('startButton');
  const inputText = document.getElementById('inputText');
  const resultDiv = document.getElementById('morseResult');
  const errorDiv = document.getElementById('encodeError');

  if (!startButton || !inputText || !resultDiv || !errorDiv) return;

  startButton.addEventListener('click', () => {
    const text = inputText.value.toUpperCase().trim();
    
    // エラーと結果をクリア
    errorDiv.innerHTML = '';
    resultDiv.innerHTML = '';
    
    if (!text) {
      errorDiv.innerHTML = '<p class="error-message">テキストを入力してください。</p>';
      view.clear();
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
        const path = getPathFromCode(code);
        pathList.push(path);
        morseOutput.push(code);
      } else {
        invalidChars.push(char);
      }
    }

    // 結果を表示
    if (invalidChars.length > 0) {
      errorDiv.innerHTML = `
        <p class="error-message">⚠ 以下の文字は変換できません: ${escapeAndJoin(invalidChars)}</p>
      `;
      view.clear();
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
        <div class="morse-code-display">
          ${result}
          <button class="copy-button" data-copy-text="${result}">📋 コピー</button>
        </div>
        <details>
          <summary>詳細を表示</summary>
          ${table}
        </details>
      </div>
    `;

    // コピーボタンにイベントリスナーを追加
    const copyButton = resultDiv.querySelector('.copy-button');
    if (copyButton) {
      copyButton.addEventListener('click', () => {
        copyToClipboard(result);
      });
    }

    // アニメーション実行
    if (pathList.length > 0) {
      animateHighlightSequence(pathList);
    }
  });
}

function getPathFromCode(code) {
  return pathFor(normalizeMorse(code).canonical);
}

function animateHighlightSequence(paths) {
  const canonical = paths.map(path => path.map(d => d === 'left' ? '.' : '-').join('')).join(' ');
  animator.play(timeline(canonical).events);
}

// コピー機能
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('モールス信号をクリップボードにコピーしました！');
  } catch (err) {
    console.error('コピーに失敗しました:', err);
    // フォールバック：テキストエリアを使用
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    showToast('モールス信号をクリップボードにコピーしました！');
  }
}

// トースト通知機能
function showToast(message) {
  // 既存のトーストを削除
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  // トースト要素を作成
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  
  // bodyに追加
  document.body.appendChild(toast);
  
  // アニメーション
  setTimeout(() => toast.classList.add('show'), 100);
  
  // 3秒後に削除
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
