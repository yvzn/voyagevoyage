import { Routes } from '@angular/router';
import { CalendarComponent } from './calendar/calendar';
import { ConstraintsSettingsComponent } from './constraints/constraints-settings/constraints-settings';
import { TripDetailComponent } from './trip/trip-detail/trip-detail';
import { ExpenseDetailComponent } from './expense/expense-detail/expense-detail';
import { PlanningDashboardComponent } from './planning-dashboard/planning-dashboard';
import { DashboardComponent } from './dashboard/dashboard';

export const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    pathMatch: 'full',
  },
  {
    path: 'calendar',
    component: CalendarComponent,
  },
  {
    path: 'planning-dashboard',
    component: PlanningDashboardComponent,
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
];
