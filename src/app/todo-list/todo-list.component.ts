import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Todo {
    id: number;
    text: string;
    completed: boolean;
}

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

    // Counter for unique IDs
    private nextId = 1;

    addTodo() {
        const text = this.newTodoText().trim();
        if (text) {
            this.todos.update((todos) => [
                ...todos,
                {
                    id: this.nextId++,
                    text,
                    completed: false,
                },
            ]);
            this.newTodoText.set('');
        }
    }

    toggleTodo(id: number) {
        this.todos.update((todos) =>
            todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo))
        );
    }

    // Computed signal for statistics (optional enhancement)
    get completedCount() {
        return this.todos().filter((t) => t.completed).length;
    }

    get totalCount() {
        return this.todos().length;
    }
}
