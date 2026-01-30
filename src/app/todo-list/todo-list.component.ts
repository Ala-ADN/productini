import { Component, computed, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Todo {
    id: number;
    text: string;
    completed: boolean;
    createdAt: number;
}

type FilterType = 'all' | 'active' | 'completed';

@Component({
    selector: 'app-todo-list',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './todo-list.component.html',
    styleUrl: './todo-list.component.css',
})
export class TodoListComponent {
    // Signal for the list of todos
    todos = signal<Todo[]>([]);

    // Signal for the input text
    newTodoText = signal('');

    // Signal for current filter
    currentFilter = signal<FilterType>('all');

    constructor() {
        // 1. Load from LocalStorage on init
        const saved = localStorage.getItem('angular-todos');
        if (saved) {
            try {
                this.todos.set(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load todos', e);
            }
        }

        // 2. Auto-save whenever todos change using an effect
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
                    createdAt: Date.now(),
                },
                ...todos,
            ]);
            this.newTodoText.set('');
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

    setFilter(filter: FilterType) {
        this.currentFilter.set(filter);
    }

    // Computed signals
    filteredTodos = computed(() => {
        const filter = this.currentFilter();
        const todos = this.todos();

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
    activeCount = computed(() => this.todos().filter((t) => !t.completed).length);
}
