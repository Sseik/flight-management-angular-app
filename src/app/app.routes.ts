import { Routes } from '@angular/router';
// import { authGuard } from './core/guards/auth-guard'; // Якщо використовуєте guard

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'booking',
    pathMatch: 'full'
  },
  {
    path: 'booking',
    loadChildren: () => import('./features/booking/booking-module').then(m => m.BookingModule)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)
  }
];