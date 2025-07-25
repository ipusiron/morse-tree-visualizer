import { morseMap } from './morseMap.js';
import { morseTree } from './morseTree.js';
import { initMorseTable } from './table.js'; 

// ----------------------
// タブ切り替え処理
// ----------------------
document.querySelectorAll('.tab-button').forEach(button => {
  button.addEventListener('click', () => {
    const target = button.dataset.tab;

    // タブボタン切り替え
    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    button.classList.add('active');

    // パネル切り替え
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });

    const targetContent = document.getElementById(`tab-${target}`);
    if (targetContent) targetContent.classList.add('active');

    // モールス一覧表を初期化（最初の1回だけ）
    if (target === "table") {
      initMorseTable();
    }
  });
});


// ----------------------
// ヘルプモーダル開閉処理
// ----------------------
const helpBtn = document.getElementById('helpBtn');
const helpModal = document.getElementById('helpModal');
const closeHelp = document.getElementById('closeHelp');

helpBtn.addEventListener('click', () => {
  helpModal.classList.remove('hidden');
});

closeHelp.addEventListener('click', () => {
  helpModal.classList.add('hidden');
});

// モーダル外クリックで閉じる
window.addEventListener('click', (e) => {
  if (e.target === helpModal) {
    helpModal.classList.add('hidden');
  }
});


document.getElementById('startButton').addEventListener('click', () => {
  const input = document.getElementById('textInput').value.toUpperCase();
  for (const char of input) {
    if (char === " ") continue; // 空白はスキップ
    const code = morseMap[char];
    if (!code) {
      console.warn(`未対応の文字: ${char}`);
      continue;
    }
    const path = getPathFromCode(code);
    console.log(`「${char}」のモールス: ${code} → 経路: ${path.join(" > ")}`);
    // TODO: ツリー上の点灯処理をここに追加
  }
});

// 「・−・−」のようなモールス符号を受け取り、ツリー上の経路を返す
function getPathFromCode(code) {
  const path = [];
  let node = morseTree;
  for (const symbol of code) {
    if (symbol === "・") {
      node = node.left;
      path.push("left");
    } else if (symbol === "−") {
      node = node.right;
      path.push("right");
    } else {
      console.warn(`無効なモールス符号: ${symbol}`);
    }
    if (!node) break;
  }
  return path;
}


// タブ切り替え後に一覧表を初期化（1回だけ）
document.querySelectorAll('.tab-button').forEach(button => {
  button.addEventListener('click', () => {
    if (button.dataset.tab === "table") {
      initMorseTable();
    }
  });
});
