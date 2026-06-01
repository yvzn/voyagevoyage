import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { TripActions } from '../../trip/store/trip.actions';
import { SettingsActions } from '../../constraints/store/settings.actions';
import { selectAllTrips, selectTripsLoadStatus } from '../../trip/store/trip.selectors';
import { selectConstraints, selectSettingsLoadStatus } from '../../constraints/store/settings.selectors';
import { getTripStatusClass } from '../../trip/trip-status.utils';
import { LocaleService } from '../../locale.service';
import { Trip } from '../../trip/trip.model';
import { getTripsNeedingHotelBooking } from '../hotel-booking.utils';

export { getTripsNeedingHotelBooking } from '../hotel-booking.utils';

@Component({
  selector: 'app-hotel-booking-dashboard',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './hotel-booking-dashboard.html',
})
export class HotelBookingDashboardComponent {
  private readonly store = inject(Store);
  protected readonly localeService = inject(LocaleService);

  /** When set, limits the number of items displayed (used in preview mode). */
  readonly maxItems = input<number | null>(null);

  /** Whether to display the section heading (default: true). Set to false when embedded in a parent section. */
  readonly showHeading = input<boolean>(true);

  /** Whether to show the description paragraph with the threshold days count (for full-page list view). */
  readonly showDescription = input<boolean>(false);

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

  protected readonly thresholdDays = computed<number>(
    () => this.constraints()?.planningHorizonDays ?? 90,
  );

  protected readonly allPendingTrips = computed<Trip[]>(() => {
    return getTripsNeedingHotelBooking(this.trips(), this.thresholdDays());
  });

  protected readonly pendingTrips = computed<Trip[]>(() => {
    const max = this.maxItems();
    const all = this.allPendingTrips();
    return max !== null ? all.slice(0, max) : all;
  });

  /** Show "view all" link only when displaying a limited subset (dashboard card mode). */
  protected readonly showViewAllLink = computed(() => this.maxItems() !== null);

  protected readonly getTripStatusClass = getTripStatusClass;

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
