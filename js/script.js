import { initStudyMode } from './study.js';
import { initMorseTable } from './table.js';
import { renderMorseTree } from './treeRenderer.js';

let tableInitialized = false;
let studyInitialized = false;

document.addEventListener('DOMContentLoaded', () => {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  // 初期タブ選択（英語⇒モールス）
  switchTab('encode');

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const tabId = button.dataset.tab;
      switchTab(tabId);
    });
  });

  // ヘルプモーダル開閉処理
  const helpButton = document.getElementById('helpBtn');
  const helpModal = document.getElementById('helpModal');
  const closeModal = document.getElementById('closeModal');

  if (helpButton && helpModal && closeModal) {
    helpButton.addEventListener('click', () => {
      helpModal.style.display = 'block';
    });

    closeModal.addEventListener('click', () => {
      helpModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
      if (event.target === helpModal) {
        helpModal.style.display = 'none';
      }
    });
  }

  // エンコードボタン処理（英語→モールス）
  const startButton = document.getElementById('startButton');
  const inputText = document.getElementById('inputText');
  const resultDiv = document.getElementById('morseResult');

  if (startButton && inputText && resultDiv) {
    startButton.addEventListener('click', () => {
      const text = inputText.value.toUpperCase();
      const morseMap = window.morseMap || {};
      const morseTree = window.morseTree || {};
      let result = '';
      let table =
        '<table><tr><th>文字</th><th>モールス符号</th><th>経路</th></tr>';

      for (const char of text) {
        const code = morseMap[char];
        if (code) {
          const path = getPathFromCode(char, morseTree, morseMap);
          table += `<tr><td>${char}</td><td>${code}</td><td>${path.join(
            ' > '
          )}</td></tr>`;
          result += code + ' ';
          // TODO: ツリー上の点灯処理をここに追加
        }
      }

      table += '</table>';
      resultDiv.innerHTML = `<p><strong>変換結果:</strong> ${result.trim()}</p>${table}`;
    });
  }

  function getPathFromCode(char, tree, map) {
    const code = map[char];
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

  // タブ切り替え処理
  function switchTab(tabId) {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach((btn) => btn.classList.remove('active'));
    tabContents.forEach((tab) => tab.classList.remove('active'));

    const targetTab = document.getElementById(`tab-${tabId}`);
    const activeButton = document.querySelector(
      `.tab-button[data-tab="${tabId}"]`
    );

    if (targetTab) targetTab.classList.add('active');
    if (activeButton) activeButton.classList.add('active');

    // タブごとの初期化
    if (tabId === 'table' && !tableInitialized) {
      initMorseTable();
      tableInitialized = true;
    } else if (tabId === 'study') {
      if (!studyInitialized) {
        initStudyMode();
        studyInitialized = true;
      }

      // ✅ 確実にタブが表示された「次のフレーム」で描画
      requestAnimationFrame(() => {
        const container = document.getElementById('tree-container-study');
        if (container?.offsetParent !== null) {
          renderMorseTree('tree-container-study');
        }
      });
    }
  }
});
