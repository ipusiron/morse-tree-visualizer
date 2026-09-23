# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MorseTree Visualizer is a static web application for learning Morse code through interactive visualization. It's built with vanilla JavaScript using ES6 modules, HTML, and CSS. The project is deployed on GitHub Pages and requires no build process.

## Commands

### Development Server
Since this project uses ES6 modules, you need to run a local HTTP server:
```bash
# Python 3
python -m http.server 8000

# Node.js (if http-server is installed globally)
http-server -p 8000
```
Then open http://localhost:8000/

### Deployment
The site is automatically deployed to GitHub Pages when pushing to the main branch. No build step is required.

### Tests
Run `npm test` with Node 22 or newer. No dependencies or install step are needed.
GitHub Actions runs the same `node --test` suite on push and pull_request.
The twenty test files cover codec boundaries and round-trips, the 55-entry International character table,
tree geometry, timing, messages, HTML security/ARIA, contrast, formatting, README consistency,
keying, nine prosigns, shared URLs, theme storage and static print/security constraints.
Phase three adds chart coordinates/storage, English letter frequencies and executable trivia/card checks.
Phase four-a adds JA/EN dictionaries, language selection/storage, state-preserving translation,
English trivia/print formatting and matching Japanese/English README content, trees and image references.
Phase four-b adds the full 65-entry Wabun table, normalization/decoding, 67-node binary and 66-node chart references,
code selection/storage, silent switching, Wabun study, table/print rows, keying composition, and shared URLs.

## Architecture

### Module Structure
The application uses ES6 modules with the following architecture:

- **Entry Point**: `js/script.js` - Handles tab switching and lazy initialization of features
- **Feature Modules**:
  - `js/encode.js` - English to Morse encoding functionality
  - `js/decode.js` - Morse to English decoding functionality
  - `js/study.js` - Learning mode with character confirmation and random quizzes
  - `js/table.js` - Morse code reference table display
  - `js/audio.js` - User-activated Web Audio scheduling, mute and keying sidetone
  - `js/keying.js` - Pointer/Space input, duration meters, pending symbols and decoded state
  - `js/share.js` - Pure bounded URL parsing/formatting; text and morse are mutually exclusive
  - `js/theme.js` - Light/dark/system choice and guarded localStorage access
  - `js/layout.js` - Shared tree/chart choice, guarded storage and layout-change events
  - `js/i18n.js` - Initial language, guarded storage, data-i18n updates and language-change events
  - `js/system.js` - Code selection/storage, current table/codec, and silent system-change reconversion
- **Data & Visualization**:
  - `js/morseMap.js` - MORSE_TABLE: 55 characters (ITU 50 + customary 5); PROSIGNS: 9 (ITU 8 + customary SOS)
  - `js/wabunMap.js` - WABUN_TABLE: 65 entries in iroha order, romanization, name keys, and kana samples
  - `js/morseTree.js` - buildTree, completeTo, layoutTree and layoutChart, generated from MORSE_TABLE
  - `js/frequency.js` - Rounded A-Z frequencies from Day018 CipherClimb's Gutenberg corpus
  - `js/trivia.js` - DOM-free computeTrivia, text formatting and 16 sourced cards in seven fields
  - `js/morseCodec.js` - DOM-free normalization, encode/decode, paths and ITU timing
  - `js/messages.js` - Matching JA/EN dictionaries, setLang/getLang and strict t(key, params)
  - `js/treeRenderer.js` - Independent SVG view instances for encoding, decoding, study and keying
  - `js/animator.js` - Per-view playback, pause/resume/stop and manual steps
  - `js/utils.js` - Safe element creation, shared notation/WPM settings, results, copy and playback controls

### Key Design Patterns

1. **Lazy Initialization**: Each tab's functionality is only initialized when first accessed (`*Initialized` flags in script.js).

2. **Module Isolation**: Each feature exports a single `init*` function (e.g., `initEncodeTab()`, `initDecodeTab()`).

