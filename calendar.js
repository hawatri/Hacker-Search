class CalendarWidget {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.notes = JSON.parse(localStorage.getItem('calendarNotes')) || {};
        this.init();
    }

    init() {
        this.renderCalendar();
        this.setupEventListeners();
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Update calendar title
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
        document.querySelector('.calendar-title').textContent = `${monthNames[month]} ${year}`;

        // Get first day of month and total days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const totalDays = lastDay.getDate();
        const startingDay = firstDay.getDay();

        // Clear existing days
        const daysContainer = document.querySelector('.calendar-days');
        daysContainer.innerHTML = '';

        // Add days from previous month
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startingDay - 1; i >= 0; i--) {
            const dayElement = this.createDayElement(prevMonthLastDay - i, 'other-month');
            daysContainer.appendChild(dayElement);
        }

        // Add days of current month
        const today = new Date();
        for (let day = 1; day <= totalDays; day++) {
            const isToday = day === today.getDate() && 
                          month === today.getMonth() && 
                          year === today.getFullYear();
            const dateKey = `${year}-${month + 1}-${day}`;
            const hasNote = this.notes[dateKey];
            
            const dayElement = this.createDayElement(day, isToday ? 'today' : '', hasNote ? 'has-note' : '');
            daysContainer.appendChild(dayElement);
        }

        // Add days from next month
        const remainingDays = 42 - (startingDay + totalDays); // 42 = 6 rows * 7 days
        for (let day = 1; day <= remainingDays; day++) {
            const dayElement = this.createDayElement(day, 'other-month');
            daysContainer.appendChild(dayElement);
        }
    }

    createDayElement(day, ...classes) {
        const dayElement = document.createElement('div');
        dayElement.className = `calendar-day ${classes.join(' ')}`;
        dayElement.textContent = day;
        
        if (!classes.includes('other-month')) {
            dayElement.addEventListener('click', () => this.handleDayClick(day));
        }
        
        return dayElement;
    }

    handleDayClick(day) {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth() + 1;
        const dateKey = `${year}-${month}-${day}`;
        this.selectedDate = dateKey;
        
        const modal = document.querySelector('.calendar-note-modal');
        const title = modal.querySelector('h4');
        const input = modal.querySelector('.calendar-note-input');
        
        title.textContent = `Notes for ${month}/${day}/${year}`;
        input.value = this.notes[dateKey] || '';
        
        modal.classList.add('visible');
    }

    setupEventListeners() {
        // Navigation buttons
        document.querySelector('.calendar-prev').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });

        document.querySelector('.calendar-next').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        // Note modal buttons
        const modal = document.querySelector('.calendar-note-modal');
        const saveBtn = modal.querySelector('.calendar-note-save');
        const closeBtn = modal.querySelector('.calendar-note-close');
        const input = modal.querySelector('.calendar-note-input');

        saveBtn.addEventListener('click', () => {
            if (this.selectedDate) {
                const note = input.value.trim();
                if (note) {
                    this.notes[this.selectedDate] = note;
                } else {
                    delete this.notes[this.selectedDate];
                }
                localStorage.setItem('calendarNotes', JSON.stringify(this.notes));
                this.renderCalendar();
            }
            modal.classList.remove('visible');
        });

        closeBtn.addEventListener('click', () => {
            modal.classList.remove('visible');
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('visible');
            }
        });
    }
}

// Initialize calendar widget when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CalendarWidget();
}); 