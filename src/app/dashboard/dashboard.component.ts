import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FloatingTimerComponent } from '../floating-timer/floating-timer.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule, FloatingTimerComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  // Mock data for the dashboard
  greeting = 'Good ' + this.getTimeOfDay();

  quote = {
    text: "The key is not to prioritize what's on your schedule, but to schedule your priorities.",
    author: 'Stephen Covey',
  };

  apps = [
    {
      id: 'todo',
      name: 'Task Planner',
      icon: '📝',
      desc: 'Manage milestones, tasks & deadlines',
      link: '/todo',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      id: 'notes',
      name: 'Quick Notes',
      icon: '📒',
      desc: 'Capture ideas instantly (Coming Soon)',
      link: null,
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      id: 'focus',
      name: 'Focus Timer',
      icon: '⏱️',
      desc: 'Pomodoro technique for deep work',
      link: '/pomodoro',
      color: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
    },
  ];

  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  }

  getTodayDate() {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }
}