3. **Binary Tree Navigation**: Morse code is represented as a binary tree where:
   - Left branch = dot (・)
   - Right branch = dash (−)
   - Tree traversal visualizes the encoding/decoding process with animated highlighting

4. **SVG Tree Rendering**: Each view uses ASCII `data-code` attributes. Depth five is complete;
   depth six includes valid table and prosign paths. There are 76 nodes, 34 leaves and 13 depth-six nodes.
   The character-only tree remains 75 nodes for compatibility. `$`, HH and SOS are outside the tree.
   Prosign labels can be toggled; SK adds one node without moving existing coordinates.
   When off, SN/KA retain the old empty-node appearance and SK plus its edge are hidden (all 76 groups remain in the DOM).
   The SVG stays 1080 by 470 pixels;
   only the tree wrapper scrolls horizontally. Empty/customary nodes have distinct dashed borders.

   Chart mode uses layoutChart(buildTree(MORSE_TABLE, 6, PROSIGNS)), without completeTo.
   Always pack all 66 nodes; toggling prosigns only hides SN/SK and their edges, leaving 64 visible nodes.
   Packing a character-only 64-node tree moves 26 nodes, so never repack for the toggle.
   Root is (col=0,row=0), dash subtree left and dot subtree right. Continue the same symbol horizontally;
   the opposite symbol goes down to the shallowest collision-free row, counting vertical connector cells.
   Memoize subtree shapes. Columns -5..5 and rows 0..13 map to x=360+64*col, y=40+56*row.
   viewBox is 0 0 720 808. Dot-ending nodes are circles (r=15); dash-ending nodes are rectangles (48x30).
   Empty nodes use r=8 or 28x18 with dashed borders. The root retains the binary tree's start circle.
   SN/SK/KA labels go inside nodes; shared aliases remain small prosign-labels. Rows are not depth labels.
   createTreeView(container, { layout = readLayout() }) exposes setLayout(mode).
   Both layouts share data-code, highlight/current classes and playback; do not fork playback by layout.
   Keep horizontal following; scroll chart nodes vertically only when outside the window viewport.

5. **Security**: Render text with textContent and elements with createElement, never innerHTML.
   CSP allows only local scripts/styles and has no unsafe-inline or frame-ancestors directive.
   Do not add style attributes, inline event handlers, external requests or dependencies.
   Meta CSP cannot enforce frame-ancestors; GitHub Pages does not allow custom response headers.

6. **Timing**: dot=1, dash=3, element gap=1, letter gap=3, word gap=7 units.
   One unit is 1200/WPM ms. SOS is 27 units (3240ms at 10WPM); PARIS is 43 plus 7=50 units.
   Farnsworth uses c=character WPM and s=min(overall WPM,c): a=(60c-37.2s)/(s*c)*1000 ms,
   letterGap=3*a/19 and wordGap=7*a/19 when s<c; these replace, not augment, ordinary gaps.
   Default playback has sound off, 15/10 WPM, 700 Hz and 50% volume. Numeric timeline arguments retain ordinary timing.
   The shared sound checkbox starts unchecked and also mutes keying sidetone, even when its local Sidetone option is checked.
   Enabling Sound alone must not create an AudioContext; create/resume it on the first subsequent playback or keying action.
   Audio uses one oscillator per playback and short gain ramps. Do not create an AudioContext before user action.
   requestAnimationFrame follows AudioContext.currentTime; audio-off/unavailable uses the original timer path.
   Pause/stop cancel sound, resume schedules remaining tones, and tab switches pause playback.
   Reduced motion highlights all final paths synchronously while sound retains its schedule; the lamp is disabled.
   The lamp is 40px, initially off; do not flash a large surface.

