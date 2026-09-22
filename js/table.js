import { MORSE_TABLE, PROSIGNS, formatCode } from './morseMap.js';
import { el, settings } from './utils.js';
import { t } from './messages.js';

export function initMorseTable() {
  const container = document.getElementById('tab-table');
  const wrapper = container.querySelector('.morse-table-wrapper');

  function render() {
    wrapper.replaceChildren();
    // 各グループを文字表の順に描画する。
    for (const kind of ['letter', 'digit', 'punct', 'prosign']) {
      const entries = kind === 'prosign' ? PROSIGNS.map(p => ({ ...p, char: `<${p.label}>` })) : MORSE_TABLE.filter(e => e.kind === kind);
      const groupDiv = el('div', { class: 'morse-table-group' });
      const heading = el('h3', {}, t('group.' + kind) + ' (' + entries.length + ')');
      groupDiv.appendChild(heading);
      const table = el('table', { class: 'morse-table' });
      const header = el('tr');
      for (const key of ['table.char', 'table.code', 'table.kind', 'table.name']) header.append(el('th', { scope: 'col' }, t(key)));
      if (kind === 'prosign') header.append(el('th', { scope: 'col' }, t('table.note')));
      table.append(el('thead', {}, header));
      const tbody = el('tbody');
      for (const entry of entries) {
        const row = el('tr', { 'data-char': entry.char });
        row.append(el('td', {}, entry.char), el('td', {}, formatCode(entry.code, settings.notation)),
          el('td', {}, el('span', { class: entry.itu ? 'badge itu' : 'badge custom' }, t(entry.itu ? 'table.itu' : 'table.custom'))),
          el('td', {}, entry.name));
        if (entry.char === '&') row.lastChild.append(el('p', {}, t('table.wait')));
        if (entry.ja) row.append(el('td', {}, t(entry.ja)));
        tbody.append(row);
      }
      table.append(tbody);
      groupDiv.append(table);
      wrapper.append(groupDiv);
    }
  }
  render();
  document.addEventListener('notation-change', render);
}
