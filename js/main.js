// Main application entry point
import { ThemeManager } from './theme-manager.js';
import { MatrixBackground } from './matrix-background.js';
import { WidgetManager } from './widget-manager.js';
import { SearchEngine } from './search-engine.js';
import { ClockWidget } from './widgets/clock-widget.js';
import { TodoWidget } from './widgets/todo-widget.js';
import { WeatherWidget } from './widgets/weather-widget.js';
import { NotesWidget } from './widgets/notes-widget.js';
import { ClipboardWidget } from './widgets/clipboard-widget.js';
import { Utils } from './utils.js';

class HackerSearchApp {
    constructor() {
        this.components = {};
        this.inactivityTimer = null;
        this.inactivityDelay = 60000; // 1 minute
        this.init();
    }

    async init() {
        try {
            // Initialize core components
            this.components.themeManager = new ThemeManager();
            this.components.matrixBackground = new MatrixBackground('matrixBackground');
            this.components.widgetManager = new WidgetManager();
            this.components.searchEngine = new SearchEngine();

            // Initialize widgets
            this.components.clockWidget = new ClockWidget();
            this.components.todoWidget = new TodoWidget();
            this.components.weatherWidget = new WeatherWidget();
            this.components.notesWidget = new NotesWidget();
            this.components.clipboardWidget = new ClipboardWidget();

            // Make widgets globally accessible for onclick handlers
            window.themeManager = this.components.themeManager;
            window.todoWidget = this.components.todoWidget;
            window.notesWidget = this.components.notesWidget;
            window.clipboardWidget = this.components.clipboardWidget;

            // Setup global event listeners
            this.setupGlobalEventListeners();
            this.setupInactivityTimer();
            this.setupSettings();
            this.setupAITools();

            console.log('Hacker Search initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Hacker Search:', error);
        }
    }

    setupGlobalEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleGlobalKeydown(e);
        });

        // Activity detection for screensaver
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, () => {
                this.resetInactivityTimer();
            }, { passive: true });
        });

        // Window focus/blur
        window.addEventListener('focus', () => {
            this.resetInactivityTimer();
        });

        window.addEventListener('blur', () => {
            this.clearInactivityTimer();
        });
    }

    handleGlobalKeydown(e) {
        // Global keyboard shortcuts
        switch (e.key) {
            case '/':
                if (!e.target.matches('input, textarea')) {
                    e.preventDefault();
                    document.getElementById('searchInput').focus();
                }
                break;
            case 'Escape':
                // Close any open modals
                document.querySelectorAll('.settings-modal.visible, .calendar-note-modal.visible').forEach(modal => {
                    modal.classList.remove('visible');
                });
                break;
        }
    }

    setupInactivityTimer() {
        this.resetInactivityTimer();
    }

    resetInactivityTimer() {
        this.clearInactivityTimer();
        this.components.matrixBackground.stop();
        
        this.inactivityTimer = setTimeout(() => {
            this.components.matrixBackground.start();
        }, this.inactivityDelay);
    }

    clearInactivityTimer() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = null;
        }
    }

    setupSettings() {
        const settingsBtn = document.getElementById('settingsBtn');
        const settingsModal = document.getElementById('settingsModal');
        const closeBtn = settingsModal.querySelector('.close-btn');
        const themeSelect = document.getElementById('themeSelect');
        const timezoneSelect = document.getElementById('timezoneSelect');
        const weatherLocationInput = document.getElementById('weatherLocation');
        const saveWeatherBtn = document.getElementById('saveWeatherLocation');

        // Settings modal
        settingsBtn.addEventListener('click', () => {
            settingsModal.classList.add('visible');
            settingsModal.setAttribute('aria-hidden', 'false');
            this.loadSettingsValues();
        });

        closeBtn.addEventListener('click', () => {
            settingsModal.classList.remove('visible');
            settingsModal.setAttribute('aria-hidden', 'true');
        });

        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                settingsModal.classList.remove('visible');
                settingsModal.setAttribute('aria-hidden', 'true');
            }
        });

        // Theme selection
        themeSelect.addEventListener('change', (e) => {
            this.components.themeManager.applyTheme(e.target.value);
        });

        // Timezone selection
        timezoneSelect.addEventListener('change', (e) => {
            window.dispatchEvent(new CustomEvent('timezoneChanged', {
                detail: { timezone: e.target.value }
            }));
        });

        // Weather location
        saveWeatherBtn.addEventListener('click', () => {
            const location = weatherLocationInput.value.trim();
            if (location) {
                window.dispatchEvent(new CustomEvent('weatherLocationChanged', {
                    detail: { location }
                }));
                this.showSettingsSaved();
            }
        });

        weatherLocationInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveWeatherBtn.click();
            }
        });
    }

    loadSettingsValues() {
        const themeSelect = document.getElementById('themeSelect');
        const timezoneSelect = document.getElementById('timezoneSelect');
        const weatherLocationInput = document.getElementById('weatherLocation');

        // Load current values
        themeSelect.value = this.components.themeManager.currentTheme;
        timezoneSelect.value = localStorage.getItem('selectedTimezone') || 'local';
        weatherLocationInput.value = localStorage.getItem('weatherLocation') || '';
    }

    showSettingsSaved() {
        const feedback = document.createElement('div');
        feedback.textContent = 'Settings saved!';
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--primary-color);
            color: var(--background-color);
            padding: 8px 16px;
            border-radius: 4px;
            font-family: 'Share Tech Mono', monospace;
            z-index: 10000;
            pointer-events: none;
        `;
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.remove();
        }, 2000);
    }

    setupAITools() {
        const aiTools = {
            chatgpt: 'https://chat.openai.com/',
            grok: 'https://x.com/i/grok',
            blackbox: 'https://www.blackbox.ai/',
            perplexity: 'https://www.perplexity.ai/',
            gemini: 'https://gemini.google.com/',
            copilot: 'https://copilot.microsoft.com/',
            claude: 'https://claude.ai/',
            metaai: 'https://www.meta.ai/'
        };

        document.querySelectorAll('.ai-tool').forEach(tool => {
            tool.addEventListener('click', () => {
                const toolName = tool.dataset.tool;
                if (aiTools[toolName]) {
                    window.open(aiTools[toolName], '_blank');
                }
            });
        });
    }

    // Public methods for external access
    getComponent(name) {
        return this.components[name];
    }

    getAllComponents() {
        return { ...this.components };
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.hackerSearchApp = new HackerSearchApp();
});

// Export for module usage
export default HackerSearchApp;