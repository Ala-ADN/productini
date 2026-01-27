import Dexie, { Table } from 'dexie';

export type Priority = 'high' | 'medium' | 'low';

export interface Todo {
    id?: number;
    text: string;
    completed: boolean;
    priority: Priority;
    createdAt: number;
    dueDate: string;
    order: number;
}

export interface HabitHistory {
    date: string; // ISO date string (YYYY-MM-DD)
    completions: number;
    goalMet: boolean;
}

export interface HabitRecord {
    id?: number;
    name: string;
    icon: string;
    color: string;
    dailyGoal: number;
    completionsToday: number;
    streak: number;
    bestStreak: number;
    totalCompletions: number;
    createdAt: number; // timestamp
    lastCompletedAt: number | null; // timestamp
    history: HabitHistory[];
    order: number;
}

export interface HabitMetadata {
    id: string; // 'habit_metadata' - singleton record
    lastResetDate: string; // ISO date string (YYYY-MM-DD)
}

export interface Quote {
    id?: number;
    text: string;
    author: string;
    category: string;
    createdAt: number;
    isFavorite: boolean;
}
export interface User {
    id?: number;
    email: string;
    username: string;
    passwordHash: string; // In production, hash passwords!
    createdAt: number;
    lastLoginAt: number | null;
}

export interface Session {
    id: string; // 'current_session' - singleton
    userId: number;
    email: string;
    username: string;
    loginAt: number;
}

export class AppDB extends Dexie {
    todos!: Table<Todo, number>;
    habits!: Table<HabitRecord, number>;
    habitMetadata!: Table<HabitMetadata, string>;
    quotes!: Table<Quote, number>;
    users!: Table<User, number>;
    session!: Table<Session, string>;

    constructor() {
        super('ProdHubDB');

        // Version 4: Added quotes table
        // Version 4: Added users and session tables for authentication
        this.version(4).stores({
            todos: '++id, completed, priority, dueDate, order',
            habits: '++id, name, createdAt, order',
            habitMetadata: 'id',
            quotes: '++id, category, isFavorite, createdAt',
            users: '++id, email, username',
            session: 'id'
        });

        // Version 3: Added habits and habitMetadata tables
        this.version(3).stores({
            todos: '++id, completed, priority, dueDate, order',
            habits: '++id, name, createdAt, order',
            habitMetadata: 'id'
        });

        // Version 2: Added 'order' index to todos
        this.version(2).stores({
            todos: '++id, completed, priority, dueDate, order'
        }).upgrade(tx => {
            return tx.table('todos').toCollection().modify(todo => {
                todo.order = todo.id;
            });
        });

        // Version 1 for reference
        this.version(1).stores({
            todos: '++id, completed, priority, dueDate'
        });
    }
}

export const db = new AppDB();
