import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlightService } from '../../../core/services/flight.service';
import { Observable } from 'rxjs'; // <--- Імпорт
import { Flight } from '../../../shared/interfaces/flight.interface';
import { StatusColorDirective } from '../../../shared/directives/status-color.directive';
import { DurationPipe } from '../../../shared/pipes/duration.pipe';

@Component({
  selector: 'app-flight-list',
  standalone: true,
  imports: [CommonModule, StatusColorDirective, DurationPipe],
  templateUrl: './flight-list.component.html',
  styleUrls: ['./flight-list.component.scss'],
})
export class FlightListComponent {
  private flightService = inject(FlightService);
  
  flights$: Observable<Flight[]> = this.flightService.getFlights(); 
}