import { MORSE_TABLE, PROSIGNS, formatCode } from './morseMap.js';
import { el, msg, settings } from './utils.js';
import { getLang } from './messages.js';
import { setMessage } from './i18n.js';

export function initMorseTable() {
  const container = document.getElementById('tab-table');
  const wrapper = container.querySelector('.morse-table-wrapper');

  function render() {
    wrapper.replaceChildren();
    // 各グループを文字表の順に描画する。
    for (const kind of ['letter', 'digit', 'punct', 'prosign']) {
      const entries = kind === 'prosign' ? PROSIGNS.map(p => ({ ...p, char: `<${p.label}>` })) : MORSE_TABLE.filter(e => e.kind === kind);
      const headingId = 'table-heading-' + kind;
      const groupDiv = el('div', { class: 'morse-table-group', tabindex: 0, role: 'region', 'aria-labelledby': headingId });
      const heading = el('h3', { id: headingId }, [msg('span', 'group.' + kind), ' (' + entries.length + ')']);
      groupDiv.appendChild(heading);
      const table = el('table', { class: 'morse-table' });
      const header = el('tr');
      for (const key of ['table.char', 'table.code', 'table.kind', 'table.name']) header.append(msg('th', key, {}, { scope: 'col' }));
      if (kind === 'prosign') header.append(msg('th', 'table.note', {}, { scope: 'col' }));
      table.append(el('thead', {}, header));
      const tbody = el('tbody');
      for (const entry of entries) {
        const row = el('tr', { 'data-char': entry.char });
        row.append(el('td', {}, entry.char), el('td', {}, formatCode(entry.code, settings.notation)),
          el('td', {}, msg('span', entry.itu ? 'table.itu' : 'table.custom', {}, { class: entry.itu ? 'badge itu' : 'badge custom' })),
          el('td', {}, entry.name));
        if (entry.char === '&') row.lastChild.append(msg('p', 'table.wait'));
        if (entry.ja) row.append(msg('td', entry.ja));
        tbody.append(row);
      }
      table.append(tbody);
      groupDiv.append(table);
      wrapper.append(groupDiv);
    }
  }
  render();
  renderPrintSheet();
  document.getElementById('printTable').addEventListener('click', () => { renderPrintSheet(); window.print(); });
  window.addEventListener('beforeprint', renderPrintSheet);
  document.addEventListener('notation-change', render);
  document.addEventListener('language-change', () => updatePrintDate());
}

export function formatPrintDate(date = new Date(), lang = getLang()) {
  if (lang === 'ja') return date.toLocaleDateString('ja-JP');
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

function updatePrintDate() {
  const node = document.getElementById('printDate');
  if (node) setMessage(node, 'print.date', { date: formatPrintDate() });
}

export function renderPrintSheet() {
  const sheet = document.getElementById('printSheet');
  sheet.replaceChildren(msg('h1', 'print.title'), msg('p', 'print.date', { date: formatPrintDate() }, { id: 'printDate' }));
  const columns = el('div', { class: 'print-columns' }, [el('div'), el('div')]);
  for (const [index, kind] of ['letter', 'digit', 'punct', 'prosign'].entries()) {
    const entries = kind === 'prosign' ? PROSIGNS.map(p => ({ ...p, char: `<${p.label}>` })) : MORSE_TABLE.filter(e => e.kind === kind);
    const table = el('table');
    const body = el('tbody');
    for (const entry of entries) body.append(el('tr', {}, [
      el('td', {}, entry.char), el('td', {}, formatCode(entry.code, 'ja')), el('td', {}, entry.code),
      msg('td', entry.itu ? 'table.itu' : 'table.custom')
    ]));
    table.append(body);
    columns.children[index < 2 ? 0 : 1].append(msg('h2', 'group.' + kind), table);
  }
  sheet.append(columns, msg('p', 'print.note'),
    el('p', {}, 'https://ipusiron.github.io/morse-tree-visualizer/'));
}
