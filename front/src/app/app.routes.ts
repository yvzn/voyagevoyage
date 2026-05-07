import { Routes } from '@angular/router';
import { CalendarComponent } from './calendar/calendar';
import { ConstraintsSettingsComponent } from './constraints/constraints-settings/constraints-settings';
import { TripDetailComponent } from './trip/trip-detail/trip-detail';

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
    path: 'constraints',
    component: ConstraintsSettingsComponent,
  },
  {
    path: '',
    redirectTo: 'calendar',
    pathMatch: 'full',
  },
];
