import { Component, computed, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

export type Priority = 'high' | 'medium' | 'low';

export interface Todo {
    id: number;
    text: string;
    completed: boolean;
    priority: Priority;
    createdAt: number;
}

type FilterType = 'all' | 'active' | 'completed';

@Component({
    selector: 'app-todo-list',
    standalone: true,
    imports: [FormsModule, CommonModule],
    templateUrl: './todo-list.component.html',
    styleUrl: './todo-list.component.css',
})
export class TodoListComponent {
    todos = signal<Todo[]>([]);
    newTodoText = signal('');
    newTodoPriority = signal<Priority>('medium');
    currentFilter = signal<FilterType>('all');

    // Track which item is being edited
    editingId = signal<number | null>(null);

    constructor() {
        const saved = localStorage.getItem('angular-todos');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Migration: Ensure all have priority
                this.todos.set(parsed.map((t: any) => ({ ...t, priority: t.priority || 'medium' })));
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
            this.todos.update((todos) => [
                {
                    id: Date.now(),
                    text,
                    completed: false,
                    priority: this.newTodoPriority(),
                    createdAt: Date.now(),
                },
                ...todos,
            ]);
            this.newTodoText.set('');
            this.newTodoPriority.set('medium');
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

    setFilter(filter: FilterType) {
        this.currentFilter.set(filter);
    }

    setPriority(priority: Priority) {
        this.newTodoPriority.set(priority);
    }

    filteredTodos = computed(() => {
        const filter = this.currentFilter();
        const todos = this.todos();

        // Sort specific logic: High priority usually comes first, but user didn't ask for sort. 
        // Let's keep manual sort order but just filter.

        switch (filter) {
            case 'active':
                return todos.filter((t) => !t.completed);
            case 'completed':
                return todos.filter((t) => t.completed);
            default:
                return todos;
        }
    });

    completedCount = computed(() => this.todos().filter((t) => t.completed).length);
    totalCount = computed(() => this.todos().length);
    hasCompleted = computed(() => this.todos().some(t => t.completed));
}
