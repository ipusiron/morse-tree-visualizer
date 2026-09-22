import { MORSE_TABLE } from './morseMap.js';
import { buildTree } from './morseTree.js';
import { LETTER_FREQUENCY } from './frequency.js';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function unitsOf(code) {
  return [...code].reduce((total, symbol) => total + (symbol === '.' ? 1 : 3), 0) + code.length - 1;
}

function rounded(value, digits = 2) {
  return Number(value.toFixed(digits));
}

function huffmanAverage(weights) {
  const queue = weights.map(({ char, weight }) => ({ chars: char, weight, depth: 0 }));
  const lengths = new Map();
  while (queue.length > 1) {
    queue.sort((a, b) => a.weight - b.weight || a.chars.localeCompare(b.chars));
    const left = queue.shift();
    const right = queue.shift();
    for (const char of left.chars) lengths.set(char, (lengths.get(char) || 0) + 1);
    for (const char of right.chars) lengths.set(char, (lengths.get(char) || 0) + 1);
    queue.push({ chars: [...left.chars, ...right.chars].sort().join(''), weight: left.weight + right.weight });
  }
  return weights.reduce((sum, { char, weight }) => sum + weight * lengths.get(char), 0);
}

export function computeTrivia(table = MORSE_TABLE, freq = LETTER_FREQUENCY) {
  const letters = table.filter(entry => LETTERS.includes(entry.char));
  const total = Object.values(freq).reduce((sum, value) => sum + value, 0);
  const weights = letters.map(({ char }) => ({ char, weight: freq[char] / total }));
  const codeByChar = new Map(letters.map(({ char, code }) => [char, code]));
  const actualUnits = new Map(letters.map(({ char, code }) => [char, unitsOf(code)]));
  const avg = values => values.reduce((sum, value) => sum + value, 0) / values.length;
  const weighted = measure => weights.reduce((sum, { char, weight }) => sum + weight * measure(char), 0);
  const codesByLength = [...actualUnits.entries()].map(([char, units]) => ({ char, units }))
    .sort((a, b) => a.units - b.units || codeByChar.get(a.char).localeCompare(codeByChar.get(b.char)));
  const byFrequency = [...weights].sort((a, b) => b.weight - a.weight || a.char.localeCompare(b.char));
  const idealUnits = new Map(byFrequency.map(({ char }, index) => [char, codesByLength[index].units]));
  const longForFrequency = LETTERS.split('').filter(char => actualUnits.get(char) - idealUnits.get(char) >= 4)
    .map(char => ({ char, actual: actualUnits.get(char), ideal: idealUnits.get(char) }));
  const prefixPairs = entries => entries.flatMap(left => entries.filter(right => left !== right && right.code.startsWith(left.code))
    .map(right => left.char + '⊂' + right.char));
  const byLength = Array.from({ length: 6 }, (_, index) => {
    const length = index + 1;
    const entries = table.filter(entry => entry.code.length === length);
    return { possible: 2 ** length, used: entries.length, chars: entries.map(entry => entry.char).join('') };
  });
  const entropyBits = -weights.reduce((sum, { weight }) => sum + weight * Math.log2(weight), 0);
  const avgUnitUniform = avg([...actualUnits.values()]);
  const avgUnitWeighted = weighted(char => actualUnits.get(char));
  const reassignedUnits = weighted(char => idealUnits.get(char));
  return {
    avgElemUniform: avg(letters.map(entry => entry.code.length)),
    avgUnitUniform,
    avgElemWeighted: weighted(char => codeByChar.get(char).length),
    avgUnitWeighted,
    savingPct: (1 - avgUnitWeighted / avgUnitUniform) * 100,
    reassignedUnits,
    reassignedSavingPct: (1 - reassignedUnits / avgUnitWeighted) * 100,
    longForFrequency,
    fixedBits: Math.ceil(Math.log2(letters.length)),
    entropyBits,
    huffmanBits: huffmanAverage(weights),
    prefixPairsLetters: prefixPairs(letters).length,
    prefixPairsAll: prefixPairs(table).length,
    prefixExamples: prefixPairs(letters).slice(0, 6),
    byLength,
    fullTreeNodes: 2 ** 7 - 1,
    pathNodes: buildTree(table, 6).nodes.size
  };
}
