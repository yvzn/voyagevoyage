import { Routes } from '@angular/router';
import { CalendarComponent } from './calendar/calendar';

export const routes: Routes = [
  {
    path: 'calendar',
    component: CalendarComponent,
  },
  {
    path: '',
    redirectTo: 'calendar',
    pathMatch: 'full',
  },
];
