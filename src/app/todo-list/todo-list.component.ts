import { Component, computed, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export type Priority = 'high' | 'medium' | 'low';

export interface Todo {
    id: number;
    text: string;
    completed: boolean;
    priority: Priority;
    createdAt: number;
    dueDate: string | null;
}

type FilterType = 'all' | 'active' | 'completed';

@Component({
    selector: 'app-todo-list',
    standalone: true,
    imports: [FormsModule, CommonModule, RouterLink],
    templateUrl: './todo-list.component.html',
    styleUrl: './todo-list.component.css',
})
export class TodoListComponent {
    todos = signal<Todo[]>([]);

    // Inputs
    newTodoText = signal('');
    newTodoPriority = signal<Priority>('medium');
    newTodoDate = signal('');
    searchQuery = signal('');

    // State
    currentFilter = signal<FilterType>('all');
    editingId = signal<number | null>(null);

    constructor() {
        const saved = localStorage.getItem('angular-todos');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.todos.set(parsed.map((t: any) => ({
                    ...t,
                    priority: t.priority || 'medium',
                    dueDate: t.dueDate || null
                })));
            } catch (e) {
                console.error('Failed to load todos', e);
            }
        }

        effect(() => {
            localStorage.setItem('angular-todos', JSON.stringify(this.todos()));
        });
    }

    addTodo() {
        const text = this.newTodoText().trim();
        if (text) {
            let date = this.newTodoDate();
            // Validate date: Prevent year > 9999
            if (date) {
                const year = new Date(date).getFullYear();
                if (year > 9999 || date.length > 10) {
                    date = ''; // Or handle explicitly
                }
            }

            this.todos.update((todos) => [
                {
                    id: Date.now(),
                    text,
                    completed: false,
                    priority: this.newTodoPriority(),
                    createdAt: Date.now(),
                    dueDate: date || null,
                },
                ...todos,
            ]);
            // Reset inputs
            this.newTodoText.set('');
            this.newTodoPriority.set('medium');
            this.newTodoDate.set('');
        }
    }

    toggleTodo(id: number) {
        this.todos.update((todos) =>
            todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo))
        );
    }

    deleteTodo(id: number) {
        this.todos.update((todos) => todos.filter((t) => t.id !== id));
    }

    clearCompleted() {
        this.todos.update((todos) => todos.filter((t) => !t.completed));
    }

    // Editing
    startEdit(id: number) {
        if (!this.todos().find(t => t.id === id)?.completed) {
            this.editingId.set(id);
        }
    }

    saveEdit(id: number, event: Event) {
        const input = event.target as HTMLInputElement;
        const newText = input.value.trim();
        if (newText) {
            this.todos.update(todos =>
                todos.map(t => t.id === id ? { ...t, text: newText } : t)
            );
        }
        this.editingId.set(null);
    }

    cancelEdit() {
        this.editingId.set(null);
    }

    // Setters
    setFilter(filter: FilterType) { this.currentFilter.set(filter); }
    setPriority(priority: Priority) { this.newTodoPriority.set(priority); }

    // Search & Filter Logic
    filteredTodos = computed(() => {
        const filter = this.currentFilter();
        const query = this.searchQuery().toLowerCase();
        let todos = this.todos();

        // 1. Apply Search
        if (query) {
            todos = todos.filter(t => t.text.toLowerCase().includes(query));
        }

        // 2. Apply Tabs
        switch (filter) {
            case 'active':
                return todos.filter(t => !t.completed);
            case 'completed':
                return todos.filter(t => t.completed);
            default:
                return todos;
        }
    });

    // Helpers for Display
    getDueDateLabel(dateStr: string | null): string {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Reset date part to compare only dates
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);

        const diffTime = checkDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'Overdue';
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';

        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }

    isOverdue(dateStr: string | null): boolean {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return new Date(dateStr) < now;
    }

    completedCount = computed(() => this.todos().filter((t) => t.completed).length);
    totalCount = computed(() => this.todos().length);
    hasCompleted = computed(() => this.todos().some(t => t.completed));
}
