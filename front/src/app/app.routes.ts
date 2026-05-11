import { Routes } from '@angular/router';
import { CalendarComponent } from './calendar/calendar';
import { ConstraintsSettingsComponent } from './constraints/constraints-settings/constraints-settings';
import { TripDetailComponent } from './trip/trip-detail/trip-detail';
import { ExpenseDetailComponent } from './expense/expense-detail/expense-detail';

export const routes: Routes = [
  {
    path: 'calendar',
    component: CalendarComponent,
  },
  {
    path: 'trip/:id',
    component: TripDetailComponent,
  },
  {
    path: 'expense/:id',
    component: ExpenseDetailComponent,
  },
  {
    path: 'constraints',
    component: ConstraintsSettingsComponent,
  },
  {
    path: '',
    redirectTo: 'calendar',
    pathMatch: 'full',
  },
];
