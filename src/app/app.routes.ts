import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'booking',
    pathMatch: 'full'
  },
  {
    path: 'booking',
    // Використовуємо booking.module.ts (без дефіса)
    loadChildren: () => import('./features/booking/booking-module').then(m => m.BookingModule)
  },
  {
    path: 'dashboard',
    // Використовуємо dashboard.module.ts (без дефіса)
    loadChildren: () => import('./features/dashboard/dashboard-module').then(m => m.DashboardModule)
  }
];