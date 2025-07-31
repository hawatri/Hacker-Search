// Notes widget functionality
import { Utils } from '../utils.js';

export class NotesWidget {
    constructor() {
        this.notes = this.loadNotes();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderNotes();
    }

    setupEventListeners() {
        const notesInput = document.getElementById('notesInput');
        const addNoteBtn = document.getElementById('addNoteBtn');

        if (addNoteBtn) {
            addNoteBtn.addEventListener('click', () => {
                this.addNote();
            });
        }

        if (notesInput) {
            notesInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    this.addNote();
                }
            });
        }
    }

    addNote() {
        const notesInput = document.getElementById('notesInput');
        const text = notesInput.value.trim();
        
        if (!text) return;

        const note = {
            id: Utils.generateId(),
            text: text,
            createdAt: new Date().toISOString(),
            timestamp: new Date().toLocaleString()
        };

        this.notes.unshift(note);
        this.saveNotes();
        this.renderNotes();
        
        notesInput.value = '';
        notesInput.focus();
    }

    deleteNote(id) {
        this.notes = this.notes.filter(n => n.id !== id);
        this.saveNotes();
        this.renderNotes();
    }

    renderNotes() {
        const notesList = document.getElementById('notesList');
        if (!notesList) return;

        if (this.notes.length === 0) {
            notesList.innerHTML = '<div class="notes-empty">No notes yet. Add one below!</div>';
            return;
        }

        notesList.innerHTML = this.notes.map(note => `
            <div class="note-item" data-id="${note.id}">
                <div class="note-timestamp">${note.timestamp}</div>
                <div class="note-content">${Utils.sanitizeHTML(note.text)}</div>
                <div class="note-controls">
                    <button onclick="window.notesWidget.deleteNote('${note.id}')" 
                            class="delete-btn" 
                            aria-label="Delete note">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    loadNotes() {
        return Utils.getStorageData('notes', []);
    }

    saveNotes() {
        Utils.setStorageData('notes', this.notes);
    }

    getNotes() {
        return this.notes;
    }

    clearAll() {
        this.notes = [];
        this.saveNotes();
        this.renderNotes();
    }
}