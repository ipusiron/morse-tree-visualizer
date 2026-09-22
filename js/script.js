import { initStudyMode } from './study.js';
import { initMorseTable } from './table.js';
import { initKeying } from './keying.js';
import { parseShare } from './share.js';
import { t } from './messages.js';
import { initTheme } from './theme.js';

import { initEncodeTab } from './encode.js';
import { initDecodeTab } from './decode.js';

let tableInitialized = false;
let studyInitialized = false;
let encodeInitialized = false;
let decodeInitialized = false;
let keyingInitialized = false;

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
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
    const encoded = share.kind === 'text';
    switchTab(encoded ? 'encode' : 'decode');
    document.getElementById(encoded ? 'inputText' : 'morseInput').value = share.value;
    document.getElementById(encoded ? 'startButton' : 'decodeButton').click();
    document.dispatchEvent(new Event('share-loaded'));
  } else if (share.errorKey !== 'share.none') document.getElementById('shareStatus').textContent = t(share.errorKey);

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

  if (tabId === 'keying' && !keyingInitialized) {
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
