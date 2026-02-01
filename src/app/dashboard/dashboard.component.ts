import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HabitCounter } from '../components/habit-counter/habit-counter';
import { TodoListComponent } from '../todo-list/todo-list.component';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, HabitCounter, TodoListComponent],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
    // Mock data for the dashboard
    greeting = 'Good ' + this.getTimeOfDay();

    quote = {
        text: "The key is not to prioritize what's on your schedule, but to schedule your priorities.",
        author: "Stephen Covey"
    };



    getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Morning';
        if (hour < 18) return 'Afternoon';
        return 'Evening';
    }

    getTodayDate() {
        return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }
}
