import { MORSE_TABLE } from './morseMap.js';
import { buildTree } from './morseTree.js';
import { LETTER_FREQUENCY } from './frequency.js';
import { getLang } from './messages.js';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function unitsOf(code) {
  return [...code].reduce((total, symbol) => total + (symbol === '.' ? 1 : 3), 0) + code.length - 1;
}

function huffmanAverage(weights) {
  const queue = weights.map(({ char, weight }) => ({ chars: char, weight }));
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

const ITU = 'https://www.itu.int/rec/R-REC-M.1677-1-200910-I/en';
const ituSource = label => ({ label: 'ITU-R M.1677-1（' + label + '）', url: ITU });

export function formatTrivia(values = computeTrivia(), lang = getLang()) {
  const formatted = {};
  const decimals = ['avgElemUniform', 'avgUnitUniform', 'avgElemWeighted', 'avgUnitWeighted',
    'reassignedUnits', 'entropyBits', 'huffmanBits'];
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === 'number') {
      formatted[key] = value.toFixed(decimals.includes(key) ? 2 : key.endsWith('Pct') ? 1 : 0);
    }
  }
  formatted.longForFrequency = values.longForFrequency.map(({ char, actual, ideal }) =>
    `${char}（${actual}→${ideal} unit）`).join('・');
  formatted.prefixExamples = values.prefixExamples.slice(0, 3).join('、') + '…';
  formatted.byLengthSummary = values.byLength.map(({ used }, i) => `${i + 1}要素 ${used}`).join('、');
  if (lang === 'en') {
    formatted.longForFrequency = values.longForFrequency.map(({ char, actual, ideal }) =>
      `${char} (${actual}→${ideal} units)`).join(', ');
    formatted.prefixExamples = values.prefixExamples.slice(0, 3).join(', ') + '…';
    formatted.byLengthSummary = values.byLength.map(({ used }, i) =>
      `${i + 1} ${i === 0 ? 'element' : 'elements'}: ${used}`).join(', ');
  }
  const letters = MORSE_TABLE.filter(entry => /^[A-Z]$/.test(entry.char));
  const code = char => MORSE_TABLE.find(entry => entry.char === char).code;
  Object.assign(formatted, {
    letterCount: letters.length, characterCount: MORSE_TABLE.length,
    eUnits: unitsOf(code('E')), oUnits: unitsOf(code('O')),
    oRank: Object.entries(LETTER_FREQUENCY).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .findIndex(([char]) => char === 'O') + 1,
    longCount: values.longForFrequency.length,
    shortCombinations: values.byLength.slice(0, 4).reduce((sum, row) => sum + row.possible, 0),
    digitCount: MORSE_TABLE.filter(entry => entry.kind === 'digit').length,
    digitLength: code('0').length, accentedLength: code('É').length, dollarLength: code('$').length,
    digitCombinations: 2 ** code('0').length
  });
  return formatted;
}

export function fillTriviaBody(card, values = formatTrivia(), lang = getLang()) {
  return (lang === 'en' ? card.bodyEn : card.body).map(paragraph => paragraph.replace(/\{(\w+)\}/g, (_, key) => {
    if (!Object.hasOwn(values, key)) throw new Error(`Unknown trivia value: ${key}`);
    return String(values[key]);
  }));
}

