export const MESSAGES = {
  'error.empty_text': 'テキストを入力してください。',
  'error.unsupported_chars': '⚠ 以下の文字は変換できません: {list}',
  'error.empty_morse': 'モールス信号を入力してください。',
  'error.unknown_symbols': '⚠ 以下の記号は認識できません: {list}',
  'error.invalid_codes': '⚠ 以下のモールス信号は対応する文字がありません: {list}',
  'result.morse_heading': '変換結果',
  'result.text_heading': '復号結果',
  'copy.button': '📋 コピー',
  'copy.done': 'コピーしました。',
  'copy.failed': 'コピーできませんでした。手動で選択してコピーしてください。',
  'quiz.correct': '✅ 正解です。',
  'quiz.wrong': '❌ 不正解です。正解は「{answer}」でした。',
  'quiz.enter_answer': '答えを入力してください。',
  'tree.outside': '木の外（{n}符号）',
  'tree.dir_dot': '← ・（ドット）',
  'tree.dir_dash': '−（ダッシュ） →',
  'tree.depth': '{n}符号',
  'tree.label': 'モールスの木。左はドット、右はダッシュです。',
  'table.itu': 'ITU',
  'table.custom': '慣用',
  'anim.play': '▶ 再生',
  'anim.pause': '⏸ 一時停止',
  'anim.resume': '▶ 再開',
  'anim.stop': '■ 停止'
};

export function t(key, params = {}) {
  if (!Object.hasOwn(MESSAGES, key)) throw new Error(`Unknown message: ${key}`);
  return MESSAGES[key].replace(/\{(\w+)\}/g, (_, name) => {
    if (!Object.hasOwn(params, name)) throw new Error(`Missing parameter: ${name}`);
    return String(params[name]);
  });
}
