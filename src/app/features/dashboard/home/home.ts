import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.html']
})
export class HomeComponent {
  stats = [
    { title: 'Активні рейси', value: '24', icon: '✈️', color: '#4CAF50' },
    { title: 'Бронювання сьогодні', value: '156', icon: '🎫', color: '#2196F3' },
    { title: 'Пасажирів онлайн', value: '3,245', icon: '👥', color: '#FF9800' },
    { title: 'Затримання', value: '2', icon: '⚠️', color: '#F44336' }
  ];
}
