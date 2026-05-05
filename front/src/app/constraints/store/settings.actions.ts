import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { TravelConstraints, UpdateTravelConstraintsRequest } from '../constraints.model';

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
  },
});
