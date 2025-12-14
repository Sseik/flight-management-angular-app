import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlightService } from '../../../core/services/flight.service';
import { Flight } from '../../../shared/interfaces/flight.interface';
import { StatusColorDirective } from '../../../shared/directives/status-color.directive';
import { DurationPipe } from '../../../shared/pipes/duration.pipe'; // <--- Імпорт

@Component({
  selector: 'app-flight-list',
  standalone: true,
  imports: [
    CommonModule, 
    StatusColorDirective,
    DurationPipe 
  ],
  templateUrl: './flight-list.component.html',
  styleUrls: ['./flight-list.component.scss'],
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