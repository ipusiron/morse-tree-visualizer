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
  - `js/morseMap.js` - Character to Morse code mappings (A-Z, 0-9, symbols)
  - `js/morseTree.js` - Binary tree data structure for Morse visualization
  - `js/treeRenderer.js` - SVG-based tree visualization and path highlighting
  - `js/utils.js` - Security utilities (HTML escaping for XSS prevention)

### Key Design Patterns

1. **Lazy Initialization**: Each tab's functionality is only initialized when first accessed (`*Initialized` flags in script.js).

2. **Module Isolation**: Each feature exports a single `init*` function (e.g., `initEncodeTab()`, `initDecodeTab()`).

3. **Binary Tree Navigation**: Morse code is represented as a binary tree where:
   - Left branch = dot (・)
   - Right branch = dash (－)
   - Tree traversal visualizes the encoding/decoding process with animated highlighting

4. **SVG Tree Rendering**: The tree is dynamically rendered using SVG elements with `data-path` attributes for path-based highlighting.

5. **Security**: Content Security Policy is set in index.html. User input is escaped via `js/utils.js` to prevent XSS.

### Development Notes

- The project is part of the "100 Security Tools with Generative AI" series (Day 025)
- Primary language is Japanese for UI and documentation
- Morse symbols use full-width characters: ・(dot) and −(dash)
- Word separation uses / and character separation uses space