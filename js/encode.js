import { createTreeView } from './treeRenderer.js';
import { createAnimator } from './animator.js';
import { encode } from './morseCodec.js';
import { t } from './messages.js';
import { settings, bindSettings, describeChars, renderResult, bindPlayback } from './utils.js';
import { bindShareButton } from './utils.js';

export function initEncodeTab() {
  // モールスツリーを描画
  const view = createTreeView(document.getElementById('tree-container'));
  const animator = createAnimator(view);
  const startButton = document.getElementById('startButton');
  const inputText = document.getElementById('inputText');
  const resultDiv = document.getElementById('morseResult');
  const errorDiv = document.getElementById('encodeError');
  let canonical = '';
  let rows = [];
  let rendered = false;
  const run = bindPlayback(document.getElementById('encode-playback'), animator, () => canonical, () => rows);
  bindSettings();
  bindShareButton(document.getElementById('encodeShare'), inputText, 'text');

  function convert() {
    animator.stop();
    rendered = true;
    errorDiv.textContent = '';
    resultDiv.replaceChildren();
    canonical = '';
    const result = encode(inputText.value, settings.notation);
    if (!result.ok) {
      errorDiv.textContent = result.unknownProsign ? t('prosign.unknown', { label: result.unknownProsign })
        : t('error.unsupported_chars', { list: describeChars(result.unsupported) });
      return;
    }
    if (!result.items.length) {
      errorDiv.textContent = t('error.empty_text');
      return;
    }
    canonical = encode(inputText.value, 'ascii').morse;
    rows = renderResult(resultDiv, result.items, result.morse, 'encode');
    run();
  }
  startButton.addEventListener('click', convert);
  document.addEventListener('notation-change', () => { if (rendered) convert(); });
}
