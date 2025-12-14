import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FlightService } from '../../../core/services/flight.service';
// 1. Імпортуємо інтерфейс Booking
import { SystemStats, Booking } from '../../../shared/interfaces/api.models';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
})
export class HomeComponent implements OnInit {
  stats: { title: string; value: string | number; icon: string; color: string }[] = [];
  
  // 2. Використовуємо суворий тип замість any
  recentActivities: Booking[] = []; 
  isLoading = true;
  
  private flightService = inject(FlightService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;

    this.flightService.getStats().subscribe({
      next: (data: SystemStats) => {
        this.stats = [
          { title: 'Всього рейсів', value: data.totalFlights, icon: '🛫', color: '#0d6efd' },
          { title: 'Бронювань', value: data.totalBookings, icon: '🎫', color: '#198754' },
          { title: 'Затримок', value: data.delayed, icon: '⚠️', color: '#dc3545' },
          { 
             title: 'Відсоток затримок', 
             value: data.totalFlights > 0 ? ((data.delayed / data.totalFlights) * 100).toFixed(1) + '%' : '0%', 
             icon: '📊', 
             color: '#6610f2' 
          }
        ];
        this.updateView();
      },
      error: () => this.updateView()
    });

    // 3. Тут TypeScript тепер знає, що data - це Booking[]
    this.flightService.getMyBookings().subscribe({
      next: (data: Booking[]) => {
        // Беремо перші 5 елементів (вони вже найновіші завдяки серверному сортуванню)
        this.recentActivities = data.slice(0, 5);
        this.updateView();
      },
      error: () => this.updateView()
    });
  }

  private updateView() {
    this.isLoading = false;
    this.cdr.detectChanges();
  }
}