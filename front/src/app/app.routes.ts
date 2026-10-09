import { Routes } from '@angular/router';
import { CalendarComponent } from './calendar/calendar';
import { ExpenseDetailComponent } from './expense/expense-detail/expense-detail';
import { PlanningDashboardComponent } from './planning-dashboard/planning-dashboard';
import { DashboardComponent } from './dashboard/dashboard';
import { PersonalLeavePageComponent } from './personal-leave/personal-leave-page/personal-leave-page';
import { PersonalLeaveDetailComponent } from './personal-leave/personal-leave-detail/personal-leave-detail';
import { NoTravelDaysPageComponent } from './no-travel-days/no-travel-days-page';
import { TrainBookingListComponent } from './train-booking/train-booking-list/train-booking-list';
import { HotelBookingListComponent } from './hotel-booking/hotel-booking-list/hotel-booking-list';
import { FrequentExpenseSettingsComponent } from './frequent-expense/frequent-expense-settings/frequent-expense-settings';
import { FiscalRuleSettingsComponent } from './fiscal-rule/fiscal-rule-settings/fiscal-rule-settings';
import { AnnualExpenseSummaryComponent } from './annual-expense-summary/annual-expense-summary';
import { VoucherListComponent } from './voucher/voucher-list/voucher-list';

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
    path: 'train-bookings',
    component: TrainBookingListComponent,
  },
  {
    path: 'hotel-bookings',
    component: HotelBookingListComponent,
  },
  {
    path: 'vouchers',
    component: VoucherListComponent,
  },
  {
    path: 'trip/:id',
    loadComponent: () =>
      import('./trip/trip-detail/trip-detail').then((m) => m.TripDetailComponent),
  },
  {
    path: 'expense/:id',
    component: ExpenseDetailComponent,
  },
  {
    path: 'constraints',
    loadComponent: () =>
      import('./constraints/constraints-settings/constraints-settings').then(
        (m) => m.ConstraintsSettingsComponent,
      ),
  },
  {
    path: 'frequent-expenses',
    component: FrequentExpenseSettingsComponent,
  },
  {
    path: 'expense-summary',
    loadComponent: () =>
      import('./monthly-expense-summary/monthly-expense-summary').then(
        (m) => m.MonthlyExpenseSummaryComponent,
      ),
  },
  {
    path: 'annual-expense-summary',
    component: AnnualExpenseSummaryComponent,
  },
  {
    path: 'fiscal-rules',
    component: FiscalRuleSettingsComponent,
  },
  {
    path: 'personal-leaves',
    component: PersonalLeavePageComponent,
  },
  {
    path: 'personal-leaves/:id',
    component: PersonalLeaveDetailComponent,
  },
  {
    path: 'no-travel-days',
    component: NoTravelDaysPageComponent,
  },
];
