import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FlightListComponent } from './flight-list/flight-list.component';
import { StatusColorDirective } from '../../shared/directives/status-color.directive';
import { DurationPipe } from '../../shared/pipes/duration.pipe';

const routes: Routes = [
  { path: '', component: FlightListComponent }
];

@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FlightListComponent,
    DurationPipe,
    StatusColorDirective
  ]
})
export class BookingModule { }