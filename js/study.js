import { MORSE_TABLE, formatCode } from './morseMap.js';
import { pathFor, normalizeMorse, timeline } from './morseCodec.js';
import { createTreeView } from './treeRenderer.js';
import { createAnimator } from './animator.js';
import { t } from './messages.js';
import { el, settings, bindPlayback } from './utils.js';
import { bindTabKeys } from './script.js';

export function initStudyMode() {
  const view = createTreeView(document.getElementById('tree-container-study'));
  const animator = createAnimator(view);
  let currentQuizAnswer = null;
  let answered = false;
  let total = 0;
  let correct = 0;
  let streak = 0;
  document.addEventListener('tab-switch', () => animator.pause());

  // サブタブ切り替え時は点灯と再生をリセットする。
  const subtabButtons = document.querySelectorAll('#tab-study .subtab-button');
  const subtabContents = document.querySelectorAll('#tab-study .subtab-content');
  subtabButtons.forEach(btn => btn.addEventListener('click', () => {
    subtabButtons.forEach(b => {
      b.classList.toggle('active', b === btn);
      b.setAttribute('aria-selected', String(b === btn));
      b.tabIndex = b === btn ? 0 : -1;
    });
    subtabContents.forEach(content => {
      content.hidden = content.id !== 'subtab-' + btn.dataset.subtab;
      content.classList.toggle('active', !content.hidden);
    });
    animator.stop();
  }));
  bindTabKeys(subtabButtons);

  // 文字確認。文字表と同じ順を保つ。
  const select = document.getElementById('manualCharSelect');
  const resultManual = document.getElementById('studyResultManual');
  for (const [key, predicate] of [
    ['group.letter', e => e.kind === 'letter'], ['group.digit', e => e.kind === 'digit'],
    ['group.itu', e => e.kind === 'punct' && e.itu], ['group.custom', e => !e.itu]
  ]) {
    const group = el('optgroup', { label: t(key) });
    MORSE_TABLE.filter(predicate).forEach(e => group.append(el('option', { value: e.char }, e.char)));
    select.append(group);
  }
  function showManual() {
    animator.stop();
    resultManual.replaceChildren();
    const entry = MORSE_TABLE.find(e => e.char === select.value);
    if (!entry) return;
    view.highlight(entry.code);
    view.scrollToCode(entry.code);
    for (const [key, value] of [['table.char', entry.char], ['table.code', formatCode(entry.code, settings.notation)],
      ['study.path', pathFor(entry.code).map(d => t(d === 'left' ? 'study.left' : 'study.right')).join(' › ')],
      ['table.kind', t(entry.itu ? 'table.itu' : 'table.custom')]]) {
      resultManual.append(el('p', {}, [el('strong', {}, t(key) + ': '), value]));
    }
    if (entry.code.length > 6) resultManual.append(el('p', {}, t('tree.outside', { n: entry.code.length })));
  }
  select.addEventListener('change', showManual);
  bindPlayback(document.getElementById('study-playback'), animator, () => MORSE_TABLE.find(e => e.char === select.value)?.code || '');

  // セッション内のランダム出題と成績。
  const randomBtn = document.getElementById('randomQuizBtn');
  const quizContainer = document.getElementById('quizContainer');
  const quizCode = document.getElementById('quizCode');
  const checkBtn = document.getElementById('checkAnswerBtn');
  const input = document.getElementById('quizAnswer');
  const feedback = document.getElementById('quizFeedback');
  const score = document.getElementById('quizScore');
  const direction = () => document.querySelector('[name="quiz-direction"]:checked').value;
  function pool() {
    const kinds = [...document.querySelectorAll('[name="quiz-scope"]:checked')].map(e => e.value);
    return MORSE_TABLE.filter(e => kinds.includes(e.char === 'É' ? 'punct' : e.kind));
  }
  function updateScore() {
    score.textContent = t('quiz.score', { correct, total, streak });
  }
  function updateScope() {
    randomBtn.disabled = pool().length === 0;
    document.getElementById('quizScopeStatus').textContent = randomBtn.disabled ? t('quiz.scope_empty') : '';
  }
  function displayQuestion() {
    if (!currentQuizAnswer) return;
    quizCode.textContent = direction() === 'char' ? formatCode(currentQuizAnswer.code, settings.notation) : currentQuizAnswer.char;
    document.getElementById('quizQuestion').textContent = t(direction() === 'char' ? 'quiz.question_char' : 'quiz.question_code');
    if (direction() === 'char') input.setAttribute('maxlength', '1');
    else input.removeAttribute('maxlength');
  }
  function nextQuestion() {
    // Remove the previous item before sampling, including under deterministic tests.
    const choices = pool().filter(e => e !== currentQuizAnswer);
    if (!choices.length) return;
    const random = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / choices.length) * choices.length;
    do { crypto.getRandomValues(random); } while (random[0] >= limit);
    currentQuizAnswer = choices[random[0] % choices.length];
    answered = false;
    total++;
    animator.stop();
    quizContainer.hidden = false;
    input.value = '';
    feedback.textContent = '';
    feedback.className = '';
    displayQuestion();
    updateScore();
    input.focus();
  }
  function checkAnswer() {
    if (!currentQuizAnswer || answered) return;
    if (!input.value.trim()) {
      feedback.textContent = t('quiz.enter_answer');
      return;
    }
    const normalized = normalizeMorse(input.value);
    const good = direction() === 'char'
      ? input.value.normalize('NFKC').toUpperCase() === currentQuizAnswer.char
      : !normalized.unknown.length && normalized.canonical === currentQuizAnswer.code;
    answered = true;
    if (good) { correct++; streak++; } else streak = 0;
    feedback.textContent = good ? t('quiz.correct') : t('quiz.wrong', {
      answer: direction() === 'char' ? currentQuizAnswer.char : formatCode(currentQuizAnswer.code, settings.notation)
    });
    feedback.className = good ? 'quiz-correct' : 'quiz-wrong';
    view.clear();
    view.highlight(currentQuizAnswer.code);
    view.scrollToCode(currentQuizAnswer.code);
    updateScore();
  }
  randomBtn.addEventListener('click', nextQuestion);
  document.getElementById('nextQuizBtn').addEventListener('click', nextQuestion);
  checkBtn.addEventListener('click', checkAnswer);
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.isComposing) {
      event.preventDefault();
      if (answered) nextQuestion(); else checkAnswer();
    }
  });
  document.querySelectorAll('[name="quiz-scope"]').forEach(e => e.addEventListener('change', updateScope));
  document.querySelectorAll('[name="quiz-direction"]').forEach(e => e.addEventListener('change', () => {
    currentQuizAnswer = null;
    quizContainer.hidden = true;
    animator.stop();
  }));
  document.addEventListener('notation-change', () => { showManual(); displayQuestion(); });
  updateScope();
  updateScore();
}
