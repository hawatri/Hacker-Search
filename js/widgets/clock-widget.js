// Clock widget functionality
import { Utils } from '../utils.js';

export class ClockWidget {
    constructor() {
        this.isAnalog = false;
        this.timezone = this.loadTimezone();
        this.clockInterval = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startClock();
    }

    setupEventListeners() {
        const toggleBtn = document.querySelector('#clockWidget .toggle-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleClockMode();
            });
        }

        // Listen for timezone changes
        window.addEventListener('timezoneChanged', (e) => {
            this.timezone = e.detail.timezone;
            this.saveTimezone();
        });
    }

    toggleClockMode() {
        this.isAnalog = !this.isAnalog;
        
        const digitalClock = document.getElementById('digitalClock');
        const analogClock = document.getElementById('analogClock');
        const toggleBtn = document.querySelector('#clockWidget .toggle-btn');

        if (this.isAnalog) {
            digitalClock.style.display = 'none';
            analogClock.classList.add('visible');
            toggleBtn.textContent = 'Digital';
            toggleBtn.setAttribute('aria-pressed', 'true');
        } else {
            digitalClock.style.display = 'block';
            analogClock.classList.remove('visible');
            toggleBtn.textContent = 'Analog';
            toggleBtn.setAttribute('aria-pressed', 'false');
        }

        this.saveClockMode();
    }

    startClock() {
        this.updateClock();
        this.clockInterval = setInterval(() => {
            this.updateClock();
        }, 1000);
    }

    updateClock() {
        const now = new Date();
        
        if (this.isAnalog) {
            this.updateAnalogClock(now);
        } else {
            this.updateDigitalClock(now);
        }
    }

    updateDigitalClock(date) {
        const digitalClock = document.getElementById('digitalClock');
        if (digitalClock) {
            digitalClock.textContent = Utils.formatTime(date, this.timezone);
        }
    }

    updateAnalogClock(date) {
        const hours = date.getHours() % 12;
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();

        // Calculate angles (12 o'clock is 0 degrees)
        const hourAngle = (hours * 30) + (minutes * 0.5) - 90;
        const minuteAngle = (minutes * 6) - 90;
        const secondAngle = (seconds * 6) - 90;

        // Update hands
        const hourHand = document.getElementById('hourHand');
        const minuteHand = document.getElementById('minuteHand');
        const secondHand = document.getElementById('secondHand');

        if (hourHand) {
            hourHand.style.transform = `translate(-50%, -100%) rotate(${hourAngle}deg)`;
        }
        if (minuteHand) {
            minuteHand.style.transform = `translate(-50%, -100%) rotate(${minuteAngle}deg)`;
        }
        if (secondHand) {
            secondHand.style.transform = `translate(-50%, -100%) rotate(${secondAngle}deg)`;
        }
    }

    loadTimezone() {
        return localStorage.getItem('selectedTimezone') || 'local';
    }

    saveTimezone() {
        localStorage.setItem('selectedTimezone', this.timezone);
    }

    loadClockMode() {
        return localStorage.getItem('clockMode') === 'analog';
    }

    saveClockMode() {
        localStorage.setItem('clockMode', this.isAnalog ? 'analog' : 'digital');
    }

    destroy() {
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
        }
    }
}