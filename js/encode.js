import { createTreeView } from './treeRenderer.js';
import { createAnimator } from './animator.js';
import { encode } from './morseCodec.js';
import { settings, bindSettings, describeChars, renderResult, bindPlayback } from './utils.js';
import { bindShareButton } from './utils.js';
import { setMessage } from './i18n.js';

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

  function convert(autoplay = true) {
    animator.stop();
    rendered = true;
    setMessage(errorDiv, null);
    resultDiv.replaceChildren();
    canonical = '';
    const result = encode(inputText.value, settings.notation);
    if (!result.ok) {
      if (result.unknownProsign) setMessage(errorDiv, 'prosign.unknown', { label: result.unknownProsign });
      else setMessage(errorDiv, 'error.unsupported_chars', { list: describeChars(result.unsupported) });
      return;
    }
    if (!result.items.length) {
      setMessage(errorDiv, 'error.empty_text');
      return;
    }
    canonical = encode(inputText.value, 'ascii').morse;
    rows = renderResult(resultDiv, result.items, result.morse, 'encode');
    if (autoplay) run();
  }
  startButton.addEventListener('click', () => convert());
  startButton.addEventListener('convert-input', () => convert(false));
  document.addEventListener('notation-change', () => { if (rendered) convert(false); });
}
