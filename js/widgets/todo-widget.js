// Todo widget functionality
import { Utils } from '../utils.js';

export class TodoWidget {
    constructor() {
        this.todos = this.loadTodos();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderTodos();
    }

    setupEventListeners() {
        const todoInput = document.getElementById('todoInput');
        const addTodoBtn = document.getElementById('addTodoBtn');

        if (addTodoBtn) {
            addTodoBtn.addEventListener('click', () => {
                this.addTodo();
            });
        }

        if (todoInput) {
            todoInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addTodo();
                }
            });
        }
    }

    addTodo() {
        const todoInput = document.getElementById('todoInput');
        const text = todoInput.value.trim();
        
        if (!text) return;

        const todo = {
            id: Utils.generateId(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.todos.unshift(todo);
        this.saveTodos();
        this.renderTodos();
        
        todoInput.value = '';
        todoInput.focus();
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.renderTodos();
        }
    }

    deleteTodo(id) {
        this.todos = this.todos.filter(t => t.id !== id);
        this.saveTodos();
        this.renderTodos();
    }

    renderTodos() {
        const todoList = document.getElementById('todoList');
        if (!todoList) return;

        if (this.todos.length === 0) {
            todoList.innerHTML = '<div class="todo-empty">No tasks yet. Add one above!</div>';
            return;
        }

        todoList.innerHTML = this.todos.map(todo => `
            <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <div class="todo-item-content">${Utils.sanitizeHTML(todo.text)}</div>
                <div class="todo-item-controls">
                    <button onclick="window.todoWidget.toggleTodo('${todo.id}')" 
                            class="todo-toggle-btn" 
                            aria-label="${todo.completed ? 'Mark as incomplete' : 'Mark as complete'}">
                        ${todo.completed ? '↶' : '✓'}
                    </button>
                    <button onclick="window.todoWidget.deleteTodo('${todo.id}')" 
                            class="delete-btn" 
                            aria-label="Delete task">
                        ×
                    </button>
                </div>
            </div>
        `).join('');
    }

    loadTodos() {
        return Utils.getStorageData('todos', []);
    }

    saveTodos() {
        Utils.setStorageData('todos', this.todos);
    }

    getTodos() {
        return this.todos;
    }

    clearCompleted() {
        this.todos = this.todos.filter(t => !t.completed);
        this.saveTodos();
        this.renderTodos();
    }

    clearAll() {
        this.todos = [];
        this.saveTodos();
        this.renderTodos();
    }
}