// Search engine functionality
export class SearchEngine {
    constructor() {
        this.engines = {
            google: {
                name: 'Google',
                url: 'https://www.google.com/search?q=',
                suggestions: 'https://suggestqueries.google.com/complete/search?client=chrome&q='
            },
            youtube: {
                name: 'YouTube',
                url: 'https://www.youtube.com/results?search_query=',
                suggestions: null
            },
            github: {
                name: 'GitHub',
                url: 'https://github.com/search?q=',
                suggestions: null
            },
            duckduckgo: {
                name: 'DuckDuckGo',
                url: 'https://duckduckgo.com/?q=',
                suggestions: 'https://duckduckgo.com/ac/?q='
            },
            bing: {
                name: 'Bing',
                url: 'https://www.bing.com/search?q=',
                suggestions: 'https://www.bing.com/osjson.aspx?query='
            },
            scholar: {
                name: 'Google Scholar',
                url: 'https://scholar.google.com/scholar?q=',
                suggestions: null
            }
        };

        this.currentEngine = this.loadSelectedEngine();
        this.searchHistory = this.loadSearchHistory();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateSelectedEngine();
    }

    setupEventListeners() {
        const searchForm = document.getElementById('searchForm');
        const searchInput = document.getElementById('searchInput');
        const tags = document.querySelectorAll('.tag');

        // Search form submission
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.performSearch();
        });

        // Engine tag selection
        tags.forEach(tag => {
            tag.addEventListener('click', () => {
                this.selectEngine(tag.dataset.engine);
            });

            // Keyboard support for tags
            tag.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.selectEngine(tag.dataset.engine);
                }
            });
        });

        // Search input handling
        searchInput.addEventListener('input', (e) => {
            this.handleSearchInput(e.target.value);
        });

        searchInput.addEventListener('keydown', (e) => {
            this.handleSearchKeydown(e);
        });

        // Focus search input on page load
        searchInput.focus();
    }

    handleSearchInput(query) {
        if (query.length > 2) {
            this.showSuggestions(query);
        } else {
            this.hideSuggestions();
        }
    }

    handleSearchKeydown(e) {
        const suggestionsContainer = document.querySelector('.search-suggestions');
        const suggestions = suggestionsContainer?.querySelectorAll('.suggestion-item');
        
        if (!suggestions || suggestions.length === 0) return;

        let currentIndex = Array.from(suggestions).findIndex(s => s.classList.contains('selected'));

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                currentIndex = currentIndex < suggestions.length - 1 ? currentIndex + 1 : 0;
                this.selectSuggestion(suggestions, currentIndex);
                break;
            case 'ArrowUp':
                e.preventDefault();
                currentIndex = currentIndex > 0 ? currentIndex - 1 : suggestions.length - 1;
                this.selectSuggestion(suggestions, currentIndex);
                break;
            case 'Enter':
                if (currentIndex >= 0) {
                    e.preventDefault();
                    suggestions[currentIndex].click();
                }
                break;
            case 'Escape':
                this.hideSuggestions();
                break;
        }
    }

    selectSuggestion(suggestions, index) {
        suggestions.forEach(s => s.classList.remove('selected'));
        if (suggestions[index]) {
            suggestions[index].classList.add('selected');
        }
    }

    async showSuggestions(query) {
        const engine = this.engines[this.currentEngine];
        if (!engine.suggestions) return;

        try {
            // For now, show search history as suggestions
            const historySuggestions = this.searchHistory
                .filter(item => item.query.toLowerCase().includes(query.toLowerCase()))
                .slice(0, 5);

            this.renderSuggestions(historySuggestions, query);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        }
    }

    renderSuggestions(suggestions, query) {
        let suggestionsContainer = document.querySelector('.search-suggestions');
        
        if (!suggestionsContainer) {
            suggestionsContainer = document.createElement('div');
            suggestionsContainer.className = 'search-suggestions';
            document.getElementById('searchForm').appendChild(suggestionsContainer);
        }

        if (suggestions.length === 0) {
            this.hideSuggestions();
            return;
        }

        suggestionsContainer.innerHTML = suggestions.map(item => `
            <div class="suggestion-item" data-query="${item.query}">
                <div class="suggestion-title">${this.highlightQuery(item.query, query)}</div>
                <div class="suggestion-url">${item.engine} • ${item.timestamp}</div>
            </div>
        `).join('');

        // Add click handlers
        suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                document.getElementById('searchInput').value = item.dataset.query;
                this.hideSuggestions();
                this.performSearch();
            });
        });

        suggestionsContainer.style.display = 'block';
    }

    highlightQuery(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<strong>$1</strong>');
    }

    hideSuggestions() {
        const suggestionsContainer = document.querySelector('.search-suggestions');
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
        }
    }

    performSearch() {
        const searchInput = document.getElementById('searchInput');
        let query = searchInput.value.trim();
        
        if (!query) return;

        // Check for command syntax
        const { engine, searchQuery, newTab } = this.parseSearchCommand(query);
        
        // Save to history
        this.addToHistory(searchQuery, engine);
        
        // Perform search
        const searchUrl = this.engines[engine].url + encodeURIComponent(searchQuery);
        
        if (newTab) {
            window.open(searchUrl, '_blank');
        } else {
            window.location.href = searchUrl;
        }
    }

    parseSearchCommand(input) {
        const parts = input.trim().split(' ');
        let engine = this.currentEngine;
        let newTab = false;
        let searchQuery = input;

        // Check for NT (New Tab) command
        if (parts[0].toLowerCase() === 'nt' && parts.length > 1) {
            newTab = true;
            parts.shift(); // Remove 'nt'
            
            // Check if next part is an engine
            if (this.engines[parts[0]?.toLowerCase()]) {
                engine = parts.shift().toLowerCase();
            }
            
            searchQuery = parts.join(' ');
        } else if (this.engines[parts[0]?.toLowerCase()] && parts.length > 1) {
            // Direct engine command
            engine = parts.shift().toLowerCase();
            searchQuery = parts.join(' ');
        }

        return { engine, searchQuery, newTab };
    }

    selectEngine(engineKey) {
        if (!this.engines[engineKey]) return;

        this.currentEngine = engineKey;
        this.updateSelectedEngine();
        this.saveSelectedEngine();
        
        // Focus search input
        document.getElementById('searchInput').focus();
    }

    updateSelectedEngine() {
        const tags = document.querySelectorAll('.tag');
        tags.forEach(tag => {
            if (tag.dataset.engine === this.currentEngine) {
                tag.classList.add('selected');
                tag.setAttribute('aria-pressed', 'true');
            } else {
                tag.classList.remove('selected');
                tag.setAttribute('aria-pressed', 'false');
            }
        });
    }

    addToHistory(query, engine) {
        const historyItem = {
            query,
            engine,
            timestamp: new Date().toLocaleString()
        };

        this.searchHistory.unshift(historyItem);
        
        // Keep only last 50 searches
        if (this.searchHistory.length > 50) {
            this.searchHistory = this.searchHistory.slice(0, 50);
        }

        this.saveSearchHistory();
    }

    loadSelectedEngine() {
        return localStorage.getItem('selectedEngine') || 'google';
    }

    saveSelectedEngine() {
        localStorage.setItem('selectedEngine', this.currentEngine);
    }

    loadSearchHistory() {
        try {
            return JSON.parse(localStorage.getItem('searchHistory')) || [];
        } catch {
            return [];
        }
    }

    saveSearchHistory() {
        localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
    }

    getSearchHistory() {
        return this.searchHistory;
    }

    clearSearchHistory() {
        this.searchHistory = [];
        this.saveSearchHistory();
    }
}