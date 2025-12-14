import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router'; // <--- 1. Додайте імпорти тут

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet, 
    RouterLink,       
    RouterLinkActive  
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('flight-management-angular-app');
}