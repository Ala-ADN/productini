import { Component, computed, effect, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { toSignal } from '@angular/core/rxjs-interop';
import { liveQuery } from 'dexie';
import { Observable } from 'rxjs';
import { db, Priority, Todo } from '../db';

type FilterType = 'all' | 'active' | 'completed';

@Component({
    selector: 'app-todo-list',
    standalone: true,
    imports: [FormsModule, CommonModule, RouterLink, DragDropModule],
    templateUrl: './todo-list.component.html',
    styleUrl: './todo-list.component.css',
})
export class TodoListComponent {
    // Database Live Query -> Signal
    // Sort by 'order' index to maintain user's manual sorting
    todos$ = liveQuery(() => db.todos.orderBy('order').toArray()) as any as Observable<Todo[]>;
    todos = toSignal(this.todos$, { initialValue: [] as Todo[] });

    // Inputs
    newTodoText = signal('');
    newTodoPriority = signal<Priority>('medium');
    newTodoDate = signal('');
    searchQuery = signal('');

    // UI State
    errorMsg = signal('');
    currentFilter = signal<FilterType>('all');
    editingId = signal<number | null>(null);

    constructor() { }

    async drop(event: CdkDragDrop<Todo[]>) {
        // Only allow reordering when showing 'all' and no search query
        if (this.currentFilter() !== 'all' || this.searchQuery()) {
            return;
        }

        const currentTodos = this.todos() || [];
        if (!currentTodos.length) return;

        // 1. Move locally to calculate new order
        const sortedTodos = [...currentTodos]; // Create mutable copy
        moveItemInArray(sortedTodos, event.previousIndex, event.currentIndex);

        // 2. Persist new order to DB
        await db.transaction('rw', db.todos, async () => {
            for (let i = 0; i < sortedTodos.length; i++) {
                const todo = sortedTodos[i];
                if (todo.id && todo.order !== i) {
                    await db.todos.update(todo.id, { order: i });
                }
            }
        });
    }

    async addTodo() {
        const text = this.newTodoText().trim();
        const dateStr = this.newTodoDate();

        this.errorMsg.set('');

        if (!text) {
            this.errorMsg.set('⚠️ Please enter a task name.');
            return;
        }
        if (!dateStr) {
            this.errorMsg.set('⚠️ Please select a due date.');
            return;
        }

        const year = new Date(dateStr).getFullYear();
        if (year > 9999 || dateStr.length > 10) {
            this.errorMsg.set('⚠️ Invalid year. Please use 4 digits (e.g., 2026).');
            return;
        }

        const firstItem = (await db.todos.orderBy('order').first());
        const newOrder = firstItem ? firstItem.order - 1 : 0;

        await db.todos.add({
            text,
            completed: false,
            priority: this.newTodoPriority(),
            createdAt: Date.now(),
            dueDate: dateStr,
            order: newOrder
        });

        this.newTodoText.set('');
        this.newTodoPriority.set('medium');
        this.newTodoDate.set('');
    }

    async toggleTodo(id: number | undefined) {
        if (!id) return;
        const todo = await db.todos.get(id);
        if (todo) {
            await db.todos.update(id, { completed: !todo.completed });
        }
    }

    async deleteTodo(id: number | undefined) {
        if (id) await db.todos.delete(id);
    }

    async clearCompleted() {
        // Use filter instead of where().equals(boolean) to avoid TS IndexableType errors
        const completed = await db.todos.filter(t => t.completed).primaryKeys();
        await db.todos.bulkDelete(completed);
    }

    startEdit(id: number | undefined) {
        if (id) this.editingId.set(id);
    }

    async saveEdit(id: number | undefined, event: Event) {
        if (!id) return;
        const input = event.target as HTMLInputElement;
        const newText = input.value.trim();
        if (newText) {
            await db.todos.update(id, { text: newText });
        }
        this.editingId.set(null);
    }

    cancelEdit() {
        this.editingId.set(null);
    }

    setFilter(filter: FilterType) { this.currentFilter.set(filter); }
    setPriority(priority: Priority) { this.newTodoPriority.set(priority); }

    filteredTodos = computed(() => {
        const filter = this.currentFilter();
        const query = this.searchQuery().toLowerCase();
        let todos = this.todos();

        // Safety check if todos is somehow not array yet (should be covered by initialValue)
        if (!todos) return [];

        if (query) {
            todos = todos.filter((t: Todo) => t.text.toLowerCase().includes(query));
        }

        switch (filter) {
            case 'active':
                return todos.filter((t: Todo) => !t.completed);
            case 'completed':
                return todos.filter((t: Todo) => t.completed);
            default:
                return todos;
        }
    });

    getDueDateLabel(dateStr: string | null): string {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

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

    completedCount = computed(() => (this.todos() || []).filter((t: Todo) => t.completed).length);
    totalCount = computed(() => (this.todos() || []).length);
    hasCompleted = computed(() => (this.todos() || []).some((t: Todo) => t.completed));
}