7. **Input and messages**: English input uses NFKC, uppercase and collapsed whitespace.
   Internal codes are ASCII; format only at display/copy time. Decoder accepts dot/dash variants,
   slash, vertical bar, newlines and three or more spaces as word separators.
   Put dynamic UI text in messages.js and call t(). Japanese-literal exceptions are trivia.js card data/formatting and wabunMap.js data;
   use Unicode escapes for the Japanese notation constants. No persistent quiz scores.

8. **Keying**: u=1200/WPM; a press shorter than 2u is a dot, otherwise a dash.
   The next press classifies the release gap: <2u same character, <5u next character, otherwise next word.
   Idle UI timers show pending symbols at 2u, commit a character at 5u and a word at 10u.
   Committing clears the highlighted path. Ignore repeat Space and editable controls; cancel on blur/tab changes.

9. **Prosigns and sharing**: `<AR>` syntax sends one procedural signal, not separate A and R.
   Decode character aliases first (+, =, K, &); only unambiguous codes produce angle-bracket labels.
   SOS as a single nine-element sign is customary, not listed in ITU-R M.1677-1.
   Shared inputs are limited to 1000 characters. Loading a URL may convert but must not create an AudioContext.

10. **Theme and print**: `morse-tree-theme` stores light/dark/system with try/catch around storage access.
    Use semantic foreground colors (on-primary and node-hl-text), not paper or ordinary node-text on highlighted surfaces.
    PrintSheet is a separate body child, hidden on screen, with 64 rows (27+10+18+9) in two columns.
    Print CSS always restores light colors; compact cells fit A4 portrait on one page in Chromium.
    The browser print dialog provides PDF output.

11. **Shared layout**: morse-tree-layout accepts tree/chart, defaults to tree and catches storage exceptions.
    Keep the latest choice in memory too, so lazily initialized views agree when storage is blocked.
    Four independently named radio groups update together via layout-change.
    A change clears paths and stops all playback (including hidden panels and pending AudioContext work).
    It also cancels keying tones and timers; changing layout never starts sound.

12. **Trivia**: Keep 16 cards in math(3), code(2), crypto(2), computer(3), network(3), history(2), survival(1).
    Every card requires a source label and HTTPS URL; source.secondary holds the second supplied source, if any.
    Do not add unsourced origin stories or folklore. Keep card content and computed formatting in trivia.js;
    general UI labels stay in messages.js. Create article/h3/p/link/button elements with el/textContent.
    Source links use target=_blank and rel="noopener noreferrer", with no fetching or external requests on render.
    Derive calculable quantities with computeTrivia/formatTrivia placeholders, not literals in body text.
    Normalize the one-decimal LETTER_FREQUENCY by its sum before computing averages or entropy.
    Weighted/uniform mean units are 6.09/8.23 (26.0% saving), reassignment 5.69 (6.6%), entropy 4.17, Huffman 4.20.
    Morse unit costs exclude letter gaps and cannot be directly equated to prefix-code bit lengths.
    The Gutenberg source is 10 works / 5,141,270 characters from Day018 ngramModel.js.
    URL loads and trivia actions share applyInput, dispatching convert-input to convert(false).
    Never click an autoplay conversion button from trivia/share code. Lamps respect reduced motion.

