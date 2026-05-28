import { createSelector } from '@ngrx/store';
import { selectPublicHolidays, selectSchoolHolidays } from '../constraints/store/settings.selectors';
import { selectAllPersonalLeaves } from '../personal-leave/store/personal-leave.selectors';
import { buildConstraintsPerDay } from './calendar-constraints.utils';

/** Pre-built map from ISO date string to the constraints applying on that day. */
export const selectConstraintsPerDay = createSelector(
  selectPublicHolidays,
  selectSchoolHolidays,
  selectAllPersonalLeaves,
  (publicHolidays, schoolHolidays, personalLeaves) =>
    buildConstraintsPerDay(publicHolidays, schoolHolidays, personalLeaves),
);
