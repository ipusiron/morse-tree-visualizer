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

  const select = document.getElementById('manualCharSelect');
  const result = document.getElementById('studyResult');
  const randomBtn = document.getElementById('randomQuizBtn');

  if (!select || !result || !randomBtn) return;

  for (const char of studyChars) {
    const opt = document.createElement('option');
    opt.value = char;
    opt.textContent = char;
    select.appendChild(opt);
  }

  select.addEventListener('change', () => {
    const char = select.value;
    if (!char) {
      result.innerHTML = "";
      clearHighlights();
      return;
    }

    const code = morseMap[char];
    const path = getPathFromCode(code);
    highlightPath(path);

    result.innerHTML = `
      <p><strong>選択文字：</strong> ${char}</p>
      <p><strong>モールス符号：</strong> ${code}</p>
      <p><strong>ツリー経路：</strong> ${path.join(" > ")}</p>
    `;
  });

  randomBtn.addEventListener('click', () => {
    const randomChar = studyChars[Math.floor(Math.random() * studyChars.length)];
    const code = morseMap[randomChar];
    const path = getPathFromCode(code);
    currentQuizAnswer = randomChar;
    highlightPath(path);

    result.innerHTML = `
      <div id="quizContainer">
        <p>このモールス符号はどの文字？</p>
        <div id="quizCode">${code}</div>
        <input type="text" id="quizAnswer" maxlength="1" />
        <button id="checkAnswerBtn">答え合わせ</button>
        <div id="quizFeedback"></div>
      </div>
    `;

    const checkBtn = document.getElementById('checkAnswerBtn');
    const input = document.getElementById('quizAnswer');
    const feedback = document.getElementById('quizFeedback');

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
    });
  });

  // ✅ タブの描画が完了した後にモールスツリーを描画（1フレーム遅らせて確実に）
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
