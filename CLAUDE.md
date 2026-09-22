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
The nine test files cover codec boundaries and round-trips, the 55-entry table,
tree geometry, timing, messages, HTML security/ARIA, contrast, formatting, and README consistency.

## Architecture

### Module Structure
The application uses ES6 modules with the following architecture:

- **Entry Point**: `js/script.js` - Handles tab switching and lazy initialization of features
- **Feature Modules**:
  - `js/encode.js` - English to Morse encoding functionality
  - `js/decode.js` - Morse to English decoding functionality
  - `js/study.js` - Learning mode with character confirmation and random quizzes
  - `js/table.js` - Morse code reference table display
- **Data & Visualization**:
  - `js/morseMap.js` - MORSE_TABLE, lookup Maps and notation formatting: 55 characters (ITU 50 + customary 5)
  - `js/morseTree.js` - buildTree, completeTo, layoutTree; generated from MORSE_TABLE, not a handwritten tree
  - `js/morseCodec.js` - DOM-free normalization, encode/decode, paths and ITU timing
  - `js/messages.js` - Japanese MESSAGES dictionary and t(key, params), ready for a future English dictionary
  - `js/treeRenderer.js` - Independent SVG view instances for encoding, decoding and study
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
   depth six includes valid table paths. There are 75 nodes, 34 leaves and 12 depth-six nodes.
   `$` is outside the tree because its code has seven elements. The SVG stays 1080 by 470 pixels;
   only the tree wrapper scrolls horizontally. Empty/customary nodes have distinct dashed borders.

5. **Security**: Render text with textContent and elements with createElement, never innerHTML.
   CSP allows only local scripts/styles and has no unsafe-inline or frame-ancestors directive.
   Do not add style attributes, inline event handlers, external requests or dependencies.
   Meta CSP cannot enforce frame-ancestors; GitHub Pages does not allow custom response headers.

6. **Timing**: dot=1, dash=3, element gap=1, letter gap=3, word gap=7 units.
   One unit is 1200/WPM ms. SOS is 27 units (3240ms at 10WPM); PARIS is 43 plus 7=50 units.
   Reduced motion highlights all final paths synchronously. Tab switches pause playback.

7. **Input and messages**: English input uses NFKC, uppercase and collapsed whitespace.
   Internal codes are ASCII; format only at display/copy time. Decoder accepts dot/dash variants,
   slash, vertical bar, newlines and three or more spaces as word separators.
   Put dynamic UI text in messages.js and call t(). Do not add raw Japanese literals in other JS modules;
   use Unicode escapes for the Japanese notation constants. No persistent quiz scores.

### Development Notes

- The project is part of the "100 Security Tools with Generative AI" series (Day 025)
- Primary language is Japanese for UI and documentation
- Default display symbols are `・` (U+30FB) and `−` (U+2212); ASCII `.` and `-` are also supported
- Word separation uses / and character separation uses space
- English UI, audio, keying, prosigns, Wabun, dark mode, URL sharing and PNG export are deferred
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