13. **Language (phase four-a)**: Keep the key sets and interpolation parameter sets of DICTIONARIES.ja/en identical.
    MESSAGES remains an alias for the Japanese dictionary. Use t(key, params); unknown keys or missing parameters throw.
    Fixed HTML uses data-i18n, data-i18n-aria-label, data-i18n-title and data-i18n-placeholder.
    Keep Japanese fallback text in HTML. Update document language, title and meta description too.
    Dynamic text uses setMessage/msg and language-change listeners; preserve existing controls and result nodes.
    Switching languages keeps input, results, highlighted paths, selected tabs, filters, focus and scroll positions.
    Stop playback and keying audio without clearing highlights; language switching must never start sound.
    Initial language priority: valid ?lang=ja|en, saved morse-tree-lang, then navigator.language (ja prefix or en).
    Catch storage read/write failures. The language button displays the destination EN/JA.
    English starts with ASCII .- notation; Japanese starts with U+30FB/U+2212. Preserve manually selected notation.
    Shared-input URLs omit lang so recipients use their own language preference.
    Use "Depth {n}" for binary-tree depth labels and "Name" for the English table column heading.
    English print dates use the local calendar date as YYYY-MM-DD, including the beforeprint path.
    Nagisa's approved ref/day025/day025_trivia_en.json is the source of truth for all 16 English trivia cards.
    The reference JSON lives outside this repository; do not add it as a runtime fetch or a full test fixture.
    Preserve titleEn/bodyEn/source.labelEn (including secondary sources) verbatim and compute numbers at runtime.
    Keep Japanese and English placeholder sets equal; the approved frequency sentence includes {longCount}.
    Update README.md and README.en.md together, with matching sections, examples, numbers and directory inventories.
    Japanese images stay in assets/; English images stay in assets/en/. Do not overwrite the Japanese images.
    Only the required Japanese-language link on README.en.md's first line is exempt from its Japanese-text check.
    Phase four-b adds Wabun under separate approval; interface language and code system remain independent.

14. **Wabun (phase four-b)**: Source: Japan's Radio Station Operation Regulations, Appended Table 1, part 1,
    https://laws.e-gov.go.jp/law/325M50080000017 (e-Gov law 325M50080000017).
    Keep all 65 entries in published iroha order: 48 kana, 2 voicing marks, 10 digits, 5 symbols.
    The International conversion results, timing, and coordinates must retain all original numeric expectations.
    Do not add the HORE/RATA switching signals to the 65-character table: this tool switches via the Code control,
    not by interpreting switching signals embedded in a transmission. Wabun has no International prosign overlay.

    Tool-specific normalization, not rules prescribed by the regulation: NFKC; hiragana U+3041..U+3096 to katakana;
    NFD; combining marks U+3099/U+309A to spacing marks U+309B/U+309C; expand small kana;
    restore ASCII parentheses to U+FF08/U+FF09; spaces separate words.
    Reject unsupported text, including Latin letters and U+3002. Never replace U+3002 with U+3001.
    Decoder dot aliases remain unchanged. Compose voicing marks with the preceding character only if NFC yields one character;
    otherwise retain the spacing mark. Keying uses the same composition function.

    settings.system defaults to intl. Priority: valid URL code=wabun|intl, guarded morse-tree-system storage, then intl.
    currentTable() and current codecs route every conversion feature; never mutate MORSE_TABLE or WABUN_TABLE.
    system-change stops all playback, invalidates pending AudioContext work, and resets old animation events.
    Preserve inputs; convert only the visible conversion panel with convert(false), deferring hidden panels until tab-activated.
    Do not start sound on code/language/layout changes or shared-URL loads. Default sound stays off.
    Wabun binary trees have 67 nodes/33 leaves in the unchanged -50 -30 1080 470 viewBox.
    Wabun charts have 66 nodes, rows 0..15 and viewBox 0 0 720 920. No International/customary/prosign markers.
    Use 20px labels and translated titles for the two voicing marks. Rebuild all four tree views on code changes.

    Study has kana/mark/digit/symbol ranges; reset the quiz session on code changes without clearing typed inputs.
    Wabun tables have groups of 48/2/10/5 and Character/Code/Name columns; kana names are romaji in English.
    Print all 65 rows across 33/32-row columns; allow long English names to wrap. Browser-check A4 portrait pagination.
    Wabun share URLs append code=wabun; keep existing International URL formatting and the 1000-character limit unchanged.

### Development Notes

- The project is part of the "100 Security Tools with Generative AI" series (Day 025)
- The UI and documentation support Japanese and English
- Initial notation follows the UI language: Japanese U+30FB/U+2212 or English ASCII `.` and `-`
- Word separation uses / and character separation uses space
- JA/EN and README.en.md are phase four-a; Wabun is phase four-b. PNG export remains deferred.
- HTTP is required for ES modules; file:// is not supported

