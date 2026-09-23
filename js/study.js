import { MORSE_TABLE, PROSIGNS, formatCode } from './morseMap.js';
import { pathFor, normalizeMorse, normalizeWabun } from './morseCodec.js';
import { currentTable } from './system.js';
import { createTreeView } from './treeRenderer.js';
import { createAnimator } from './animator.js';
import { t } from './messages.js';
import { el, msg, settings, bindPlayback } from './utils.js';
import { bindTabKeys } from './script.js';
import { setMessage } from './i18n.js';

export function quizPool(kinds, system = settings.system) {
  return currentTable(system).filter(e => kinds.includes(system === 'intl' && e.char === 'É' ? 'punct' : e.kind));
}

export function normalizeQuizCharacter(value, system = settings.system) {
  return system === 'wabun' ? normalizeWabun(value) : value.normalize('NFKC').toUpperCase();
}

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
  let manualEntries;
  function renderManualOptions() {
    const wabun = settings.system === 'wabun';
    manualEntries = wabun ? currentTable() : [...MORSE_TABLE, ...PROSIGNS.map(p => ({ ...p, char: `<${p.label}>` }))];
    select.replaceChildren();
    const groups = wabun ? ['kana', 'mark', 'digit', 'symbol'].map(kind => ['group.' + kind, e => e.kind === kind]) : [
      ['group.letter', e => e.kind === 'letter'], ['group.digit', e => e.kind === 'digit'],
      ['group.itu', e => e.kind === 'punct' && e.itu], ['group.custom', e => !e.itu]
    ];
    for (const [key, predicate] of groups) {
      const group = el('optgroup', { label: t(key), 'data-i18n-label': key });
      currentTable().filter(predicate).forEach(e => group.append(el('option', { value: e.char }, e.char)));
      select.append(group);
    }
    if (!wabun) {
      const group = el('optgroup', { label: t('group.prosign'), 'data-i18n-label': 'group.prosign' });
      PROSIGNS.forEach(p => group.append(el('option', { value: `<${p.label}>` }, `<${p.label}>`)));
      select.append(group);
    }
    select.value = manualEntries[0].char;
  }
  renderManualOptions();
  function showManual({ preserveView = false } = {}) {
    if (!preserveView) animator.stop();
    resultManual.replaceChildren();
    const entry = manualEntries.find(e => e.char === select.value);
    if (!entry) return;
    if (!preserveView) {
      view.highlight(entry.code);
      view.scrollToCode(entry.code);
    }
    for (const [key, value] of [['table.char', entry.char], ['table.code', formatCode(entry.code, settings.notation)],
      ['study.path', pathFor(entry.code).map(d => t(d === 'left' ? 'study.left' : 'study.right')).join(' › ')],
      ['table.kind', t(settings.system === 'wabun' ? 'wabun.standard' : entry.itu ? 'table.itu' : 'table.custom')]]) {
      resultManual.append(el('p', {}, [el('strong', {}, t(key) + ': '), value]));
    }
    if (entry.code.length > 6) resultManual.append(el('p', {}, t('tree.outside', { n: entry.code.length })));
  }
  select.addEventListener('change', showManual);
  bindPlayback(document.getElementById('study-playback'), animator, () => manualEntries.find(e => e.char === select.value)?.code || '');

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
    return quizPool(kinds);
  }
  function updateScore() {
    setMessage(score, 'quiz.score', { correct, total, streak });
  }
  function updateScope() {
    randomBtn.disabled = pool().length === 0;
    setMessage(document.getElementById('quizScopeStatus'), randomBtn.disabled ? 'quiz.scope_empty' : null);
  }
  function displayQuestion() {
    if (!currentQuizAnswer) return;
    quizCode.textContent = direction() === 'char' ? formatCode(currentQuizAnswer.code, settings.notation) : currentQuizAnswer.char;
    setMessage(document.getElementById('quizQuestion'), direction() === 'char' ? 'quiz.question_char' : 'quiz.question_code');
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
    setMessage(feedback, null);
    feedback.className = '';
    displayQuestion();
    updateScore();
    input.focus();
  }
  function checkAnswer() {
    if (!currentQuizAnswer || answered) return;
    if (!input.value.trim()) {
      setMessage(feedback, 'quiz.enter_answer');
      return;
    }
    const normalized = normalizeMorse(input.value);
    const good = direction() === 'char'
      ? normalizeQuizCharacter(input.value) === currentQuizAnswer.char
      : !normalized.unknown.length && normalized.canonical === currentQuizAnswer.code;
    answered = true;
    if (good) { correct++; streak++; } else streak = 0;
    setMessage(feedback, good ? 'quiz.correct' : 'quiz.wrong', {
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
  const scope = document.querySelector('[name="quiz-scope"]').closest('fieldset');
  function renderScope() {
    const kinds = settings.system === 'wabun' ? ['kana', 'mark', 'digit', 'symbol'] : ['letter', 'digit', 'punct'];
    scope.replaceChildren(msg('legend', 'quiz.scope'));
    for (const kind of kinds) {
      const check = el('input', { type: 'checkbox', name: 'quiz-scope', value: kind });
      check.checked = !['punct', 'symbol'].includes(kind);
      check.addEventListener('change', updateScope);
      scope.append(el('label', {}, [check, msg('span', 'group.' + kind)]));
    }
    updateScope();
  }
  document.querySelectorAll('[name="quiz-direction"]').forEach(e => e.addEventListener('change', () => {
    currentQuizAnswer = null;
    quizContainer.hidden = true;
    animator.stop();
  }));
  document.addEventListener('notation-change', () => { showManual(); displayQuestion(); });
  document.addEventListener('language-change', () => {
    if (resultManual.childNodes.length) showManual({ preserveView: true });
    displayQuestion();
  });
  document.addEventListener('system-change', () => {
    animator.reset();
    renderManualOptions();
    resultManual.replaceChildren();
    currentQuizAnswer = null;
    answered = false;
    total = correct = streak = 0;
    quizContainer.hidden = true;
    setMessage(feedback, null);
    renderScope();
    updateScore();
  });
  renderScope();
  updateScore();
}
