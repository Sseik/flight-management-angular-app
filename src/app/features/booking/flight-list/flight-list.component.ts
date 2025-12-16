import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http'; // <--- Важливо для типів помилок
import { FlightService } from '../../../core/services/flight.service';
import { Flight } from '../../../shared/interfaces/flight.interface';
import { User } from '../../../shared/interfaces/api.models'; // <--- Важливо для User
import { StatusColorDirective } from '../../../shared/directives/status-color.directive';
import { DurationPipe } from '../../../shared/pipes/duration.pipe';

@Component({
  selector: 'app-flight-list',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusColorDirective, DurationPipe],
  templateUrl: './flight-list.component.html',
  styleUrls: ['./flight-list.component.scss'],
})
export class FlightListComponent implements OnInit {
  flights: Flight[] = [];
  cities: string[] = [];
  users: User[] = []; // Список користувачів

  searchTerm = '';
  selectedCity = ''; // <--- ВИПРАВЛЕННЯ 1: Додали змінну, якої не вистачало
  selectedUserId: number | null = null; // ID обраного юзера
  
  private flightService = inject(FlightService);

  ngOnInit(): void {
    this.loadFlights();
    this.loadCities();
    this.loadUsers();
  }

  loadFlights() {
    this.flightService.getFlights().subscribe(data => this.flights = data);
  }

  loadCities() {
    this.flightService.getAirports().subscribe(data => this.cities = data);
  }

  loadUsers() {
    this.flightService.getUsers().subscribe(data => {
      this.users = data;
      if (this.users.length > 0) {
        this.selectedUserId = this.users[0].user_id;
      }
    });
  }

  // <--- ВИПРАВЛЕННЯ 2: Додали метод фільтрації, якого не вистачало
  filterByCity() {
    if (this.selectedCity) {
      this.flightService.searchFlights(this.selectedCity).subscribe(data => {
        this.flights = data;
      });
    } else {
      this.loadFlights();
    }
  }

  search() {
    if (!this.searchTerm.trim()) {
      this.loadFlights();
      return;
    }
    this.flightService.searchFlights(this.searchTerm).subscribe(data => {
      this.flights = data;
    });
  }

  deleteFlight(id: number) {
    if(confirm('Видалити цей рейс?')) {
      this.flightService.deleteFlight(id).subscribe(() => {
        this.loadFlights();
        alert('Рейс видалено!');
      });
    }
  }

  createTestFlight() {
    const newFlight: Flight = {
      flightId: 0, 
      flightNumber: 'TEST-' + Math.floor(Math.random() * 999),
      origin: 'Kyiv',
      destination: 'London',
      departureTime: new Date(),
      arrivalTime: new Date(new Date().getTime() + 7200000),
      status: 'Scheduled',
      price: 100,
      currency: 'USD'
    };

    this.flightService.createFlight(newFlight).subscribe(() => {
      this.loadFlights();
      alert('Тестовий рейс додано!');
    });
  }

  delayFlight(id: number) {
    this.flightService.updateFlight(id, { status: 'Delayed' }).subscribe({
      next: () => {
        this.loadFlights(); 
        alert('Статус рейсу змінено на "Delayed"');
      },
      error: (err: HttpErrorResponse) => { 
        console.error(err);
        const msg = err.error?.error || err.message || 'Невідома помилка';
        alert('Помилка оновлення: ' + msg);
      }
    });
  }

  bookFlight(flightId: number) {
    if (!this.selectedUserId) {
      alert('Будь ласка, виберіть користувача зі списку зверху!');
      return;
    }

    const currentUser = this.users.find(u => u.user_id == this.selectedUserId);

    if(confirm(`Забронювати квиток для користувача ${currentUser?.username}?`)) {
      this.flightService.bookTicket({ 
        flightId, 
        userId: this.selectedUserId 
      }).subscribe({
        next: () => alert('Квиток успішно заброньовано!'),
        error: (err: HttpErrorResponse) => {
           const msg = err.error?.error || err.message || 'Невідома помилка';
           alert('Помилка: ' + msg);
        }
      });
    }
  }
}