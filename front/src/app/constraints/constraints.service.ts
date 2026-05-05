import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { Observable, first, mergeMap, of, throwError } from 'rxjs';
import { TravelConstraints, UpdateTravelConstraintsRequest } from './constraints.model';
import { SettingsActions } from './store/settings.actions';
import { selectConstraints } from './store/settings.selectors';

@Injectable({
  providedIn: 'root',
})
export class ConstraintsService {
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);

  readonly constraints = toSignal(this.store.select(selectConstraints), {
    initialValue: null as TravelConstraints | null,
  });

  constructor() {
    this.store.dispatch(SettingsActions.loadSettings());
  }

  update(request: UpdateTravelConstraintsRequest): Observable<TravelConstraints> {
    this.store.dispatch(SettingsActions.updateSettings({ request }));
    return this.actions$.pipe(
      ofType(SettingsActions.updateSettingsSuccess, SettingsActions.updateSettingsFailure),
      first(),
      mergeMap((action) =>
        action.type === SettingsActions.updateSettingsSuccess.type
          ? of(
              (action as ReturnType<typeof SettingsActions.updateSettingsSuccess>).constraints,
            )
          : throwError(() => new Error('Update settings failed')),
      ),
    );
  }
}

