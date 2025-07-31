// Clipboard widget functionality
import { Utils } from '../utils.js';

export class ClipboardWidget {
    constructor() {
        this.clipboardHistory = this.loadClipboardHistory();
        this.maxItems = 50;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderClipboard();
        this.startClipboardMonitoring();
    }

    setupEventListeners() {
        const clearBtn = document.getElementById('clearClipboard');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearAll();
            });
        }

        // Listen for copy events
        document.addEventListener('copy', () => {
            setTimeout(() => {
                this.checkClipboard();
            }, 100);
        });
    }

    async startClipboardMonitoring() {
        if (!navigator.clipboard || !navigator.clipboard.readText) {
            console.warn('Clipboard API not available');
            return;
        }

        // Check clipboard every 2 seconds
        setInterval(() => {
            this.checkClipboard();
        }, 2000);
    }

    async checkClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            if (text && text.trim()) {
                this.addToClipboard(text.trim());
            }
        } catch (error) {
            // Clipboard access denied or not available
            console.debug('Clipboard access not available:', error.message);
        }
    }

    addToClipboard(text) {
        // Don't add if it's the same as the last item
        if (this.clipboardHistory.length > 0 && this.clipboardHistory[0].text === text) {
            return;
        }

        const item = {
            id: Utils.generateId(),
            text: text,
            timestamp: new Date().toLocaleString(),
            createdAt: new Date().toISOString()
        };

        this.clipboardHistory.unshift(item);

        // Keep only the last maxItems
        if (this.clipboardHistory.length > this.maxItems) {
            this.clipboardHistory = this.clipboardHistory.slice(0, this.maxItems);
        }

        this.saveClipboardHistory();
        this.renderClipboard();
    }

    async copyToClipboard(text) {
        try {
            await Utils.copyToClipboard(text);
            // Show feedback
            this.showCopyFeedback();
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
        }
    }

    showCopyFeedback() {
        // Create temporary feedback element
        const feedback = document.createElement('div');
        feedback.textContent = 'Copied!';
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
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
        }, 1000);
    }

    deleteItem(id) {
        this.clipboardHistory = this.clipboardHistory.filter(item => item.id !== id);
        this.saveClipboardHistory();
        this.renderClipboard();
    }

    clearAll() {
        this.clipboardHistory = [];
        this.saveClipboardHistory();
        this.renderClipboard();
    }

    renderClipboard() {
        const clipboardList = document.querySelector('#clipboardWidget .clipboard-list');
        if (!clipboardList) return;

        if (this.clipboardHistory.length === 0) {
            clipboardList.innerHTML = '<div class="clipboard-empty">No clipboard history yet.</div>';
            return;
        }

        clipboardList.innerHTML = this.clipboardHistory.map(item => `
            <div class="clipboard-item" data-id="${item.id}">
                <div class="clipboard-timestamp">${item.timestamp}</div>
                <div class="clipboard-content">${Utils.sanitizeHTML(item.text.substring(0, 200))}${item.text.length > 200 ? '...' : ''}</div>
                <div class="clipboard-controls">
                    <button onclick="window.clipboardWidget.copyToClipboard('${item.text.replace(/'/g, "\\'")}')" 
                            class="clipboard-button" 
                            aria-label="Copy to clipboard">
                        Copy
                    </button>
                    <button onclick="window.clipboardWidget.deleteItem('${item.id}')" 
                            class="clipboard-button delete" 
                            aria-label="Delete item">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    loadClipboardHistory() {
        return Utils.getStorageData('clipboardHistory', []);
    }

    saveClipboardHistory() {
        Utils.setStorageData('clipboardHistory', this.clipboardHistory);
    }

    getClipboardHistory() {
        return this.clipboardHistory;
    }
}