import { createSelector } from '@ngrx/store';
import { selectPublicHolidays, selectSchoolHolidays } from '../constraints/store/settings.selectors';
import { selectAllPersonalLeaves } from '../personal-leave/store/personal-leave.selectors';
import { buildConstraintsPerDay } from './calendar-constraints.utils';
import { selectAllNoTravelDays } from '../no-travel-days/store/no-travel-day.reducer';
import { selectCalendarYear } from '../trip/store/trip.selectors';

/** Pre-built map from ISO date string to the constraints applying on that day. */
export const selectConstraintsPerDay = createSelector(
  selectPublicHolidays,
  selectSchoolHolidays,
  selectAllPersonalLeaves,
  selectAllNoTravelDays,
  selectCalendarYear,
  (publicHolidays, schoolHolidays, personalLeaves, noTravelDays, calendarYear) =>
    buildConstraintsPerDay(publicHolidays, schoolHolidays, personalLeaves, noTravelDays, calendarYear),
);
