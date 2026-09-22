export function parseShare(search) {
  const params = new URLSearchParams(String(search).replace(/^\?/, ''));
  const text = params.get('text');
  const morse = params.get('morse');
  if (text !== null && morse !== null) return { ok: false, errorKey: 'share.both' };
  const value = text !== null ? text : morse;
  if (value === null) return { ok: false, errorKey: 'share.none' };
  if (value.length > 1000) return { ok: false, errorKey: 'share.too_long', length: value.length };
  return { ok: true, kind: text !== null ? 'text' : 'morse', value };
}

export function formatShare(kind, value) {
  if (!['text', 'morse'].includes(kind)) throw new RangeError('Invalid share kind');
  if (typeof value !== 'string' || value.length > 1000) throw new RangeError('Invalid share value');
  return `?${kind}=${encodeURIComponent(value)}`;
}
