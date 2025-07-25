import { morseMap } from './morseMap.js';

let alreadyInitialized = false;

export function initMorseTable() {
  if (alreadyInitialized) return;
  alreadyInitialized = true;

  const container = document.getElementById("tab-table");
  if (!container) return;

  const wrapper = container.querySelector(".morse-table-wrapper");
  if (!wrapper) return;

  // グループ分け
  const groups = {
    英字: [],
    数字: [],
    記号: []
  };

  for (const [char, code] of Object.entries(morseMap)) {
    if (/^[A-Z]$/.test(char)) {
      groups["英字"].push([char, code]);
    } else if (/^[0-9]$/.test(char)) {
      groups["数字"].push([char, code]);
    } else {
      groups["記号"].push([char, code]);
    }
  }

  // 並び順を調整（記号はそのまま、英字・数字は昇順）
  groups["英字"].sort(([a], [b]) => a.localeCompare(b));
  groups["数字"].sort(([a], [b]) => a.localeCompare(b));

  // 各グループを描画
  for (const [title, entries] of Object.entries(groups)) {
    const groupDiv = document.createElement("div");
    groupDiv.className = "morse-table-group";

    const heading = document.createElement("h3");
    heading.textContent = title;
    groupDiv.appendChild(heading);

    const table = document.createElement("table");
    table.className = "morse-table";

    const tbody = document.createElement("tbody");

    for (const [char, code] of entries) {
      const row = document.createElement("tr");

      const tdChar = document.createElement("td");
      tdChar.textContent = char;

      const tdCode = document.createElement("td");
      tdCode.textContent = code;

      row.appendChild(tdChar);
      row.appendChild(tdCode);
      tbody.appendChild(row);
    }

    table.appendChild(tbody);
    groupDiv.appendChild(table);
    wrapper.appendChild(groupDiv);
  }
}
