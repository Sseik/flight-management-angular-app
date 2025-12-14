import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrls: ['./home.scss'], 
})
export class HomeComponent {
  stats = [
    { title: 'Всього рейсів', value: '1,240', icon: '🛫', color: '#0d6efd' },
    { title: 'Пасажирів', value: '84,392', icon: '👥', color: '#198754' },
    { title: 'Затримок', value: '23', icon: '⚠️', color: '#dc3545' },
    { title: 'Прибуток', value: '$4.2M', icon: '💰', color: '#ffc107' }
  ];
}