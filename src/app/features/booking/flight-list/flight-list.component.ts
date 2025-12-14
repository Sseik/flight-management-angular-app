import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlightService } from '../../../core/services/flight.service';
import { Flight } from '../../../shared/interfaces/flight.interface';
import { StatusColorDirective } from '../../../shared/directives/status-color.directive';

@Component({
  selector: 'app-flight-list',
  standalone: true,
  imports: [CommonModule, StatusColorDirective],
  templateUrl: './flight-list.component.html',
  styleUrls: ['./flight-list.component.scss'], // Важливо: посилання на стиль
})
export class FlightListComponent implements OnInit {
  flights: Flight[] = [];
  isLoading = true;
  private flightService = inject(FlightService);

  ngOnInit(): void {
    this.flightService.getFlights().subscribe(data => {
      this.flights = data;
      this.isLoading = false;
    });
  }
}