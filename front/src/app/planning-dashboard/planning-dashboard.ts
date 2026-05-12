import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { TripActions } from '../trip/store/trip.actions';
import { SettingsActions } from '../constraints/store/settings.actions';
import { selectAllTrips, selectTripsLoadStatus } from '../trip/store/trip.selectors';
import { selectConstraints, selectSettingsLoadStatus } from '../constraints/store/settings.selectors';
import { getTripStatusClass, getTripStatusTranslationKey } from '../trip/trip-status.utils';
import { LocaleService } from '../locale.service';
import { getPlanningItems, PlanningItem, PlannedTripItem, AvailableMonthItem } from './planning-dashboard.utils';

@Component({
  selector: 'app-planning-dashboard',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './planning-dashboard.html',
})
export class PlanningDashboardComponent {
  private readonly store = inject(Store);
  protected readonly localeService = inject(LocaleService);

  /** When set, limits the number of items displayed (used in preview mode). */
  readonly maxItems = input<number | null>(null);

  /** Whether to display the section heading (default: true). Set to false when embedded in a parent section. */
  readonly showHeading = input<boolean>(true);

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

  protected readonly allItems = computed<PlanningItem[]>(() =>
    getPlanningItems(this.trips(), this.constraints()),
  );

  protected readonly items = computed<PlanningItem[]>(() => {
    const max = this.maxItems();
    const all = this.allItems();
    return max !== null ? all.slice(0, max) : all;
  });

  protected readonly getTripStatusClass = getTripStatusClass;
  protected readonly getTripStatusTranslationKey = getTripStatusTranslationKey;

  retryLoad(): void {
    this.store.dispatch(TripActions.loadTrips());
    this.store.dispatch(SettingsActions.loadSettings());
  }

  isPlannedTripItem(item: PlanningItem): item is PlannedTripItem {
    return item.type === 'planned-trip';
  }

  isAvailableMonthItem(item: PlanningItem): item is AvailableMonthItem {
    return item.type === 'available-month';
  }

  protected formatMonth(year: number, month: number): string {
    return new Intl.DateTimeFormat(this.localeService.currentLocale(), {
      month: 'long',
      year: 'numeric',
    }).format(new Date(year, month, 1));
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
