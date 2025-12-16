import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Flight } from '../../shared/interfaces/flight.interface';
import { Booking, SystemStats, User } from '../../shared/interfaces/api.models';
import { Log } from '../decorators/log.decorator';

@Injectable({
  providedIn: 'root'
})
export class FlightService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

  @Log()
  getFlights(): Observable<Flight[]> {
    return this.http.get<Flight[]>(`${this.apiUrl}/flights`);
  }

  @Log()
  searchFlights(term: string): Observable<Flight[]> {
    return this.http.get<Flight[]>(`${this.apiUrl}/search?q=${term}`);
  }

  @Log()
  // Виправлено: замість any повертаємо Observable<Flight> або void
  createFlight(flight: Flight): Observable<Flight> {
    return this.http.post<Flight>(`${this.apiUrl}/flights`, flight);
  }

  @Log()
  // Виправлено: типізували вхідні дані та результат
  bookTicket(bookingData: { flightId: number; userId: number }): Observable<{ success: boolean; ticketId: number }> {
    return this.http.post<{ success: boolean; ticketId: number }>(`${this.apiUrl}/bookings`, bookingData);
  }

  @Log()
  getAirports(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/airports`);
  }

  @Log()
  // Виправлено: замість any
  deleteFlight(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/flights/${id}`);
  }

  // !!! ДОДАНО ВІДСУТНІЙ МЕТОД !!!
  @Log()
  updateFlight(id: number, data: Partial<Flight>): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/flights/${id}`, data);
  }

  @Log()
  getStats(): Observable<SystemStats> {
    return this.http.get<SystemStats>(`${this.apiUrl}/stats`);
  }

  @Log()
  getMyBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiUrl}/bookings`);
  }

  @Log()
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }
}