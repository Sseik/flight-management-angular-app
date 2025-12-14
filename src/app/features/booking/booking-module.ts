import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FlightListComponent } from './flight-list/flight-list.component';

const routes: Routes = [
  { path: '', component: FlightListComponent }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FlightListComponent 
  ]
})
export class BookingModule { }