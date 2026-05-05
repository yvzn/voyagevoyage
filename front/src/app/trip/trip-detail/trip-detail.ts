import { Component, computed, effect, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { Trip, TripStatus } from '../trip.model';
import { TripActions } from '../store/trip.actions';
import { selectTripById, selectTripsDeleteStatus } from '../store/trip.selectors';
import { TripFormComponent } from '../trip-form/trip-form';
import { LocaleService } from '../../locale.service';

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
  protected readonly localeService = inject(LocaleService);

  protected readonly tripId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly trip = this.store.selectSignal(selectTripById(this.tripId));

  /** Whether the edit form modal is open */
  protected readonly isFormOpen = signal(false);

  private readonly deleteStatus = this.store.selectSignal(selectTripsDeleteStatus);
  protected readonly isDeleting = computed(() => this.deleteStatus() === 'loading');
  protected readonly deleteError = computed<string | null>(() =>
    this.deleteStatus() === 'failure' ? 'tripDetail.deleteError' : null
  );

  protected readonly TripStatus = TripStatus;

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

  protected getTripStatusClass(status: TripStatus): string {
    switch (status) {
      case TripStatus.Planned:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case TripStatus.Confirmed:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case TripStatus.Cancelled:
        return 'bg-gray-100 text-gray-500 line-through dark:bg-gray-700 dark:text-gray-400';
    }
  }

  protected getTripStatusTranslationKey(status: TripStatus): string {
    switch (status) {
      case TripStatus.Planned:
        return 'tripStatus.planned';
      case TripStatus.Confirmed:
        return 'tripStatus.confirmed';
      case TripStatus.Cancelled:
        return 'tripStatus.cancelled';
    }
  }
}
