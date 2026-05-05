import { Routes } from '@angular/router';
import { CalendarComponent } from './calendar/calendar';
import { ConstraintsSettingsComponent } from './constraints/constraints-settings/constraints-settings';

export const routes: Routes = [
  {
    path: 'calendar',
    component: CalendarComponent,
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
