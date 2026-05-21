import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { PersonalLeave, CreatePersonalLeaveRequest, UpdatePersonalLeaveRequest } from '../personal-leave.model';

export const PersonalLeaveActions = createActionGroup({
  source: 'PersonalLeave',
  events: {
    // Load all
    'Load Personal Leaves': emptyProps(),
    'Load Personal Leaves Success': props<{ leaves: PersonalLeave[] }>(),
    'Load Personal Leaves Failure': props<{ error: string }>(),

    // Create
    'Create Personal Leave': props<{ request: CreatePersonalLeaveRequest }>(),
    'Create Personal Leave Success': props<{ leave: PersonalLeave }>(),
    'Create Personal Leave Failure': props<{ error: string }>(),

    // Update
    'Update Personal Leave': props<{ id: string; request: UpdatePersonalLeaveRequest }>(),
    'Update Personal Leave Success': props<{ leave: PersonalLeave }>(),
    'Update Personal Leave Failure': props<{ error: string }>(),

    // Delete
    'Delete Personal Leave': props<{ id: string }>(),
    'Delete Personal Leave Success': props<{ id: string }>(),
    'Delete Personal Leave Failure': props<{ error: string }>(),

    // ICS import
    'Import Personal Leave Ics': props<{ file: File }>(),
    'Import Personal Leave Ics Success': props<{ leaves: PersonalLeave[] }>(),
    'Import Personal Leave Ics Failure': props<{ error: string }>(),
  },
});
