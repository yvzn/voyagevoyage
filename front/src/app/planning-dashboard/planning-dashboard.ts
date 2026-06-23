import { Component, ElementRef, computed, inject, input, signal, viewChild, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { TripActions } from '../trip/store/trip.actions';
import { SettingsActions } from '../constraints/store/settings.actions';
import { PersonalLeaveActions } from '../personal-leave/store/personal-leave.actions';
import { selectAllTrips, selectTripsLoadStatus } from '../trip/store/trip.selectors';
import { selectConstraints, selectPublicHolidays, selectSettingsLoadStatus } from '../constraints/store/settings.selectors';
import { selectAllPersonalLeaves } from '../personal-leave/store/personal-leave.selectors';
import { getTripStatusClass, getTripStatusTranslationKey } from '../trip/trip-status.utils';
import { LocaleService } from '../locale.service';
import { TripFormComponent } from '../trip/trip-form/trip-form';
import {
  getPlanningItems,
  suggestTripSlots,
  PlanningItem,
  PlannedTripItem,
  AvailableMonthItem,
  TripSlotSuggestion,
} from './planning-dashboard.utils';

@Component({
  selector: 'app-planning-dashboard',
  standalone: true,
  imports: [RouterLink, TranslatePipe, TripFormComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
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
    this.store.dispatch(SettingsActions.loadPublicHolidays());
    this.store.dispatch(PersonalLeaveActions.loadPersonalLeaves());
  }

  private readonly trips = this.store.selectSignal(selectAllTrips);
  protected readonly tripsLoadStatus = this.store.selectSignal(selectTripsLoadStatus);
  protected readonly settingsLoadStatus = this.store.selectSignal(selectSettingsLoadStatus);
  private readonly constraints = this.store.selectSignal(selectConstraints);
  private readonly publicHolidays = this.store.selectSignal(selectPublicHolidays);
  private readonly personalLeaves = this.store.selectSignal(selectAllPersonalLeaves);

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

  private readonly suggestionsDialogEl = viewChild.required<ElementRef<HTMLDialogElement>>('suggestionsDialogEl');

  /** The available-month item currently selected for slot suggestions. */
  protected readonly selectedMonth = signal<AvailableMonthItem | null>(null);

  /** Slot suggestions computed for the currently selected month. */
  protected readonly suggestions = computed<TripSlotSuggestion[]>(() => {
    const month = this.selectedMonth();
    const constraints = this.constraints();
    if (!month || !constraints) return [];
    const remainingDays = month.maxDaysPerMonth - month.tripDaysUsed;
    return suggestTripSlots(
      month.year,
      month.month,
      remainingDays,
      constraints,
      this.publicHolidays(),
      this.personalLeaves(),
    );
  });

  /** Whether the trip-creation form is open. */
  protected readonly isFormOpen = signal(false);
  /** Start date to pre-fill in the form when accepting a suggestion. */
  protected readonly formDefaultDate = signal<string | null>(null);
  /** End date to pre-fill in the form when accepting a suggestion. */
  protected readonly formDefaultEndDate = signal<string | null>(null);

  retryLoad(): void {
    this.store.dispatch(TripActions.loadTrips());
    this.store.dispatch(SettingsActions.loadSettings());
  }

  /** Opens the suggestions modal for the given available month. */
  selectMonth(item: AvailableMonthItem): void {
    this.selectedMonth.set(item);
    this.suggestionsDialogEl().nativeElement.showModal();
  }

  /** Closes the suggestions modal without taking any action. */
  dismissSuggestions(): void {
    this.selectedMonth.set(null);
    const dialog = this.suggestionsDialogEl().nativeElement;
    if (dialog.open) dialog.close();
  }

  protected onSuggestionsDialogCancel(event: Event): void {
    event.preventDefault();
    this.dismissSuggestions();
  }

  protected onSuggestionsBackdropClick(event: MouseEvent): void {
    if (event.target === this.suggestionsDialogEl().nativeElement) {
      this.dismissSuggestions();
    }
  }

  /** Pre-fills the trip form with the accepted suggestion dates and opens it. */
  acceptSuggestion(suggestion: TripSlotSuggestion): void {
    this.formDefaultDate.set(suggestion.startDate);
    this.formDefaultEndDate.set(suggestion.endDate);
    const dialog = this.suggestionsDialogEl().nativeElement;
    if (dialog.open) dialog.close();
    this.selectedMonth.set(null);
    this.isFormOpen.set(true);
  }

  /** Closes the trip form. */
  closeForm(): void {
    this.isFormOpen.set(false);
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
