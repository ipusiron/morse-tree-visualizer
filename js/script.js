import { initStudyMode } from './study.js';
import { initMorseTable } from './table.js';
import { initKeying } from './keying.js';
import { parseShare } from './share.js';
import { t, getLang } from './messages.js';
import { initialLang, applyLanguage, writeLang, setMessage } from './i18n.js';
import { initTheme } from './theme.js';
import { initLayout, changeLayout } from './layout.js';
import { TRIVIA_CARDS, formatTrivia, fillTriviaBody } from './trivia.js';
import { el, settings } from './utils.js';

import { initEncodeTab } from './encode.js';
import { initDecodeTab } from './decode.js';

let tableInitialized = false;
let studyInitialized = false;
let encodeInitialized = false;
let decodeInitialized = false;
let keyingInitialized = false;
let triviaInitialized = false;

document.addEventListener('DOMContentLoaded', () => {
  const lang = initialLang(location.search, navigator.language);
  settings.notation = lang === 'en' ? 'ascii' : 'ja';
  document.querySelectorAll('[name="notation"]').forEach(input => { input.checked = input.value === settings.notation; });
  applyLanguage(lang);
  document.getElementById('langToggle').addEventListener('click', () => {
    applyLanguage(getLang() === 'ja' ? 'en' : 'ja');
    writeLang(getLang());
  });
  initTheme();
  initLayout();
  const tabButtons = document.querySelectorAll('.tab-button');

  switchTab('encode');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.dataset.tab;
      switchTab(tabId);
    });
  });
  bindTabKeys(tabButtons);
  const share = parseShare(location.search);
  if (share.ok) {
    applyInput(share.kind, share.value);
  } else if (share.errorKey !== 'share.none') setMessage(document.getElementById('shareStatus'), share.errorKey);

  // ヘルプモーダル開閉処理
  const helpButton = document.getElementById('helpBtn');
  const helpModal = document.getElementById('helpModal');
  const closeModal = document.getElementById('closeHelp');

  if (helpButton && helpModal && closeModal) {
    helpButton.addEventListener('click', (e) => {
      e.preventDefault();
      helpModal.hidden = false;
      closeModal.focus();
    });

    const close = () => {
      helpModal.hidden = true;
      helpButton.focus();
    };
    closeModal.addEventListener('click', close);

    window.addEventListener('click', (event) => {
      if (event.target === helpModal) {
        close();
      }
    });
    helpModal.addEventListener('keydown', event => {
      if (event.key === 'Escape') close();
      if (event.key !== 'Tab') return;
      const focusable = [...helpModal.querySelectorAll('button, a[href], [tabindex="0"]')];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }
});

export function switchTab(tabId) {
  document.dispatchEvent(new Event('tab-switch'));
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(btn => {
    const selected = btn.dataset.tab === tabId;
    btn.classList.toggle('active', selected);
    btn.setAttribute('aria-selected', String(selected));
    btn.tabIndex = selected ? 0 : -1;
  });
  tabContents.forEach(tab => {
    tab.classList.remove('active');
    tab.hidden = tab.id !== `tab-${tabId}`;
  });

  const targetTab = document.getElementById(`tab-${tabId}`);
  const activeButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`);

  if (targetTab) targetTab.classList.add('active');
  if (activeButton) activeButton.classList.add('active');

  if (tabId === 'trivia' && !triviaInitialized) {
    initTriviaTab();
    triviaInitialized = true;
  } else if (tabId === 'keying' && !keyingInitialized) {
    initKeying();
    keyingInitialized = true;
  } else if (tabId === 'table' && !tableInitialized) {
    initMorseTable();
    tableInitialized = true;
  } else if (tabId === 'study') {
    if (!studyInitialized) {
      initStudyMode();
      studyInitialized = true;
    }

  } else if (tabId === 'encode') {
    if (!encodeInitialized) {
      initEncodeTab();
      encodeInitialized = true;
    }
  } else if (tabId === 'decode') {
    if (!decodeInitialized) {
      initDecodeTab();
      decodeInitialized = true;
    }
  }
}

function applyInput(kind, value) {
  const encoded = kind === 'text';
  switchTab(encoded ? 'encode' : 'decode');
  document.getElementById(encoded ? 'inputText' : 'morseInput').value = value;
  document.getElementById(encoded ? 'startButton' : 'decodeButton').dispatchEvent(new Event('convert-input'));
  document.dispatchEvent(new Event('share-loaded'));
}

function tryTrivia(action) {
  if (action.layout) changeLayout(action.layout);
  if (action.lamp && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    settings.lamp = true;
    document.dispatchEvent(new Event('playback-settings'));
  }
  if (action.text !== undefined) applyInput('text', action.text);
  else if (action.morse !== undefined) applyInput('morse', action.morse);
  else switchTab(action.tab);
  document.getElementById('tab-button-' + action.tab).focus();
}

function initTriviaTab() {
  const panel = document.getElementById('tab-trivia');
  const grid = panel.querySelector('.trivia-grid');
  const count = document.getElementById('triviaCount');
  const values = formatTrivia();
  const cards = TRIVIA_CARDS.map(card => {
    const article = el('article', { class: 'trivia-card', 'data-field': card.field, 'data-id': card.id }, [
      el('span', { class: 'trivia-field' }, t('trivia.' + card.field)), el('h3', {}, card.title),
      ...fillTriviaBody(card, values).map(paragraph => el('p', {}, paragraph))
    ]);
    const source = el('p', { class: 'trivia-source' }, t('trivia.source'));
    [card.source, card.source.secondary].filter(Boolean).forEach((entry, index) => {
      if (index) source.append(document.createTextNode(' / '));
      source.append(el('a', { href: entry.url, target: '_blank', rel: 'noopener noreferrer' }, entry.label));
    });
    article.append(source);
    if (card.action) {
      const button = el('button', { type: 'button', class: 'trivia-try' }, t('trivia.try'));
      button.addEventListener('click', () => tryTrivia(card.action));
      article.append(button);
    }
    grid.append(article);
    return article;
  });
  const chips = [...panel.querySelectorAll('.chip')];
  function filter(field) {
    for (const chip of chips) chip.setAttribute('aria-pressed', String(chip.dataset.field === field));
    for (const article of cards) article.hidden = field !== 'all' && article.dataset.field !== field;
    count.textContent = t('trivia.count', { field: t('trivia.' + field), count: cards.filter(card => !card.hidden).length });
  }
  chips.forEach(chip => chip.addEventListener('click', () => filter(chip.dataset.field)));
  filter('all');
}

// 同じキーボード規則をメインタブとサブタブに適用する。
export function bindTabKeys(buttons) {
  buttons = [...buttons];
  buttons.forEach((button, index) => button.addEventListener('keydown', event => {
    const destinations = {
      ArrowLeft: (index - 1 + buttons.length) % buttons.length,
      ArrowRight: (index + 1) % buttons.length, Home: 0, End: buttons.length - 1
    };
    if (!(event.key in destinations)) return;
    event.preventDefault();
    const target = buttons[destinations[event.key]];
    target.click();
    target.focus();
  }));
}
