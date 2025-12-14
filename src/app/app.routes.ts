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
    // Перевірте назву файлу: booking-module.ts чи booking.module.ts?
    // У ваших файлах я бачив 'booking-module.ts', тому залишаю так:
    loadChildren: () => import('./features/booking/booking-module').then(m => m.BookingModule)
  },
  {
    path: 'dashboard',
    // Тут ми видалили файл з дефісом, тому посилаємось на крапку:
    loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)
  }
];