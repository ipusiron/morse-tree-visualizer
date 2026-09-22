let view;
let animator;
import { morseMap } from './morseMap.js';

import { createTreeView } from './treeRenderer.js';
import { createAnimator } from './animator.js';
import { normalizeMorse, pathFor, timeline } from './morseCodec.js';

let alreadyInitialized = false;
let currentQuizAnswer = null;

const studyChars = [...Array(26)].map((_, i) => String.fromCharCode(65 + i))
  .concat([...Array(10)].map((_, i) => String(i)));

export function initStudyMode() {
  if (alreadyInitialized) return;
  alreadyInitialized = true;
  view = createTreeView(document.getElementById('tree-container-study'));
  animator = createAnimator(view);
  document.addEventListener('tab-switch', () => animator.stop());

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

      view.clear(); // 切り替え時にツリーのハイライトをリセット
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
        view.clear();
        return;
      }

      const code = morseMap[char];
      const path = getPathFromCode(code);
      view.highlight(path.map(d => d === 'left' ? '.' : '-').join(''));

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

      view.clear(); // 出題時は光らせない
      
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
        view.highlight(path.map(d => d === 'left' ? '.' : '-').join('')); // この時点でのみ光らせる
      });
    }
  }


}

function getPathFromCode(code) {
  return pathFor(normalizeMorse(code).canonical);
}
