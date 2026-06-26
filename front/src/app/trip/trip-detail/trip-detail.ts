import { Component, computed, effect, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { NgClass, DecimalPipe } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { TripStatus } from '../trip.model';
import { TripActions } from '../store/trip.actions';
import { selectAllTrips, selectTripsDeleteStatus, selectTripsUpdateStatus } from '../store/trip.selectors';
import { TripFormComponent } from '../trip-form/trip-form';
import { getTripStatusClass, getTripStatusTranslationKey } from '../trip-status.utils';
import { LocaleService } from '../../locale.service';
import { ExpenseFormComponent } from '../../expense/expense-form/expense-form';
import { BookingConfirmationDialogComponent } from '../../booking-confirmation/booking-confirmation-dialog/booking-confirmation-dialog';
import { BookingConfirmationService } from '../../booking-confirmation/booking-confirmation.service';
import { BookingConfirmationActions } from '../../booking-confirmation/store/booking-confirmation.actions';
import { selectConfirmationsByTripId, selectDeleteStatus as selectConfirmationDeleteStatus, selectParseStatus } from '../../booking-confirmation/store/booking-confirmation.reducer';
import { ExpenseActions } from '../../expense/store/expense.actions';
import { selectAllExpenses, selectExpensesLoadStatus } from '../../expense/store/expense.selectors';
import { ExpenseCategory } from '../../expense/expense.model';
import { TrainBookingFormComponent } from '../../train-booking/train-booking-form/train-booking-form';
import { HotelBookingFormComponent } from '../../hotel-booking/hotel-booking-form/hotel-booking-form';

type BookingType = 'train' | 'hotel';

@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [NgClass, DecimalPipe, TranslatePipe, TripFormComponent, RouterLink, ExpenseFormComponent, TrainBookingFormComponent, HotelBookingFormComponent, BookingConfirmationDialogComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './trip-detail.html',
})
export class TripDetailComponent {
  private readonly store = inject(Store);
  protected readonly confirmationService = inject(BookingConfirmationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly localeService = inject(LocaleService);

  private readonly routeParamId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('id') ?? '')),
    { initialValue: '' }
  );
  protected readonly tripId = this.routeParamId;

  private readonly allTrips = this.store.selectSignal(selectAllTrips);
  protected readonly trip = computed(() =>
    this.allTrips().find((t) => t.id === this.tripId()) ?? null
  );

  /** Whether the edit form modal is open */
  protected readonly isFormOpen = signal(false);
  protected readonly isConfirmationImportOpen = signal(false);
  protected readonly confirmationPendingDeleteId = signal<string | null>(null);
  private confirmationDeletePending = false;

  /** Whether the train booking form modal is open */
  protected readonly isTrainBookingFormOpen = signal(false);

  /** Whether the expense form modal is open */
  protected readonly isExpenseFormOpen = signal(false);

  /** Whether the hotel booking form modal is open */
  protected readonly isHotelBookingFormOpen = signal(false);

  /** Whether the inline delete confirmation prompt is shown */
  protected readonly showDeleteConfirm = signal(false);

  /** Whether the inline clear-booking confirmation prompt is shown */
  protected readonly showClearBookingConfirm = signal(false);
  protected readonly clearBookingTarget = signal<BookingType | null>(null);

  private readonly deleteStatus = this.store.selectSignal(selectTripsDeleteStatus);
  protected readonly isDeleting = computed(() => this.deleteStatus() === 'loading');
  protected readonly deleteError = computed<string | null>(() =>
    this.deleteStatus() === 'failure' ? 'tripDetail.deleteError' : null
  );

  private readonly updateStatus = this.store.selectSignal(selectTripsUpdateStatus);
  private readonly clearBookingPending = signal(false);
  protected readonly isClearingBooking = computed(() =>
    this.clearBookingPending() && this.updateStatus() === 'loading',
  );
  protected readonly clearBookingError = signal<string | null>(null);

  protected readonly expenses = this.store.selectSignal(selectAllExpenses);

  private readonly allConfirmations = this.store.selectSignal(selectConfirmationsByTripId);
  protected readonly tripConfirmations = computed(() => {
    const tripId = this.tripId();
    if (!tripId) return [];
    return this.allConfirmations()[tripId] ?? [];
  });

  private readonly confirmationParseStatus = this.store.selectSignal(selectParseStatus);
  protected readonly isConfirmationParsing = computed(() => this.confirmationParseStatus() === 'loading');
  private readonly confirmationDeleteStatus = this.store.selectSignal(selectConfirmationDeleteStatus);
  protected readonly isDeletingConfirmation = computed(() => this.confirmationDeleteStatus() === 'loading');
  protected readonly expensesLoadStatus = this.store.selectSignal(selectExpensesLoadStatus);

  protected readonly TripStatus = TripStatus;
  protected readonly ExpenseCategory = ExpenseCategory;
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

    effect(() => {
      const us = this.updateStatus();
      if (this.clearBookingPending()) {
        const target = this.clearBookingTarget();
        if (us === 'success') {
          this.clearBookingPending.set(false);
          this.showClearBookingConfirm.set(false);
          this.clearBookingTarget.set(null);
        } else if (us === 'failure') {
          this.clearBookingPending.set(false);
          this.clearBookingError.set(
            target === 'hotel'
              ? 'tripDetail.clearHotelBookingError'
              : 'tripDetail.clearTrainBookingError',
          );
        }
      }
    });

    // Load expenses when the trip id is known
    effect(() => {
      const id = this.tripId();
      if (id) {
        this.store.dispatch(ExpenseActions.loadExpenses({ tripId: id }));
        this.store.dispatch(BookingConfirmationActions.loadConfirmationsForTrip({ tripId: id }));
      }
    });

    effect(() => {
      if (this.confirmationParseStatus() === 'success') this.isConfirmationImportOpen.set(true);
    });

    effect(() => {
      const status = this.confirmationDeleteStatus();
      if (!this.confirmationDeletePending) return;
      if (status === 'success' || status === 'failure') {
        this.confirmationDeletePending = false;
        if (status === 'success') this.confirmationPendingDeleteId.set(null);
      }
    });
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

  protected formatDateTime(dateTimeStr: string): string {
    return new Intl.DateTimeFormat(this.localeService.currentLocale(), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateTimeStr));
  }

  protected openEditForm(): void {
    this.isFormOpen.set(true);
  }

  protected closeForm(): void {
    this.isFormOpen.set(false);
  }

  protected openTrainBookingForm(): void {
    this.isTrainBookingFormOpen.set(true);
  }

  protected closeTrainBookingForm(): void {
    this.isTrainBookingFormOpen.set(false);
  }

  protected openExpenseForm(): void {
    this.isExpenseFormOpen.set(true);
  }

  protected closeExpenseForm(): void {
    this.isExpenseFormOpen.set(false);
  }

  protected openHotelBookingForm(): void {
    this.isHotelBookingFormOpen.set(true);
  }

  protected closeHotelBookingForm(): void {
    this.isHotelBookingFormOpen.set(false);
  }

  protected onConfirmationFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = '';
    this.store.dispatch(BookingConfirmationActions.parseConfirmation({ file }));
  }

  protected closeConfirmationImport(): void {
    this.isConfirmationImportOpen.set(false);
    const tripId = this.tripId();
    if (tripId) {
      this.store.dispatch(BookingConfirmationActions.loadConfirmationsForTrip({ tripId }));
    }
  }

  protected getConfirmationDownloadUrl(id: string): string {
    return this.confirmationService.getDownloadUrl(id);
  }

  protected requestDeleteConfirmation(id: string): void {
    this.confirmationPendingDeleteId.set(id);
  }

  protected cancelDeleteConfirmation(): void {
    this.confirmationPendingDeleteId.set(null);
  }

  protected onDeleteConfirmation(id: string, tripId: string): void {
    if (this.isDeletingConfirmation()) return;
    this.confirmationDeletePending = true;
    this.store.dispatch(BookingConfirmationActions.deleteConfirmation({ id, tripId }));
  }

  protected navigateToExpense(expenseId: string): void {
    this.router.navigate(['/expense', expenseId]);
  }

  protected requestDelete(): void {
    this.showDeleteConfirm.set(true);
  }

  protected cancelDelete(): void {
    this.showDeleteConfirm.set(false);
  }

  protected requestClearBooking(type: BookingType): void {
    this.clearBookingError.set(null);
    this.clearBookingTarget.set(type);
    this.showClearBookingConfirm.set(true);
  }

  protected cancelClearBooking(): void {
    this.showClearBookingConfirm.set(false);
    this.clearBookingTarget.set(null);
    this.clearBookingError.set(null);
  }

  protected onClearBooking(): void {
    const trip = this.trip();
    const target = this.clearBookingTarget();
    if (!trip || !target || this.isClearingBooking()) return;

    this.clearBookingError.set(null);
    this.clearBookingPending.set(true);
    this.store.dispatch(TripActions.updateTrip({
      id: trip.id,
      request: {
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        status: trip.status,
        trainBooking: target === 'train' ? null : trip.trainBooking ?? null,
        hotelBooking: target === 'hotel' ? null : trip.hotelBooking ?? null,
      },
    }));
  }

  protected onDelete(): void {
    const trip = this.trip();
    if (!trip || this.isDeleting()) return;

    this.showDeleteConfirm.set(false);
    this.deletePending = true;
    this.store.dispatch(TripActions.deleteTrip({ id: trip.id }));
  }
}