### Staged development record

1. Canonical character table, codec/tree logic, messages, tests and CI; legacy UI unchanged at this gate
2. Independent tree views and timed playback; geometry and mobile tree checks
3. Encode/decode normalization, notation, copying, controls and live path following
4. Study directions/ranges/score and ITU/customary table
5. Keyboard tabs/dialog, CSP, mobile layout and contrast tests
6. README/CLAUDE documentation, four screenshots and README consistency test

Each gate runs npm test plus its browser checks before a separate Japanese stage commit.
Screenshot scripts and browser verification scripts belong outside the repository.

### Phase two staged development

1. Farnsworth, tone schedules, keying classification, prosigns and URL logic/tests (UI unchanged)
2. Audio-clock playback, shared speed/sound settings and small optional lamp
3. Pointer/Space keying tab and sidetone
4. Prosign tree/table/manual selection and shared-input URLs
5. Light/dark/system themes and printable 64-row reference
6. README/CLAUDE, three additional screenshots and documentation tests

Keep the first four screenshots unchanged. README tree-only maintenance is allowed at each stage to keep inventory tests valid.
Use actual foreground/background pairs for both-theme contrast tests (minimum 4.5:1).
Screenshot five captures confirmed SO plus pending S: the specification's committed SOS plus a lit tree is impossible
because committing a character clears the path. This depiction was explicitly approved.

### Phase three staged development

1. Chart layout and English frequency/trivia logic with reference-value tests; UI unchanged
2. Chart rendering and synchronized layout controls for the four tree views
3. Sixth tab with 16 sourced trivia cards, filtering and non-playing example actions
4. README/CLAUDE, two additional screenshots and documentation consistency checks

Keep the first seven images unchanged. New images are Python Playwright/Chromium viewport captures,
1280x1100 and at most 300KB each, not full-page or element screenshots.
Screenshot eight shows chart SOS paths and SN/SK; screenshot nine shows the three math cards and sources in light mode.
For this phase, the user assigned browser checks and image capture to Nagisa.
Codex commits each stage after npm test and git diff --check, reporting browser results as delegated/pending.
Publish only as far as PR creation and a successful Test CI run. Do not merge or delete the branch until instructed.

### Phase four-a staged development

1. Matching JA/EN dictionaries and language selection/storage; no UI change
2. Fixed and dynamic UI translation with state preservation and no audio start
3. Sixteen approved English trivia cards, locale formatting, table and print translation; sound defaults off
4. Full English README, reciprocal language links, nine English screenshots and bilingual documentation tests

The stage-three follow-up shortens depth labels to Depth n and the table heading to Name without changing geometry or data.
Nagisa supplies browser verification and all nine English PNGs, captured from 64db767 in Chromium at 1280x1100.
Keep the original Japanese PNGs unchanged. Record dimensions and byte sizes for the English copies.
Codex gates each commit on npm test and git diff --check; do not claim automated/static tests are browser checks.
Push the branch, create the PR, and wait for successful Test CI. Stop there; do not merge until explicitly instructed.

### Phase four-b staged development

1. Full Wabun table and codec, binary/chart reference tests; no UI changes
2. Code selection/storage, current encoding/decoding, and all four tree/chart views
3. Wabun study, reference table, keying, 65-row printing, and shared URLs
4. Matching Wabun sections in both READMEs, development guidance, and screenshots 10/11 in both languages

Nagisa performs browser checks at the stage commits and supplies four new PNGs after stage three.
Keep all previous Japanese and English images unchanged. Record the supplied image dimensions and byte sizes.
Each stage requires npm test and git diff --check before an explicit-file Japanese commit.
The user approved specification-driven extensions to existing counts/lists/settings tests; record each in report4b.
Never adjust International conversion, time, or coordinate expectations to pass tests.
Publish only as far as creating a PR and successful Test CI; do not merge until instructed.
