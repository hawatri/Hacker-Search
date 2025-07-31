// Theme management for the Hacker Search extension
export class ThemeManager {
    constructor() {
        this.themes = {
            matrix: {
                name: 'Matrix',
                primaryColor: '#00ff00',
                primaryHover: '#003300',
                primaryLight: '#66ff66',
                backgroundColor: '#0f0e0e',
                backgroundLight: '#0a0a0a',
                textColor: '#00ff00',
                borderColor: '#00ff00',
                shadowColor: '#00ff00',
                accentColor: '#ff3300'
            },
            cyberpunk: {
                name: 'Cyberpunk',
                primaryColor: '#ff00ff',
                primaryHover: '#330033',
                primaryLight: '#ff66ff',
                backgroundColor: '#0f0e0e',
                backgroundLight: '#0a0a0a',
                textColor: '#ff00ff',
                borderColor: '#ff00ff',
                shadowColor: '#ff00ff',
                accentColor: '#00ffff'
            },
            retro: {
                name: 'Retro',
                primaryColor: '#ffb000',
                primaryHover: '#332600',
                primaryLight: '#ffcc66',
                backgroundColor: '#0f0e0e',
                backgroundLight: '#0a0a0a',
                textColor: '#ffb000',
                borderColor: '#ffb000',
                shadowColor: '#ffb000',
                accentColor: '#ff3300'
            },
            hacker: {
                name: 'Hacker',
                primaryColor: '#00ffff',
                primaryHover: '#003333',
                primaryLight: '#66ffff',
                backgroundColor: '#0f0e0e',
                backgroundLight: '#0a0a0a',
                textColor: '#00ffff',
                borderColor: '#00ffff',
                shadowColor: '#00ffff',
                accentColor: '#ff3300'
            },
            neon: {
                name: 'Neon',
                primaryColor: '#9d00ff',
                primaryHover: '#330033',
                primaryLight: '#cc66ff',
                backgroundColor: '#0f0e0e',
                backgroundLight: '#0a0a0a',
                textColor: '#9d00ff',
                borderColor: '#9d00ff',
                shadowColor: '#9d00ff',
                accentColor: '#ff3300'
            }
        };

        this.currentTheme = this.loadTheme();
        this.applyTheme(this.currentTheme);
    }

    loadTheme() {
        return localStorage.getItem('selectedTheme') || 'matrix';
    }

    saveTheme(themeName) {
        localStorage.setItem('selectedTheme', themeName);
    }

    applyTheme(themeName) {
        if (!this.themes[themeName]) {
            console.warn(`Theme ${themeName} not found, using matrix theme`);
            themeName = 'matrix';
        }

        document.body.setAttribute('data-theme', themeName);
        this.currentTheme = themeName;
        this.saveTheme(themeName);

        // Dispatch theme change event
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: themeName, colors: this.themes[themeName] }
        }));
    }

    getThemeColors(themeName = this.currentTheme) {
        return this.themes[themeName] || this.themes.matrix;
    }

    getAllThemes() {
        return Object.keys(this.themes).map(key => ({
            key,
            name: this.themes[key].name
        }));
    }
}