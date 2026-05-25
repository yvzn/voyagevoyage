import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { TravelConstraints, UpdateTravelConstraintsRequest, PublicHoliday } from '../constraints.model';

export const SettingsActions = createActionGroup({
  source: 'Settings',
  events: {
    // Load
    'Load Settings': emptyProps(),
    'Load Settings Success': props<{ constraints: TravelConstraints }>(),
    'Load Settings Empty': emptyProps(),
    'Load Settings Failure': props<{ error: string }>(),

    // Update
    'Update Settings': props<{ request: UpdateTravelConstraintsRequest }>(),
    'Update Settings Success': props<{ constraints: TravelConstraints }>(),
    'Update Settings Failure': props<{ error: string }>(),

    // Public holiday list load
    'Load Public Holidays': emptyProps(),
    'Load Public Holidays Success': props<{ holidays: PublicHoliday[] }>(),
    'Load Public Holidays Failure': props<{ error: string }>(),

    // Public holiday ICS import
    'Import Ics': props<{ file: File }>(),
    'Import Ics Success': emptyProps(),
    'Import Ics Failure': props<{ error: string }>(),

    // School holiday ICS import
    'Import School Ics': props<{ file: File }>(),
    'Import School Ics Success': emptyProps(),
    'Import School Ics Failure': props<{ error: string }>(),
  },
});
