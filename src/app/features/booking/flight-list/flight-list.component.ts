import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlightService } from '../../../core/services/flight.service';
import { Flight } from '../../../shared/interfaces/flight.interface';
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
  
  // Виправлено: прибрали ": string", лінтер це сам зрозуміє
  searchTerm = ''; 
  
  private flightService = inject(FlightService);

  ngOnInit(): void {
    this.loadFlights();
    this.loadCities();
  }

  loadFlights() {
    this.flightService.getFlights().subscribe(data => this.flights = data);
  }

  loadCities() {
    this.flightService.getAirports().subscribe(data => this.cities = data);
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
    // Виправлено: типізуємо як Flight, дати залишаємо як Date об'єкти
    const newFlight: Flight = {
      flightId: 0, 
      flightNumber: 'TEST-' + Math.floor(Math.random() * 999),
      origin: 'Kyiv',
      destination: 'London',
      departureTime: new Date(), // <-- Залишаємо Date
      arrivalTime: new Date(new Date().getTime() + 7200000), // <-- Залишаємо Date (+2 години)
      status: 'Scheduled',
      price: 100,
      currency: 'USD'
    };

    this.flightService.createFlight(newFlight).subscribe(() => {
      this.loadFlights();
      alert('Тестовий рейс додано!');
    });
  }

  bookFlight(flightId: number) {
    const passenger = prompt('Введіть ім\'я пасажира:');
    if (passenger) {
      this.flightService.bookTicket({ flightId, passenger }).subscribe(() => {
        alert('Квиток успішно заброньовано!');
      });
    }
  }
}