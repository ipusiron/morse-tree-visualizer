import { initStudyMode } from './study.js';
import { initMorseTable } from './table.js';
import { renderMorseTree } from './treeRenderer.js';
import { initEncodeTab } from './encode.js';

let tableInitialized = false;
let studyInitialized = false;
let encodeInitialized = false;

document.addEventListener('DOMContentLoaded', () => {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  switchTab('encode');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.dataset.tab;
      switchTab(tabId);
    });
  });

  // ヘルプモーダル開閉処理
  const helpButton = document.getElementById('helpBtn');
  const helpModal = document.getElementById('helpModal');
  const closeModal = document.getElementById('closeHelp');

  if (helpButton && helpModal && closeModal) {
    helpButton.addEventListener('click', (e) => {
      e.preventDefault();
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
});

function switchTab(tabId) {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(btn => btn.classList.remove('active'));
  tabContents.forEach(tab => tab.classList.remove('active'));

  const targetTab = document.getElementById(`tab-${tabId}`);
  const activeButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`);

  if (targetTab) targetTab.classList.add('active');
  if (activeButton) activeButton.classList.add('active');

  if (tabId === 'table' && !tableInitialized) {
    initMorseTable();
    tableInitialized = true;
  } else if (tabId === 'study') {
    if (!studyInitialized) {
      initStudyMode();
      studyInitialized = true;
    }
    requestAnimationFrame(() => {
      const container = document.getElementById("tree-container-study");
      if (container?.offsetParent !== null) {
        renderMorseTree("tree-container-study");
      }
    });
  } else if (tabId === 'encode') {
    if (!encodeInitialized) {
      initEncodeTab();
      encodeInitialized = true;
    }
  }
}
