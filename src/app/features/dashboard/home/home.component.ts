import { Component } from '@angular/core';

interface Stat {
  title: string;
  value: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.html'
})
export class Home {
  stats: Stat[] = [
    { title: 'Рейси сьогодні', value: '128', icon: '✈️', color: '#4caf50' },
    { title: 'Бронювання', value: '56', icon: '🎫', color: '#2196f3' },
    { title: 'Затримки', value: '3', icon: '⚠️', color: '#ff9800' }
  ];

  trackByTitle(index: number, item: Stat) {
    return item.title;
  }
}