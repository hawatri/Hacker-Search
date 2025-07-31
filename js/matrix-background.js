// Matrix background animation
export class MatrixBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.drops = [];
        this.fontSize = 14;
        this.columns = 0;
        this.animationId = null;
        this.isVisible = false;
        
        this.characters = "アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        
        this.init();
        this.setupEventListeners();
    }

    init() {
        this.resize();
        this.initDrops();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.columns = Math.floor(this.canvas.width / this.fontSize);
        this.initDrops();
    }

    initDrops() {
        this.drops = [];
        for (let i = 0; i < this.columns; i++) {
            this.drops[i] = Math.floor(Math.random() * this.canvas.height / this.fontSize);
        }
    }

    draw() {
        // Get current theme colors
        const themeColors = window.themeManager?.getThemeColors() || { primaryColor: '#00ff00' };
        
        // Semi-transparent black background for trail effect
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Set text properties
        this.ctx.fillStyle = themeColors.primaryColor;
        this.ctx.font = `${this.fontSize}px monospace`;

        // Draw characters
        for (let i = 0; i < this.drops.length; i++) {
            const text = this.characters[Math.floor(Math.random() * this.characters.length)];
            const x = i * this.fontSize;
            const y = this.drops[i] * this.fontSize;

            this.ctx.fillText(text, x, y);

            // Reset drop to top randomly
            if (y > this.canvas.height && Math.random() > 0.975) {
                this.drops[i] = 0;
            }

            this.drops[i]++;
        }
    }

    animate() {
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    start() {
        if (!this.isVisible) {
            this.isVisible = true;
            this.canvas.classList.add('visible');
            this.animate();
        }
    }

    stop() {
        if (this.isVisible) {
            this.isVisible = false;
            this.canvas.classList.remove('visible');
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
        }
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resize());
        
        // Listen for theme changes
        window.addEventListener('themeChanged', () => {
            if (this.isVisible) {
                // Redraw with new colors
                this.draw();
            }
        });
    }
}