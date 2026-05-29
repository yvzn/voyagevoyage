import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { TripActions } from '../../trip/store/trip.actions';
import { SettingsActions } from '../../constraints/store/settings.actions';
import { selectAllTrips, selectTripsLoadStatus } from '../../trip/store/trip.selectors';
import { selectConstraints, selectSettingsLoadStatus } from '../../constraints/store/settings.selectors';
import { LocaleService } from '../../locale.service';
import { Trip } from '../../trip/trip.model';
import { getTripsNeedingTrainBooking } from '../train-booking.utils';

@Component({
  selector: 'app-train-booking-list',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './train-booking-list.html',
})
export class TrainBookingListComponent {
  private readonly store = inject(Store);
  protected readonly localeService = inject(LocaleService);

  constructor() {
    this.store.dispatch(TripActions.loadTrips());
    this.store.dispatch(SettingsActions.loadSettings());
  }

  private readonly trips = this.store.selectSignal(selectAllTrips);
  protected readonly tripsLoadStatus = this.store.selectSignal(selectTripsLoadStatus);
  protected readonly settingsLoadStatus = this.store.selectSignal(selectSettingsLoadStatus);
  private readonly constraints = this.store.selectSignal(selectConstraints);

  protected readonly isLoading = computed(
    () => this.tripsLoadStatus() === 'loading' || this.settingsLoadStatus() === 'loading',
  );
  protected readonly hasError = computed(
    () => this.tripsLoadStatus() === 'failure' || this.settingsLoadStatus() === 'failure',
  );

  protected readonly pendingTrips = computed<Trip[]>(() => {
    const constraints = this.constraints();
    const threshold = constraints?.trainBookingThresholdDays ?? 90;
    return getTripsNeedingTrainBooking(this.trips(), threshold);
  });

  protected readonly thresholdDays = computed<number>(
    () => this.constraints()?.trainBookingThresholdDays ?? 90,
  );

  retryLoad(): void {
    this.store.dispatch(TripActions.loadTrips());
    this.store.dispatch(SettingsActions.loadSettings());
  }

  protected formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Intl.DateTimeFormat(this.localeService.currentLocale(), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, day)));
  }
}
