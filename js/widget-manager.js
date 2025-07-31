// Widget management system
import { Utils } from './utils.js';

export class WidgetManager {
    constructor() {
        this.widgets = new Map();
        this.dragState = {
            isDragging: false,
            currentWidget: null,
            offset: { x: 0, y: 0 }
        };
        this.sizes = ['Small', 'Normal', 'Large', 'Huge'];
        this.sizeClasses = ['size-small', 'size-normal', 'size-large', 'size-huge'];
        
        this.init();
    }

    init() {
        this.loadWidgetStates();
        this.setupEventListeners();
        this.initializeWidgets();
    }

    registerWidget(id, config = {}) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`Widget element ${id} not found`);
            return;
        }

        const widget = {
            id,
            element,
            isMinimized: false,
            isLocked: false,
            currentSize: 1, // Normal size index
            position: { x: 0, y: 0 },
            ...config
        };

        this.widgets.set(id, widget);
        this.setupWidgetControls(widget);
        this.restoreWidgetState(widget);
    }

    setupWidgetControls(widget) {
        const header = widget.element.querySelector('.drag-header');
        const minimizeBtn = widget.element.querySelector('.minimize-btn');
        const resizeBtn = widget.element.querySelector('.resize-btn');
        const lockBtn = widget.element.querySelector('.lock-btn');

        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMinimize(widget.id);
            });
        }

        if (resizeBtn) {
            resizeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.cycleSize(widget.id);
            });
        }

        if (lockBtn) {
            lockBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleLock(widget.id);
            });
        }

        if (header) {
            header.addEventListener('mousedown', (e) => this.startDrag(e, widget));
            header.addEventListener('keydown', (e) => this.handleKeyboardMove(e, widget));
        }
    }

    startDrag(e, widget) {
        if (widget.isLocked || widget.isMinimized) return;

        this.dragState.isDragging = true;
        this.dragState.currentWidget = widget;
        
        const rect = widget.element.getBoundingClientRect();
        this.dragState.offset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        widget.element.style.zIndex = '1000';
        document.addEventListener('mousemove', this.handleDrag);
        document.addEventListener('mouseup', this.stopDrag);
    }

    handleDrag = (e) => {
        if (!this.dragState.isDragging || !this.dragState.currentWidget) return;

        const widget = this.dragState.currentWidget;
        const x = e.clientX - this.dragState.offset.x;
        const y = e.clientY - this.dragState.offset.y;

        // Constrain to viewport
        const maxX = window.innerWidth - widget.element.offsetWidth;
        const maxY = window.innerHeight - widget.element.offsetHeight;

        widget.position.x = Math.max(0, Math.min(x, maxX));
        widget.position.y = Math.max(0, Math.min(y, maxY));

        widget.element.style.left = `${widget.position.x}px`;
        widget.element.style.top = `${widget.position.y}px`;
    }

    stopDrag = () => {
        if (this.dragState.currentWidget) {
            this.dragState.currentWidget.element.style.zIndex = '';
            this.saveWidgetState(this.dragState.currentWidget);
        }

        this.dragState.isDragging = false;
        this.dragState.currentWidget = null;
        
        document.removeEventListener('mousemove', this.handleDrag);
        document.removeEventListener('mouseup', this.stopDrag);
    }

    handleKeyboardMove(e, widget) {
        if (widget.isLocked || widget.isMinimized) return;

        const step = e.shiftKey ? 10 : 1;
        let moved = false;

        switch (e.key) {
            case 'ArrowLeft':
                widget.position.x = Math.max(0, widget.position.x - step);
                moved = true;
                break;
            case 'ArrowRight':
                widget.position.x = Math.min(window.innerWidth - widget.element.offsetWidth, widget.position.x + step);
                moved = true;
                break;
            case 'ArrowUp':
                widget.position.y = Math.max(0, widget.position.y - step);
                moved = true;
                break;
            case 'ArrowDown':
                widget.position.y = Math.min(window.innerHeight - widget.element.offsetHeight, widget.position.y + step);
                moved = true;
                break;
        }

        if (moved) {
            e.preventDefault();
            widget.element.style.left = `${widget.position.x}px`;
            widget.element.style.top = `${widget.position.y}px`;
            this.saveWidgetState(widget);
        }
    }

    toggleMinimize(widgetId) {
        const widget = this.widgets.get(widgetId);
        if (!widget) return;

        widget.isMinimized = !widget.isMinimized;
        
        if (widget.isMinimized) {
            this.minimizeWidget(widget);
        } else {
            this.restoreWidget(widget);
        }

        this.saveWidgetState(widget);
    }

    minimizeWidget(widget) {
        widget.element.style.display = 'none';
        
        const minimizedContainer = document.getElementById('minimizedContainer');
        const minimizedElement = document.createElement('div');
        minimizedElement.className = 'minimized-widget';
        minimizedElement.textContent = widget.element.querySelector('.drag-header').textContent.split('\n')[0].trim();
        minimizedElement.dataset.widgetId = widget.id;
        
        minimizedElement.addEventListener('click', () => {
            this.toggleMinimize(widget.id);
        });

        minimizedContainer.appendChild(minimizedElement);
    }

    restoreWidget(widget) {
        widget.element.style.display = 'flex';
        
        const minimizedElement = document.querySelector(`[data-widget-id="${widget.id}"]`);
        if (minimizedElement) {
            minimizedElement.remove();
        }
    }

    cycleSize(widgetId) {
        const widget = this.widgets.get(widgetId);
        if (!widget) return;

        // Remove current size class
        widget.element.classList.remove(...this.sizeClasses);
        
        // Cycle to next size
        widget.currentSize = (widget.currentSize + 1) % this.sizes.length;
        
        // Add new size class
        widget.element.classList.add(this.sizeClasses[widget.currentSize]);
        
        // Update resize button title
        const resizeBtn = widget.element.querySelector('.resize-btn');
        if (resizeBtn) {
            resizeBtn.title = `Size: ${this.sizes[widget.currentSize]}`;
        }

        this.saveWidgetState(widget);
    }

    toggleLock(widgetId) {
        const widget = this.widgets.get(widgetId);
        if (!widget) return;

        widget.isLocked = !widget.isLocked;
        
        const lockBtn = widget.element.querySelector('.lock-btn');
        const header = widget.element.querySelector('.drag-header');
        
        if (widget.isLocked) {
            lockBtn.classList.add('locked');
            lockBtn.textContent = '[L]';
            header.style.cursor = 'default';
        } else {
            lockBtn.classList.remove('locked');
            lockBtn.textContent = '[X]';
            header.style.cursor = 'move';
        }

        this.saveWidgetState(widget);
    }

    saveWidgetState(widget) {
        const state = {
            position: widget.position,
            isMinimized: widget.isMinimized,
            isLocked: widget.isLocked,
            currentSize: widget.currentSize
        };
        
        Utils.setStorageData(`widget_${widget.id}`, state);
    }

    restoreWidgetState(widget) {
        const state = Utils.getStorageData(`widget_${widget.id}`);
        if (!state) return;

        // Restore position
        if (state.position) {
            widget.position = state.position;
            widget.element.style.left = `${widget.position.x}px`;
            widget.element.style.top = `${widget.position.y}px`;
        }

        // Restore size
        if (typeof state.currentSize === 'number') {
            widget.currentSize = state.currentSize;
            widget.element.classList.add(this.sizeClasses[widget.currentSize]);
            
            const resizeBtn = widget.element.querySelector('.resize-btn');
            if (resizeBtn) {
                resizeBtn.title = `Size: ${this.sizes[widget.currentSize]}`;
            }
        }

        // Restore lock state
        if (state.isLocked) {
            widget.isLocked = true;
            this.toggleLock(widget.id);
        }

        // Restore minimize state
        if (state.isMinimized) {
            widget.isMinimized = false; // Set to false first so toggle works
            this.toggleMinimize(widget.id);
        }
    }

    loadWidgetStates() {
        // This will be called after widgets are registered
    }

    initializeWidgets() {
        // Register all widgets found in the DOM
        const widgetElements = document.querySelectorAll('.draggable');
        widgetElements.forEach(element => {
            this.registerWidget(element.id);
        });
    }

    setupEventListeners() {
        // Prevent text selection during drag
        document.addEventListener('selectstart', (e) => {
            if (this.dragState.isDragging) {
                e.preventDefault();
            }
        });

        // Handle window resize
        window.addEventListener('resize', Utils.debounce(() => {
            this.widgets.forEach(widget => {
                // Ensure widgets stay within viewport
                const maxX = window.innerWidth - widget.element.offsetWidth;
                const maxY = window.innerHeight - widget.element.offsetHeight;
                
                if (widget.position.x > maxX) {
                    widget.position.x = Math.max(0, maxX);
                    widget.element.style.left = `${widget.position.x}px`;
                }
                
                if (widget.position.y > maxY) {
                    widget.position.y = Math.max(0, maxY);
                    widget.element.style.top = `${widget.position.y}px`;
                }
            });
        }, 250));
    }

    getWidget(id) {
        return this.widgets.get(id);
    }

    getAllWidgets() {
        return Array.from(this.widgets.values());
    }
}