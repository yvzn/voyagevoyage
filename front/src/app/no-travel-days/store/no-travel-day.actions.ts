import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { NoTravelDay, NoTravelDayRequest } from '../no-travel-day.model';

export const NoTravelDayActions = createActionGroup({
  source: 'NoTravelDay',
  events: {
    'Load No Travel Days': emptyProps(),
    'Load No Travel Days Success': props<{ days: NoTravelDay[] }>(),
    'Load No Travel Days Failure': props<{ error: string }>(),
    'Create No Travel Day': props<{ request: NoTravelDayRequest }>(),
    'Create No Travel Day Success': props<{ day: NoTravelDay }>(),
    'Create No Travel Day Failure': props<{ error: string }>(),
    'Update No Travel Day': props<{ id: string; request: NoTravelDayRequest }>(),
    'Update No Travel Day Success': props<{ day: NoTravelDay }>(),
    'Update No Travel Day Failure': props<{ error: string }>(),
    'Delete No Travel Day': props<{ id: string }>(),
    'Delete No Travel Day Success': props<{ id: string }>(),
    'Delete No Travel Day Failure': props<{ error: string }>(),
  },
});
