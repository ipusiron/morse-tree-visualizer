import { morseMap } from './morseMap.js';
import { morseTree } from './morseTree.js';
import { renderMorseTree, highlightPath, clearHighlights } from './treeRenderer.js';

let alreadyInitialized = false;
let currentQuizAnswer = null;

const studyChars = [...Array(26)].map((_, i) => String.fromCharCode(65 + i))
  .concat([...Array(10)].map((_, i) => String(i)));

export function initStudyMode() {
  if (alreadyInitialized) return;
  alreadyInitialized = true;

  // --- サブタブ切り替え処理を初期化 ---
  const subtabButtons = document.querySelectorAll('#tab-study .subtab-button');
  const subtabContents = document.querySelectorAll('#tab-study .subtab-content');

  subtabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.subtab;

      // ボタンの active クラス更新
      subtabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // サブタブ表示切替
      subtabContents.forEach(content => {
        if (content.id === `subtab-${target}`) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });

      clearHighlights(); // 切り替え時にツリーのハイライトをリセット
    });
  });

  // --- 文字確認モード処理 ---
  const select = document.getElementById('manualCharSelect');
  const resultManual = document.getElementById('studyResultManual');
  if (select && resultManual) {
    for (const char of studyChars) {
      const opt = document.createElement('option');
      opt.value = char;
      opt.textContent = char;
      select.appendChild(opt);
    }

    select.addEventListener('change', () => {
      const char = select.value;
      if (!char) {
        resultManual.innerHTML = "";
        clearHighlights();
        return;
      }

      const code = morseMap[char];
      const path = getPathFromCode(code);
      highlightPath(path);

      resultManual.innerHTML = `
        <p><strong>選択文字：</strong> ${char}</p>
        <p><strong>モールス符号：</strong> ${code}</p>
        <p><strong>ツリー経路：</strong> ${path.join(" > ")}</p>
      `;
    });
  }

  // --- ランダム出題モード処理 ---
  const randomBtn = document.getElementById('randomQuizBtn');
  const quizContainer = document.getElementById('quizContainer');
  const quizCode = document.getElementById('quizCode');
  const checkBtn = document.getElementById('checkAnswerBtn');
  const input = document.getElementById('quizAnswer');
  const feedback = document.getElementById('quizFeedback');
  
  if (randomBtn && quizContainer) {
    randomBtn.addEventListener('click', () => {
      const randomChar = studyChars[Math.floor(Math.random() * studyChars.length)];
      const code = morseMap[randomChar];
      const path = getPathFromCode(code);
      currentQuizAnswer = randomChar;

      clearHighlights(); // 出題時は光らせない
      
      // 問題を表示
      quizContainer.style.display = 'block';
      quizCode.textContent = code;
      input.value = '';
      feedback.innerHTML = '';
    });

    if (checkBtn) {
      checkBtn.addEventListener('click', () => {
        const userInput = input.value.toUpperCase();
        if (!userInput) {
          feedback.textContent = "⚠ 文字を入力してください。";
          return;
        }

        if (userInput === currentQuizAnswer) {
          feedback.innerHTML = `<span style="color: green;">✅ 正解です！</span>`;
        } else {
          feedback.innerHTML = `<span style="color: red;">❌ 不正解です。正解は「${currentQuizAnswer}」でした。</span>`;
        }

        const path = getPathFromCode(morseMap[currentQuizAnswer]);
        highlightPath(path); // この時点でのみ光らせる
      });
    }
  }

  // ✅ タブ表示後にモールスツリー描画
  requestAnimationFrame(() => {
    const container = document.getElementById("tree-container-study");
    if (container?.offsetParent !== null) {
      renderMorseTree("tree-container-study");
    }
  });
}

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
    }
    if (!node) break;
  }
  return path;
}
