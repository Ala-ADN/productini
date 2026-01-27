import Dexie, { Table } from 'dexie';

export type Priority = 'high' | 'medium' | 'low';

export interface Todo {
    id?: number;
    text: string;
    completed: boolean;
    priority: Priority;
    createdAt: number;
    dueDate: string;
    order: number; // Added order field
}

export class AppDB extends Dexie {
    todos!: Table<Todo, number>;

    constructor() {
        super('ProdHubDB');

        // Version 2: Added 'order' index
        this.version(2).stores({
            todos: '++id, completed, priority, dueDate, order'
        }).upgrade(tx => {
            // Migration: Give existing items a default order
            // We can just use their ID as order initially
            return tx.table('todos').toCollection().modify(todo => {
                todo.order = todo.id; // Fallback
            });
        });

        // Keep version 1 for reference (Dexie requires history)
        this.version(1).stores({
            todos: '++id, completed, priority, dueDate'
        });
    }
}

export const db = new AppDB();
