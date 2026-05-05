import { Component, computed, effect, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { TripStatus } from '../trip.model';
import { TripActions } from '../store/trip.actions';
import { selectAllTrips, selectTripsDeleteStatus } from '../store/trip.selectors';
import { TripFormComponent } from '../trip-form/trip-form';
import { getTripStatusClass, getTripStatusTranslationKey } from '../trip-status.utils';

@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [NgClass, TranslatePipe, TripFormComponent, RouterLink],
  templateUrl: './trip-detail.html',
})
export class TripDetailComponent {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly routeParamId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('id') ?? ''))
  );
  protected readonly tripId = computed(() => this.routeParamId() ?? '');

  private readonly allTrips = this.store.selectSignal(selectAllTrips);
  protected readonly trip = computed(() =>
    this.allTrips().find((t) => t.id === this.tripId()) ?? null
  );

  /** Whether the edit form modal is open */
  protected readonly isFormOpen = signal(false);

  private readonly deleteStatus = this.store.selectSignal(selectTripsDeleteStatus);
  protected readonly isDeleting = computed(() => this.deleteStatus() === 'loading');
  protected readonly deleteError = computed<string | null>(() =>
    this.deleteStatus() === 'failure' ? 'tripDetail.deleteError' : null
  );

  protected readonly TripStatus = TripStatus;
  protected readonly getTripStatusClass = getTripStatusClass;
  protected readonly getTripStatusTranslationKey = getTripStatusTranslationKey;

  /** True while a delete dispatched by this instance is in flight. */
  private deletePending = false;

  constructor() {
    effect(() => {
      const ds = this.deleteStatus();
      if (this.deletePending) {
        if (ds === 'success') {
          this.deletePending = false;
          this.router.navigate(['/calendar']);
        } else if (ds === 'failure') {
          this.deletePending = false;
        }
      }
    });
  }

  protected openEditForm(): void {
    this.isFormOpen.set(true);
  }

  protected closeForm(): void {
    this.isFormOpen.set(false);
  }

  protected onDelete(): void {
    const trip = this.trip();
    if (!trip || this.isDeleting()) return;

    this.deletePending = true;
    this.store.dispatch(TripActions.deleteTrip({ id: trip.id }));
  }
}