export const TRIVIA_CARDS = [
  {
    id: 'frequency', field: 'math', title: 'E は1、O は11',
    titleEn: "E is 1 unit, O is 11",
    bodyEn: [
      "Weighted by how often each letter appears in English, a Morse letter averages {avgUnitWeighted} unit"
        + "s. That is {savingPct}% shorter than the plain average of the {letterCount} letters ({avgUnitUniform"
        + "} units): common letters were given short codes.",
      "E takes {eUnits} unit, but O (---) takes {oUnits} units even though it is the {oRank}th most frequen"
        + "t letter. Handing out the same {letterCount} codes in order of frequency would bring the average dow"
        + "n to {reassignedUnits} units ({reassignedSavingPct}% shorter). The {longCount} letters that are long"
        + " for their frequency are {longForFrequency}."
    ],
    body: [
      '英語の文字の出現率で重みづけすると、1文字の符号の長さは平均{avgUnitWeighted} unitです。'
        + '{letterCount}字を同じ重みで平均した{avgUnitUniform} unitより{savingPct}%短く、よく出る文字に短い符号を割り当てた効果が表れます。',
      'Eは{eUnits} unitですが、O（−−−）は出現率{oRank}位なのに{oUnits} unitです。'
        + '同じ{letterCount}個の符号を出現率の順に配り直すと平均{reassignedUnits} unit（{reassignedSavingPct}%短縮）になります。'
        + '頻度のわりに長いのは{longForFrequency}の{longCount}文字です。'
    ],
    source: {
      labelEn: "ITU-R M.1677-1 (codes)",
      ...ituSource('符号'), secondary: {
      labelEn: "10 Project Gutenberg books (Day018 CipherClimb)",
      label: 'Project Gutenberg 10作品（Day018 CipherClimb）', url: 'https://github.com/ipusiron/cipherclimb'
    } },
    action: { tab: 'encode', text: 'O E' }
  },
  {
    id: 'prefix', field: 'code', title: 'ドットとダッシュだけでは足りない',
    titleEn: "Dots and dashes are not enough",
    bodyEn: [
      "Among the {letterCount} letters, {prefixPairsLetters} ordered pairs have one code that begins anothe"
        + "r (for example {prefixExamples}). Across all {characterCount} characters there are {prefixPairsAll} "
        + "such pairs.",
      "That is why a 3-unit silence is needed between characters. Morse is read as three symbols, dot, dash"
        + " and silence, not as a two-symbol code."
    ],
    body: [
      '符号を続けて書くと、英字{letterCount}字のうち{prefixPairsLetters}組で、'
        + 'ある文字の符号が別の文字の符号の先頭と一致します（例：{prefixExamples}）。{characterCount}文字では{prefixPairsAll}組です。',
      'だから文字の間に3 unitの無音が要ります。モールスは2値ではなく、「ドット・ダッシュ・無音」の3値として区切りまで読む符号です。'
    ],
    source: { ...ituSource('§2 間隔の規則'),
      labelEn: "ITU-R M.1677-1 (§2, spacing)" }, action: { tab: 'decode', morse: '.-... / .- ...' }
  },
  {
    id: 'huffman', field: 'math', title: 'ハフマン符号と比べる',
    titleEn: "Compared with Huffman coding",
    bodyEn: [
      "A fixed-length binary code needs {fixedBits} bits for {letterCount} letters. The entropy of English "
        + "letter frequencies is {entropyBits} bits, and a binary Huffman code averages {huffmanBits} bits.",
      "The Morse average of {avgElemWeighted} elements looks smaller, but it does not count the silences be"
        + "tween characters. A Huffman prefix-code tree and the Morse tree are both read by following branches "
        + "from the root; in Morse, inner nodes carry characters too."
    ],
    body: [
      '{letterCount}字を同じ長さの2値で表すと{fixedBits}ビットです。'
        + '英語の出現率のエントロピーは{entropyBits}ビット、2値のハフマン符号の平均は{huffmanBits}ビットです。',
      'モールスの平均要素数{avgElemWeighted}はそれより小さく見えますが、文字の切れ目の無音を数えていません。'
        + 'ハフマンの接頭符号の木とモールスの木は、どちらも根から枝をたどって読めます。モールスでは途中の節にも文字があります。'
    ],
    source: {
      labelEn: "D. A. Huffman, A Method for the Construction of Minimum-Redundancy Codes (1952)",
      label: 'D. A. Huffman, A Method for the Construction of Minimum-Redundancy Codes（1952）',
      url: 'https://doi.org/10.1109/JRPROC.1952.273898' },
    action: { tab: 'encode', layout: 'chart' }
  },
  {
    id: 'combinations', field: 'math', title: '長さ4までで 30 通り',
    titleEn: "30 patterns up to length 4",
    bodyEn: [
      "Binary strings of length 1 to 4 give {shortCombinations} patterns, enough for all {letterCount} lett"
        + "ers (É has length {accentedLength}). All {digitCount} digits have length {digitLength}, using {digit"
        + "Count} of the {digitCombinations} patterns of that length.",
      "Codes in use by length: {byLengthSummary}. A complete binary tree of depth 6 has {fullTreeNodes} nod"
        + "es, but only {pathNodes} lie on the paths of the characters."
    ],
    body: [
      '長さ1〜4の2値の列は{shortCombinations}通りで、英字{letterCount}字はその中に収まります（Éは長さ{accentedLength}）。'
        + '数字は{digitCount}個とも長さ{digitLength}で、{digitCombinations}通りのうち{digitCount}通りを使います。',
      '長さ別に使っている数は{byLengthSummary}です。深さ6の完全な二分木は{fullTreeNodes}節ですが、文字の経路にある節は{pathNodes}です。'
    ],
    source: { ...ituSource('表'),
      labelEn: "ITU-R M.1677-1 (table)" }, action: { tab: 'encode', layout: 'tree' }
  },
  {
    id: 'decision-tree', field: 'computer', title: '木を下りる＝二分探索',
    titleEn: "Walking the tree is a binary search",
    bodyEn: [
      "If you go down from the root asking \"dot or dash?\", the number of questions needed to identify a cha"
        + "racter equals the number of elements in its code.",
      "The average is {avgElemUniform} questions over the {letterCount} letters, or {avgElemWeighted} when "
        + "weighted by English letter frequency. The tree reads like a binary search tree or a decision tree: a"
        + "t each node, choose one of two branches."
    ],
    body: [
      '根から「ドットか、ダッシュか」と聞いて下りると、1文字を当てるまでの質問の数は符号の要素数と同じです。',
      '{letterCount}字の平均は{avgElemUniform}回、英語の出現率で重みづけすると{avgElemWeighted}回です。'
        + '二分探索木や決定木と同じように、二つの枝のどちらかを選んで読み進められます。'
    ],
    source: { ...ituSource('本ツールの木の生成元'),
      labelEn: "ITU-R M.1677-1 (source of this tool's tree)" }, action: { tab: 'study' }
  },
  {
    id: 'ascii-braille', field: 'computer', title: 'ASCII は7ビット、点字は6点、モールスは1〜7',
    titleEn: "ASCII: 7 bits, braille: 6 dots, Morse: 1 to 7 elements",
    bodyEn: [
      "ASCII represents each character with 7 bits (RFC 20, 1969). A standard six-dot braille cell has six "
        + "dot positions and can form 63 characters, not counting the blank cell.",
      "Morse codes vary in length, from 1 element (E, T) to {dollarLength} elements ($). The $ sign lies ou"
        + "tside the depth-6 tree."
    ],
    body: [
      'ASCIIは1文字を7ビットで表します（RFC 20, 1969）。標準の6点点字は1マス6点で、空白を除いて63通りです。',
      'モールスは文字ごとに長さが違い、1要素のE・Tから{dollarLength}要素の$まであります。$は深さ6の木の外にあります。'
    ],
    source: {
      labelEn: "RFC 20",
      label: 'RFC 20', url: 'https://www.rfc-editor.org/rfc/rfc20.txt', secondary: {
      labelEn: "Braille Authority of North America, Size and Spacing of Braille Characters",
      label: 'Braille Authority of North America, Size and Spacing of Braille Characters',
      url: 'https://www.brailleauthority.org/size-and-spacing-braille-characters'
    } },
    action: { tab: 'encode', text: '$' }
  },
  {
    id: 'gboard', field: 'computer', title: 'スマホのキーボードでもモールス',
    titleEn: "Morse on a phone keyboard",
    bodyEn: [
      "Google's Gboard has offered Morse input since 2018. It was built in partnership with Tania Finlayson"
        + ", an expert in Morse code assistive technology.",
      "You can type with just two keys, dot and dash. The Keying tab of this tool works the same way: you b"
        + "uild characters from dots and dashes."
    ],
    body: [
      'GoogleのGboardには2018年からモールス入力があります。モールスの支援技術の専門家Tania Finlaysonと協力して作られました。',
      'ドットとダッシュの2つのキーだけで文字を打てます。本ツールの打鍵タブも、ドットとダッシュを組み合わせて入力する仕組みです。'
    ],
    source: {
      labelEn: "Google The Keyword, Making Morse code available to more people on Gboard (2018-07-11)",
      label: 'Google The Keyword, Making Morse code available to more people on Gboard（2018-07-11）',
      url: 'https://blog.google/products-and-platforms/products/search/making-morse-code-available-more-people-gboard/' },
    action: { tab: 'keying' }
  },
  {
    id: 'q-codes', field: 'network', title: 'QRS＝もっとゆっくり送って',
    titleEn: "QRS: send more slowly",
    bodyEn: [
      "Radio operators control a contact with Q codes, three-letter abbreviations. QRS means \"send more slo"
        + "wly\" and QRQ means \"send faster\".",
      "Like flow control in data communication, they let the receiver set the sending speed, except that pe"
        + "ople keyed them by hand."
    ],
    body: [
      '無線通信では、通信の制御にQ符号という3文字の略号を使います。QRSは「もっとゆっくり送れ」、QRQは「もっと速く送れ」です。',
      'データ通信のフロー制御と同じように、受け取る側に合わせて送信速度を調整する役目を、人が手で打って伝えていました。'
    ],
    source: {
      labelEn: "ITU-R M.1172 (abbreviations and signals for the maritime mobile service)",
      label: 'ITU-R M.1172（海上移動業務の略号と信号）', url: 'https://www.itu.int/rec/R-REC-M.1172-0-199510-I/en' },
    action: { tab: 'encode', text: 'QRS' }
  },
  {
    id: 'navigation', field: 'network', title: '航空機は今もモールスで局を確かめる',
    titleEn: "Aircraft still identify stations by Morse",
    bodyEn: [
      "A VOR, a radio navigation aid for aircraft, transmits a Morse identification of three letters.",
      "Pilots listen to it to confirm they are tuned to the right station. NDBs also transmit a coded ident"
        + "ification."
    ],
    body: [
      '航空機の無線航法施設VORは、モールスの識別信号（3文字）を送っています。',
      'パイロットは識別信号を聞いて、正しい局に合わせたことを確かめます。NDBも符号の識別信号を送ります。'
    ],
    source: {
      labelEn: "FAA Aeronautical Information Manual 1-1-3 (VOR)",
      label: 'FAA Aeronautical Information Manual 1-1-3（VOR）',
      url: 'https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap1_section_1.html' },
    action: { tab: 'encode', text: 'VOR' }
  },
  {
    id: 'licensing', field: 'network', title: '免許の必須科目から任意へ（2003）',
    titleEn: "From required to optional (2003)",
    bodyEn: [
      "Article 25.5 of the Radio Regulations was revised at the 2003 World Radiocommunication Conference (W"
        + "RC-03).",
      "Each administration now decides whether applicants for an amateur licence must show the ability to s"
        + "end and receive Morse code."
    ],
    body: [
      '無線通信規則25.5は、2003年の世界無線通信会議（WRC-03）で改正されました。',
      'アマチュア無線の免許にモールスの送受信の能力を求めるかどうかは、各国の判断になりました。'
    ],
    source: {
      labelEn: "ITU, WRC-03 Final Acts, MOD 25.5",
      label: 'ITU, WRC-03 Final Acts, MOD 25.5',
      url: 'https://www.itu.int/dms_pub/itu-r/opb/act/R-ACT-WRC.7-2003-PDF-E.pdf' }
  },
  {
    id: 'sos-history', field: 'history', title: '...---... は1906年に決まった',
    titleEn: "...---... was fixed in 1906",
    bodyEn: [
      "Service Regulation XVI of the 1906 Berlin International Radiotelegraph Convention set ...---... as t"
        + "he signal for ships in distress. The regulation does not use the name \"SOS\"; the signal is shown as "
        + "a drawing of the code.",
      "The name \"SOS\" came into use later. The sign is not in the character table of ITU-R M.1677-1, so thi"
        + "s tool treats it as a customary prosign."
    ],
    body: [
      '1906年のベルリン国際無線電信会議の業務規則XVIは、遭難した船が使う信号として...---...を定めました。'
        + '規則の本文に「SOS」という名前はなく、符号が図で示されています。',
      '「SOS」という呼び方は後から広まりました。ITU-R M.1677-1の文字表にもなく、本ツールでは慣用の手続き符号として扱います。'
    ],
    source: {
      labelEn: "International Radiotelegraph Convention of Berlin, 1906, Service Regulations XVI (ITU History Portal"
        + ")",
      label: 'International Radiotelegraph Convention of Berlin, 1906, Service Regulations XVI（ITU History Portal）',
      url: 'https://search.itu.int/history/HistoryDigitalCollectionDocLibrary/4.37.57.en.100.pdf' },
    action: { tab: 'encode', text: '<SOS> SOS' }
  },
  {
    id: 'first-message', field: 'history', title: '最初の電信文',
    titleEn: "The first telegraph message",
    bodyEn: [
      "On 24 May 1844, Samuel Morse sent \"What hath God wrought\" from the United States Capitol in Washingt"
        + "on to Baltimore.",
      "The words were chosen by Annie Ellsworth from the Bible (Numbers 23:23)."
    ],
    body: [
      '1844年5月24日、Samuel Morseはワシントンの連邦議会議事堂からボルチモアへ「What hath God wrought」を送りました。',
      'この文はAnnie Ellsworthが聖書の民数記23:23から選びました。'
    ],
    source: {
      labelEn: "Library of Congress, First telegraph message, 24 May 1844",
      label: 'Library of Congress, First telegraph message, 24 May 1844', url: 'https://www.loc.gov/item/mcc.019/' },
    action: { tab: 'encode', text: 'WHAT HATH GOD WROUGHT' }
  },
  {
    id: 'light-signals', field: 'survival', title: '光と旗で3短3長3短',
    titleEn: "Three short, three long, three short with lights and flags",
    bodyEn: [
      "The U.S. Army survival manual FM 21-76 describes sending SOS (three dots, three dashes, three dots) "
        + "with lights or flags.",
      "The same manual also lists three fires in a triangle and three shots as distress signals, but it doe"
        + "s not say that these share an origin with the threes of SOS. The timing ratio is the same 1:3 as on "
        + "the radio."
    ],
    body: [
      '米陸軍のサバイバル教範FM 21-76は、光や旗でSOS（3つの短点・3つの長点・3つの短点）を送る方法を載せています。',
      '同じ教範には「三角形に並べた3つの火」「間隔を空けた3発」も遭難信号として載りますが、'
        + 'これらとSOSの「3」が同じ由来だという記述はありません。時間の比は無線と同じ1:3です。'
    ],
    source: {
      labelEn: "FM 21-76 U.S. Army Survival Manual (Internet Archive reprint)",
      label: 'FM 21-76 U.S. Army Survival Manual（Internet Archiveの再版）',
      url: 'https://archive.org/details/Fm21-76SurvivalManual' },
    action: { tab: 'encode', text: 'SOS', lamp: true }
  },
  {
    id: 'joined-prosigns', field: 'code', title: '手続き符号は間を空けない',
    titleEn: "Prosigns are sent without gaps",
    bodyEn: [
      "<SK> is sent as one sign, ...-.-, with no gap. Sending the letters S and K gives ... -.-, with a 3-u"
        + "nit silence between them.",
      "The same dots and dashes mean different things depending on the silence. Try both in the tool and co"
        + "mpare where the characters split."
    ],
    body: [
      '<SK>は...-.-を1つの符号として続けて送ります。文字としてS・Kを送ると... -.-で、間に3 unitの無音が入ります。',
      '同じ点と線でも、無音の有無で意味が変わります。ツールで両方を並べて、符号の区切りを比べられます。'
    ],
    source: { ...ituSource('手続き符号'),
      labelEn: "ITU-R M.1677-1 (procedure signals)" }, action: { tab: 'encode', text: '<SK> SK' }
  },
  {
    id: 'code-and-cipher', field: 'crypto', title: '符号と暗号は別物',
    titleEn: "A code is not a cipher",
    bodyEn: [
      "A code replaces information by a fixed rule, and Morse is an example. A cipher uses a key so that on"
        + "ly the intended reader can recover the message. Morse has no key: anyone who knows the rule can read"
        + " it.",
      "In the telegraph era, commercial code books were used both to save on charges and to keep messages s"
        + "ecret. The 1881 ABC code named \"Simplicity, Economy, and Secrecy\" as its three objects in its prefac"
        + "e."
    ],
    body: [
      '符号（code）は決まった規則で置き換えるもので、モールスはその例です。'
        + '暗号（cipher）は鍵を使って読み取れる相手を限ります。モールスには鍵がなく、規則を知っていれば誰でも読めます。',
      '電信の時代には、料金の節約と秘匿の両方のために電信符号帳が使われました。'
        + '1881年のABC符号帳は、序文で「簡潔・経済・秘匿」を三つの目的に掲げています。'
    ],
    source: {
      labelEn: "Encyclopaedia Britannica, Cryptology",
      label: 'Encyclopaedia Britannica, Cryptology', url: 'https://www.britannica.com/topic/cryptology', secondary: {
      labelEn: "W. Clauson-Thue, The ABC Universal Commercial Electric Telegraphic Code (1881)",
      label: 'W. Clauson-Thue, The ABC Universal Commercial Electric Telegraphic Code（1881）',
      url: 'https://archive.org/details/abcuniversalco00clau'
    } }
  },
  {
    id: 'enigma', field: 'crypto', title: '暗号文はモールスに乗って飛んだ',
    titleEn: "Ciphertext traveled in Morse",
    bodyEn: [
      "In the Second World War, German Enigma ciphertext was sent by radio in Morse, in groups of five lett"
        + "ers. Operators at British intercept (Y) stations wrote it down and sent it to Bletchley Park by tele"
        + "printer for codebreaking.",
      "Random letters are harder to copy by ear than recognizable words."
    ],
    body: [
      '第二次大戦のドイツ軍のエニグマ暗号文は、5文字ずつの組にしてモールスで無線送信されました。'
        + '英国の傍受局（Y局）の通信士がそれを聞き取り、テレプリンタでブレッチリー・パークへ送って解読にかけました。',
      '意味のある単語より、でたらめな文字の並びのほうがモールスの聞き取りは難しくなります。'
    ],
    source: {
      labelEn: "Bletchley Park Trust, Enigma Red messages",
      label: 'Bletchley Park Trust, Enigma Red messages',
      url: 'https://www.bletchleypark.org.uk/our-story/enigma-red-messages/', secondary: {
      labelEn: "Y Stations: Interception",
        label: 'Y Stations: Interception',
        url: 'https://www.bletchleypark.org.uk/about-y-stations/work-at-the-y-stations/y-stations-interception/'
      } },
    action: { tab: 'encode', text: 'QWZXK VJPGH' }
  }
];
