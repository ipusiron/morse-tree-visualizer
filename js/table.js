import { PROSIGNS, formatCode } from './morseMap.js';
import { el, msg, settings } from './utils.js';
import { getLang } from './messages.js';
import { setMessage } from './i18n.js';
import { currentTable } from './system.js';

export function tableGroups(system = settings.system) {
  const kinds = system === 'wabun' ? ['kana', 'mark', 'digit', 'symbol'] : ['letter', 'digit', 'punct', 'prosign'];
  return kinds.map(kind => ({ kind, entries: kind === 'prosign'
    ? PROSIGNS.map(p => ({ ...p, char: `<${p.label}>` })) : currentTable(system).filter(e => e.kind === kind) }));
}

function nameCell(entry) {
  if (entry.name) return msg('td', entry.name);
  return el('td', { 'data-romaji': entry.romaji ?? '' }, getLang() === 'en' ? entry.romaji ?? '' : '');
}

function updateRomaji() {
  document.querySelectorAll('[data-romaji]').forEach(node => { node.textContent = getLang() === 'en' ? node.dataset.romaji : ''; });
}

export function initMorseTable() {
  const container = document.getElementById('tab-table');
  const wrapper = container.querySelector('.morse-table-wrapper');

  function render() {
    wrapper.replaceChildren();
    // 各グループを文字表の順に描画する。
    const wabun = settings.system === 'wabun';
    for (const { kind, entries } of tableGroups()) {
      const headingId = 'table-heading-' + kind;
      const groupDiv = el('div', { class: 'morse-table-group', tabindex: 0, role: 'region', 'aria-labelledby': headingId });
      const heading = el('h3', { id: headingId }, [msg('span', 'group.' + kind), ' (' + entries.length + ')']);
      groupDiv.appendChild(heading);
      const table = el('table', { class: 'morse-table' });
      const header = el('tr');
      const keys = wabun ? ['table.char', 'table.code', 'wabun.name'] : ['table.char', 'table.code', 'table.kind', 'table.name'];
      for (const key of keys) header.append(msg('th', key, {}, { scope: 'col' }));
      if (kind === 'prosign') header.append(msg('th', 'table.note', {}, { scope: 'col' }));
      table.append(el('thead', {}, header));
      const tbody = el('tbody');
      for (const entry of entries) {
        const row = el('tr', { 'data-char': entry.char });
        row.append(el('td', {}, entry.char), el('td', {}, formatCode(entry.code, settings.notation)));
        if (wabun) row.append(nameCell(entry));
        else row.append(
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
  document.addEventListener('language-change', () => { updatePrintDate(); updateRomaji(); });
  document.addEventListener('system-change', () => { render(); renderPrintSheet(); });
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
  const wabun = settings.system === 'wabun';
  sheet.setAttribute('data-system', settings.system);
  sheet.replaceChildren(msg('h1', wabun ? 'wabun.print_title' : 'print.title'),
    msg('p', 'print.date', { date: formatPrintDate() }, { id: 'printDate' }));
  const columns = el('div', { class: 'print-columns' }, [el('div'), el('div')]);
  const groups = tableGroups();
  // Split the 48 kana across columns; keep all 65 rows, without an overlong single-column kana table.
  const printGroups = wabun ? [
    { kind: 'kana', entries: groups[0].entries.slice(0, 33), column: 0 },
    { kind: 'kana', entries: groups[0].entries.slice(33), column: 1 },
    ...groups.slice(1).map(group => ({ ...group, column: 1 }))
  ] : groups.map((group, index) => ({ ...group, column: index < 2 ? 0 : 1 }));
  for (const { kind, entries, column } of printGroups) {
    const table = el('table');
    const body = el('tbody');
    for (const entry of entries) body.append(el('tr', {}, [
      el('td', {}, entry.char), el('td', {}, formatCode(entry.code, 'ja')), el('td', {}, entry.code),
      wabun ? nameCell(entry) : msg('td', entry.itu ? 'table.itu' : 'table.custom')
    ]));
    table.append(body);
    columns.children[column].append(msg('h2', 'group.' + kind), table);
  }
  sheet.append(columns, msg('p', wabun ? 'wabun.print_note' : 'print.note'),
    el('p', {}, 'https://ipusiron.github.io/morse-tree-visualizer/'));
}
