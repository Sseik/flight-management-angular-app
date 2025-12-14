import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Flight } from '../../shared/interfaces/flight.interface';

@Injectable({
  providedIn: 'root'
})
export class FlightService {
  // Імітація бази даних
  private mockFlights: Flight[] = [
    {
      flightId: 1, flightNumber: 'PS-101', origin: 'Kyiv (KBP)', destination: 'London (LHR)',
      departureTime: new Date('2025-12-15T10:00:00'), arrivalTime: new Date('2025-12-15T13:30:00'),
      status: 'On Time', price: 150, currency: 'USD'
    },
    {
      flightId: 2, flightNumber: 'FR-304', origin: 'Lviv (LWO)', destination: 'Warsaw (WAW)',
      departureTime: new Date('2025-12-15T14:00:00'), arrivalTime: new Date('2025-12-15T15:00:00'),
      status: 'Delayed', price: 50, currency: 'EUR'
    }
  ];

  getFlights(): Observable<Flight[]> {
    return of(this.mockFlights).pipe(delay(800)); // Затримка 0.8 сек
  }
}