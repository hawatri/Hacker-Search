# Hacker Search

A modern, customizable search page with a matrix-inspired theme and powerful widgets. Built as a Chrome extension for a personalized new tab experience.

## Quick Install

### From Chrome Web Store (Currently Not available there)
1. Visit [Hacker Search](https://chrome.google.com/webstore/detail/your-extension-id) in Chrome Web Store
2. Click "Add to Chrome"
3. Confirm the installation

### Manual Installation
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the downloaded folder

## Screenshots

<div align="center">
  <img src="images/image (1).png" alt="Hacker Search Main Interface" width="45%"/>
  <img src="images/image (2).png" alt="Widgets and Customization" width="45%"/>
  <br/>
  <img src="images/image (3).png" alt="Search Features" width="45%"/>
  <img src="images/image (4).png" alt="AI Tools Integration" width="45%"/>
  <br/>
  <img src="images/image (5).png" alt="Theme Customization" width="45%"/>
  <img src="images/image (6).png" alt="Widget Management" width="45%"/>
  <br/>
  <img src="images/image (7).png" alt="Advanced Features" width="45%"/>
  <img src="images/image (8).png" alt="Settings and Configuration" width="45%"/>
</div>

## Overview

Hacker Search transforms your new tab page into a powerful, customizable dashboard with search capabilities, widgets, and AI tools. The interface features a dynamic matrix background with theme support and a collection of draggable, resizable widgets.

Built from scratch by Hawatri, this project demonstrates modern web development practices and Chrome extension development.

## Technologies Used

- HTML5
- CSS3 (Custom animations, Flexbox, Grid)
- JavaScript (ES6+)
- Chrome Extension APIs
- Local Storage API
- Canvas API (Matrix animation)
- Web APIs (Clipboard, Media, Geolocation)
- REST APIs (Weather data)

## Core Features

### Search
- Multiple search engines (Google, YouTube, GitHub, DuckDuckGo, Bing, Scholar)
- Command-based search syntax
- Quick engine switching
- Persistent engine selection

### Widgets
- Clock (Digital/Analog with timezone support)
- Todo List
- Weather (Real-time data with location support)
- Screensaver (Matrix animation)
- Media Player (Audio files with playlist support)
- Notes (With timestamps)
- Calendar
- Clipboard History (50 items with timestamps)

### AI Tools
- ChatGPT
- Grok
- Blackbox
- Perplexity
- Gemini
- Copilot
- Claude
- Meta AI

### Customization
- 5 themes: Matrix, Cyberpunk, Retro, Hacker, Neon
- Widget size presets (Small to Huge)
- Draggable and resizable widgets
- Minimizable and lockable widgets
- Persistent widget positions and states

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable Developer mode
4. Click "Load unpacked"
5. Select the project directory

## Usage

### Search Commands
```
query                    # Uses default engine
engine query            # Uses specific engine
nt engine query         # Opens in new tab
```

### Widget Controls
- Drag: Click and hold header
- Resize: Click resize button (cycles through sizes)
- Minimize: Click minimize button
- Lock: Click lock button
- Keyboard: Focus header and use arrow keys

### Settings
Access settings via the gear icon to configure:
- Theme
- Timezone
- Weather location
- Widget preferences
- AI tools visibility

## Technical Details

### Dependencies
- Chrome Storage API
- Open-Meteo API (Weather data)

### Browser Support
- Chrome (Primary)
- Chromium-based browsers

## Development

### Project Structure
```
hacker-search/
├── manifest.json
├── index.html
├── styles.css
├── script.js
└── README.md
```

### Key Features
- Persistent storage using Chrome Storage API
- Responsive matrix background
- Accessibility support (ARIA labels, keyboard navigation)
- Screen reader compatibility
- Custom widget system
- Theme engine
- Real-time data integration

## Author

Hawatri:- https://github.com/hawatri

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

The MIT License is a permissive license that is short and to the point. It lets people do anything they want with your code as long as they provide attribution back to you and don't hold you liable. 