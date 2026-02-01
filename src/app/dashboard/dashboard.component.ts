import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
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
    protected readonly authService = inject(AuthService);
    
    // Mock data for the dashboard
    greeting = 'Good ' + this.getTimeOfDay();

    quote = {
        text: "The key is not to prioritize what's on your schedule, but to schedule your priorities.",
        author: "Stephen Covey"
    };

   

    async logout() {
        await this.authService.logout();
    }

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
