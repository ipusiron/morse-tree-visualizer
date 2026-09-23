import { createTreeView } from './treeRenderer.js';
import { createAnimator } from './animator.js';
import { decode, encode, normalizeMorse } from './morseCodec.js';
import { NOTATIONS } from './morseMap.js';
import { settings, describeChars, renderResult, bindPlayback, bindShareButton } from './utils.js';
import { setMessage } from './i18n.js';

export function initDecodeTab() {
  // モールスツリーを描画
  const view = createTreeView(document.getElementById('tree-container-decode'));
  const animator = createAnimator(view);
  const decodeButton = document.getElementById('decodeButton');
  const morseInput = document.getElementById('morseInput');
  const resultDiv = document.getElementById('decodeResult');
  const errorDiv = document.getElementById('decodeError');
  let canonical = '';
  let rows = [];
  let rendered = false;
  const run = bindPlayback(document.getElementById('decode-playback'), animator, () => canonical, () => rows);
  bindShareButton(document.getElementById('decodeShare'), morseInput, 'morse');

  function follow() {
    animator.stop();
    const normalized = normalizeMorse(morseInput.value);
    if (normalized.unknown.length || /[\s/|]$/.test(morseInput.value)) return;
    const code = normalized.canonical.split(' ').at(-1);
    if (code && view.highlight(code)) view.scrollToCode(code);
  }
  morseInput.addEventListener('input', event => { if (!event.isComposing) follow(); });
  morseInput.addEventListener('compositionend', follow);

  // カーソル位置に符号を挿入
  document.querySelectorAll('.morse-char-btn').forEach(button => {
    button.addEventListener('click', () => {
      const symbol = button.dataset.char;
      const char = symbol === '.' ? NOTATIONS[settings.notation].dot : symbol === '-' ? NOTATIONS[settings.notation].dash : symbol;
      morseInput.setRangeText(char, morseInput.selectionStart, morseInput.selectionEnd, 'end');
      morseInput.focus();
      morseInput.dispatchEvent(new Event('input'));
    });
  });
  document.querySelectorAll('[data-sample]').forEach(button => button.addEventListener('click', () => {
    morseInput.value = encode(button.dataset.sample, settings.notation).morse;
    morseInput.focus();
    morseInput.dispatchEvent(new Event('input'));
  }));

  function convert(autoplay = true) {
    animator.stop();
    rendered = true;
    canonical = '';
    setMessage(errorDiv, null);
    resultDiv.replaceChildren();
    const result = decode(morseInput.value);
    if (!result.ok) {
      if (result.unknown) setMessage(errorDiv, 'error.unknown_symbols', { list: describeChars(result.unknown) });
      else if (result.empty) setMessage(errorDiv, 'error.empty_morse');
      else setMessage(errorDiv, 'error.invalid_codes', { list: result.invalid.join(', ') });
      return;
    }
    canonical = result.canonical;
    rows = renderResult(resultDiv, result.words, result.text, 'decode');
    if (autoplay) run();
  }
  decodeButton.addEventListener('click', () => convert());
  decodeButton.addEventListener('convert-input', () => convert(false));
  morseInput.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      convert();
    }
  });
  function updateNotation() {
    for (const button of document.querySelectorAll('.morse-char-btn')) {
      if (button.dataset.char === '.') button.textContent = NOTATIONS[settings.notation].dot;
      if (button.dataset.char === '-') button.textContent = NOTATIONS[settings.notation].dash;
    }
    if (rendered) convert(false);
  }
  document.addEventListener('notation-change', updateNotation);
  updateNotation();
}
