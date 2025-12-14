import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Flight } from '../../shared/interfaces/flight.interface';
import { SystemStats, BookingRequest, Booking, ApiResponse } from '../../shared/interfaces/api.models';

@Injectable({
  providedIn: 'root'
})
export class FlightService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

  // 1. GET: Отримати всі рейси
  getFlights(): Observable<Flight[]> {
    return this.http.get<Flight[]>(`${this.apiUrl}/flights`);
  }

  // 2. GET: Отримати рейс за ID
  getFlightById(id: number): Observable<Flight> {
    return this.http.get<Flight>(`${this.apiUrl}/flights/${id}`);
  }

  // 3. POST: Створити новий рейс
  createFlight(flight: Flight): Observable<Flight> {
    return this.http.post<Flight>(`${this.apiUrl}/flights`, flight);
  }

  // 4. PUT: Оновити дані рейсу
  updateFlight(id: number, flight: Partial<Flight>): Observable<Flight> {
    return this.http.put<Flight>(`${this.apiUrl}/flights/${id}`, flight);
  }

  // 5. DELETE: Видалити рейс
  deleteFlight(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/flights/${id}`);
  }

  // 6. GET: Пошук рейсів (Search)
  searchFlights(query: string): Observable<Flight[]> {
    return this.http.get<Flight[]>(`${this.apiUrl}/search?q=${query}`);
  }

  // 7. GET: Отримати список аеропортів (Довідник)
  getAirports(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/airports`);
  }

  // 8. POST: Забронювати квиток
  bookTicket(bookingData: BookingRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/bookings`, bookingData);
  }

  // 9. GET: Отримати мої бронювання
  getMyBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiUrl}/bookings`);
  }

  // 10. GET: Отримати статистику (для Дашборду)
  getStats(): Observable<SystemStats> {
    return this.http.get<SystemStats>(`${this.apiUrl}/stats`);
  }
}