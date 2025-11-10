/**
 * HTMLエスケープ関数
 * XSS攻撃を防ぐため、特殊文字をHTMLエンティティに変換
 */
export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 配列の要素をHTMLエスケープして結合
 */
export function escapeAndJoin(array, separator = ', ') {
  return array.map(escapeHtml).join(separator);
}
