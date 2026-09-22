// 英字・数字・記号をITUの掲載順に定義する。
const letters = '.- -... -.-. -.. . ..-. --. .... .. .--- -.- .-.. -- -. --- .--. --.- .-. ... - ..- ...- .-- -..- -.-- --..';
const digits = '.---- ..--- ...-- ....- ..... -.... --... ---.. ----. -----';
const punctuation = [
  ['.', '.-.-.-', 'Full stop'], [',', '--..--', 'Comma'], [':', '---...', 'Colon'],
  ['?', '..--..', 'Question mark'], ["'", '.----.', 'Apostrophe'], ['-', '-....-', 'Hyphen'],
  ['/', '-..-.', 'Fraction bar'], ['(', '-.--.', 'Left-hand bracket'], [')', '-.--.-', 'Right-hand bracket'],
  ['"', '.-..-.', 'Inverted commas'], ['=', '-...-', 'Double hyphen'], ['+', '.-.-.', 'Cross'],
  ['@', '.--.-.', 'Commercial at']
];
const customary = [
  ['!', '-.-.--', 'Exclamation mark'], ['&', '.-...', 'Ampersand'], [';', '-.-.-.', 'Semicolon'],
  ['_', '..--.-', 'Underscore'], ['$', '...-..-', 'Dollar sign']
];

export const MORSE_TABLE = [
  ...letters.split(' ').map((code, i) => ({ char: String.fromCharCode(65 + i), code, kind: 'letter', itu: true,
    name: String.fromCharCode(65 + i) })),
  { char: 'É', code: '..-..', kind: 'letter', itu: true, name: 'Accented e' },
  ...digits.split(' ').map((code, i) => ({ char: String((i + 1) % 10), code, kind: 'digit', itu: true,
    name: String((i + 1) % 10) })),
  ...punctuation.map(([char, code, name]) => ({ char, code, kind: 'punct', itu: true, name })),
  ...customary.map(([char, code, name]) => ({ char, code, kind: 'punct', itu: false, name }))
];
export const CHAR_TO_CODE = new Map(MORSE_TABLE.map(({ char, code }) => [char, code]));
export const CODE_TO_CHAR = new Map(MORSE_TABLE.map(({ char, code }) => [code, char]));
export const PROSIGNS = [
  ['AR', '.-.-.', 'Cross / End of message', '+'],
  ['SK', '...-.-', 'End of work'],
  ['BT', '-...-', 'Double hyphen / Separator', '='],
  ['KA', '-.-.-', 'Starting signal'],
  ['SN', '...-.', 'Understood'],
  ['HH', '........', 'Error (eight dots)'],
  ['K', '-.-', 'Invitation to transmit', 'K'],
  ['AS', '.-...', 'Wait', '&'],
  ['SOS', '...---...', 'Distress signal (customary as one sign)']
].map(([label, code, name, sameAs]) => ({
  label, code, name, ja: 'prosign.' + label, itu: label !== 'SOS', ...(sameAs ? { sameAs } : {})
}));
export const PROSIGN_BY_LABEL = new Map(PROSIGNS.map(p => [p.label, p]));
export const PROSIGN_BY_CODE = new Map(PROSIGNS.map(p => [p.code, p]));
export const NOTATIONS = {
  ja: { dot: '\u30fb', dash: '\u2212', letterGap: ' ', wordGap: ' / ' },
  ascii: { dot: '.', dash: '-', letterGap: ' ', wordGap: ' / ' }
};
export function formatCode(code, notation = 'ja') {
  const n = NOTATIONS[notation];
  if (!n) throw new RangeError('Unknown notation');
  return code.replace(/[.-]/g, c => c === '.' ? n.dot : n.dash);
}
