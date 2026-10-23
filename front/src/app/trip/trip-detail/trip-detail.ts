import { Component, computed, effect, inject, signal, untracked, ChangeDetectionStrategy } from '@angular/core';
import { NgClass, DecimalPipe } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { Trip, TripStatus } from '../trip.model';
import { TripActions } from '../store/trip.actions';
import {
  selectAllTrips,
  selectTripsDeleteStatus,
  selectTripsUpdateStatus,
  selectTripsLoadByIdStatus,
} from '../store/trip.selectors';
import { TripFormComponent } from '../trip-form/trip-form';
import { getTripStatusClass, getTripStatusTranslationKey } from '../trip-status.utils';
import { LocaleService } from '../../locale.service';
import { ExpenseFormComponent } from '../../expense/expense-form/expense-form';
import { BookingConfirmationDialogComponent } from '../../booking-confirmation/booking-confirmation-dialog/booking-confirmation-dialog';
import { BookingConfirmationService } from '../../booking-confirmation/booking-confirmation.service';
import { BookingConfirmationActions } from '../../booking-confirmation/store/booking-confirmation.actions';
import { selectConfirmationsByTripId, selectDeleteStatus as selectConfirmationDeleteStatus, selectParseStatus } from '../../booking-confirmation/store/booking-confirmation.reducer';
import { ExpenseActions } from '../../expense/store/expense.actions';
import {
  selectAllExpenses,
  selectExpensesLastCreatedExpenseId,
  selectExpensesLoadStatus,
  selectExpectedExpenses,
  selectExpectedExpensesLoadStatus,
  selectExpectedExpensesTripId,
} from '../../expense/store/expense.selectors';
import { selectReceiptsByExpenseId } from '../../receipt/store/receipt.reducer';
import { ReceiptActions } from '../../receipt/store/receipt.actions';
import {
  Expense,
  ExpenseCategory,
  ExpectedExpenseDayRole,
  ExpectedExpenseSlot,
  ExpectedExpensesResponse,
} from '../../expense/expense.model';
import { TrainBookingFormComponent } from '../../train-booking/train-booking-form/train-booking-form';
import { HotelBookingFormComponent } from '../../hotel-booking/hotel-booking-form/hotel-booking-form';
import { AddFrequentExpensesModalComponent } from '../add-frequent-expenses-modal/add-frequent-expenses-modal';
import { FrequentExpenseWithDateOverride } from '../../frequent-expense/frequent-expense.model';
import { LoadingSpinnerComponent } from '../../loading-spinner/loading-spinner';

type BookingType = 'train' | 'hotel';
type ChecklistDisplayState = 'done' | 'missing' | 'editing' | 'none';

interface ExpectedSlotDisplay {
  slot: ExpectedExpenseSlot;
  state: ChecklistDisplayState;
  expense: Expense | null;
}

interface ExpenseDayGroup {
  date: string | null;
  role: ExpectedExpenseDayRole | null;
  expectedSlots: ExpectedSlotDisplay[];
  expenses: Expense[];
  total: number;
  covered: number;
  missing: number;
}

@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [NgClass, DecimalPipe, TranslatePipe, TripFormComponent, RouterLink, ExpenseFormComponent, TrainBookingFormComponent, HotelBookingFormComponent, BookingConfirmationDialogComponent, AddFrequentExpensesModalComponent, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './trip-detail.html',
})
export class TripDetailComponent {
  private readonly store = inject(Store);
  protected readonly confirmationService = inject(BookingConfirmationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly localeService = inject(LocaleService);
  private readonly translate = inject(TranslateService);

  private readonly routeParamId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('id') ?? '')),
    { initialValue: '' }
  );
  private readonly alertExpenseId = toSignal(
    this.route.queryParamMap.pipe(map((p) => p.get('expenseId'))),
    { initialValue: null },
  );
  private readonly alertReceiptId = toSignal(
    this.route.queryParamMap.pipe(map((p) => p.get('receiptId'))),
    { initialValue: null },
  );
  protected readonly tripId = this.routeParamId;

  private readonly allTrips = this.store.selectSignal(selectAllTrips);
  protected readonly trip = computed(() =>
    this.allTrips().find((t) => t.id === this.tripId()) ?? null
  );
  protected readonly loadByIdStatus = this.store.selectSignal(selectTripsLoadByIdStatus);

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

  /** Whether the add frequent expenses modal is open */
  protected readonly isAddFrequentExpensesOpen = signal(false);

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
  private readonly expectedExpensesResponse = this.store.selectSignal(selectExpectedExpenses);
  private readonly expectedExpensesTripId = this.store.selectSignal(selectExpectedExpensesTripId);
  private readonly expectedExpensesLoadStatus = this.store.selectSignal(selectExpectedExpensesLoadStatus);
  private readonly stableExpectedExpenses = signal<{
    tripSignature: string;
    result: ExpectedExpensesResponse;
  } | null>(null);
  private readonly visibleExpectedExpenses = signal<{
    tripSignature: string;
    result: ExpectedExpensesResponse;
  } | null>(null);
  private readonly noExpenseSlotIds = signal<ReadonlySet<string>>(new Set());
  protected readonly activeExpectedSlotId = signal<string | null>(null);
  protected readonly expectedSlotSavePending = signal(false);
  protected readonly defaultExpenseDate = signal<string | null>(null);
  protected readonly defaultExpenseCategory = signal<ExpenseCategory | null>(null);
  protected readonly defaultExpenseDescription = signal<string | null>(null);
  protected readonly expectedChecklist = computed(() => {
    const visible = this.visibleExpectedExpenses();
    const trip = this.trip();
    return visible && trip && visible.tripSignature === this.getTripSignature(trip)
      ? visible.result
      : null;
  });
  protected readonly expectedSummary = computed(() => {
    const groups = this.expenseDayGroups().filter((group) => group.date !== null);
    const total = groups.reduce((sum, group) => sum + group.total, 0);
    const covered = groups.reduce((sum, group) => sum + group.covered, 0);
    return {
      total,
      covered,
      missing: total - covered,
    };
  });
  protected readonly expectedCategoriesText = computed(() => {
    const slots = this.expectedChecklist()?.days.flatMap((day) => day.slots) ?? [];
    const categories = [...new Set(slots.map((slot) => slot.category))];
    const labels = categories.map((category) =>
      this.translate.instant(`tripDetail.expectedCategory.${category}`),
    );
    return new Intl.ListFormat(this.localeService.currentLocale(), {
      style: 'long',
      type: 'conjunction',
    }).format(labels);
  });
  protected readonly expenseDayGroups = computed(() => this.buildExpenseDayGroups());
  private readonly allReceiptsByExpenseId = this.store.selectSignal(selectReceiptsByExpenseId);
  protected readonly hasReceiptForExpense = (expenseId: string): boolean =>
    (this.allReceiptsByExpenseId()[expenseId]?.length ?? 0) > 0;
  protected readonly isAlertedExpense = (expenseId: string): boolean =>
    this.alertExpenseId() === expenseId ||
    (!!this.alertReceiptId() &&
      this.allReceiptsByExpenseId()[expenseId]?.some(receipt => receipt.id === this.alertReceiptId()) === true);
  private readonly lastCreatedExpenseId = this.store.selectSignal(selectExpensesLastCreatedExpenseId);

  private readonly allConfirmations = this.store.selectSignal(selectConfirmationsByTripId);
  protected readonly tripConfirmations = computed(() => {
    const tripId = this.tripId();
    if (!tripId) return [];
    const confirmations = this.allConfirmations();
    return confirmations ? (confirmations[tripId] ?? []) : [];
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
    let lastRequestedTripId = '';
    let lastRequestedTripSignature = '';
    let lastRequestedExpenses: Expense[] | null = null;

    effect(() => {
      const trip = this.trip();
      const tripId = this.tripId();
      const loadStatus = this.expensesLoadStatus();
      const currentExpenses = this.expenses();
      const tripSignature = trip ? this.getTripSignature(trip) : '';
      if (
        !trip ||
        !tripId ||
        loadStatus !== 'success' ||
        (tripId === lastRequestedTripId &&
          tripSignature === lastRequestedTripSignature &&
          currentExpenses === lastRequestedExpenses)
      )
        return;

      lastRequestedTripId = tripId;
      lastRequestedTripSignature = tripSignature;
      lastRequestedExpenses = currentExpenses;
      this.store.dispatch(ExpenseActions.loadExpectedExpenses({ tripId }));
    });

    effect(() => {
      const trip = this.trip();
      const tripId = this.tripId();
      const responseTripId = this.expectedExpensesTripId();
      const status = this.expectedExpensesLoadStatus();
      const response = this.expectedExpensesResponse();
      if (!trip || !tripId || responseTripId !== tripId)
        return;

      if (status === 'failure') {
        this.visibleExpectedExpenses.set(null);
        return;
      }
      if (status !== 'success' || !response)
        return;

      const tripSignature = this.getTripSignature(trip);
      const previous = untracked(() => this.stableExpectedExpenses());
      const result = previous?.tripSignature === tripSignature
        ? this.mergeExpectedExpenses(previous.result, response)
        : response;

      this.stableExpectedExpenses.set({ tripSignature, result });
      this.visibleExpectedExpenses.set({ tripSignature, result });

      if (this.expectedSlotSavePending()) {
        const slotId = this.activeExpectedSlotId();
        if (slotId && result.days.some((day) =>
          day.slots.some((slot) => slot.slotId === slotId),
        )) {
          this.activeExpectedSlotId.set(null);
          this.expectedSlotSavePending.set(false);
        }
      }

      const coveredSlotIds = new Set(
        result.days.flatMap((day) =>
          day.slots.filter((slot) => slot.state === 'done').map((slot) => slot.slotId),
        ),
      );
      if (coveredSlotIds.size > 0) {
        const current = untracked(() => this.noExpenseSlotIds());
        const next = new Set([...current].filter((slotId) => !coveredSlotIds.has(slotId)));
        if (next.size !== current.size)
          this.noExpenseSlotIds.set(next);
      }
    });

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
        this.store.dispatch(TripActions.loadTripById({ id }));
        this.store.dispatch(ExpenseActions.loadExpenses({ tripId: id }));
        this.store.dispatch(BookingConfirmationActions.loadConfirmationsForTrip({ tripId: id }));
      }
    });

    effect(() => {
      const expenseIds = [...new Set(this.expenses().map((expense) => expense.id))];
      if (expenseIds.length === 0) return;

      for (const expenseId of expenseIds) {
        this.store.dispatch(ReceiptActions.loadReceiptsForExpense({ expenseId }));
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

  protected formatTripDay(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Intl.DateTimeFormat(this.localeService.currentLocale(), {
      weekday: 'short',
      month: 'short',
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
    this.activeExpectedSlotId.set(null);
    this.defaultExpenseDate.set(this.trip()?.startDate ?? null);
    this.defaultExpenseCategory.set(null);
    this.defaultExpenseDescription.set(null);
    this.isExpenseFormOpen.set(true);
  }

  protected closeExpenseForm(): void {
    this.isExpenseFormOpen.set(false);
    this.activeExpectedSlotId.set(null);
    this.expectedSlotSavePending.set(false);
    this.defaultExpenseCategory.set(null);
    this.defaultExpenseDescription.set(null);
  }

  protected onExpenseSaved(): void {
    if (this.activeExpectedSlotId()) {
      this.isExpenseFormOpen.set(false);
      this.expectedSlotSavePending.set(true);
      return;
    }

    this.closeExpenseForm();
    const createdExpenseId = this.lastCreatedExpenseId();
    if (createdExpenseId) {
      this.router.navigate(['/expense', createdExpenseId]);
    }
  }

  protected openHotelBookingForm(): void {
    this.isHotelBookingFormOpen.set(true);
  }

  protected closeHotelBookingForm(): void {
    this.isHotelBookingFormOpen.set(false);
  }

  protected openAddFrequentExpensesModal(): void {
    this.isAddFrequentExpensesOpen.set(true);
  }

  protected closeAddFrequentExpensesModal(): void {
    this.isAddFrequentExpensesOpen.set(false);
  }

  protected onAddFrequentExpenses(expenses: FrequentExpenseWithDateOverride[]): void {
    const tripId = this.tripId();
    if (!tripId) return;

    expenses.forEach(expense => {
      const createExpenseRequest = {
        date: expense.dateOverride,
        category: expense.category,
        amount: expense.amount,
        description: expense.description,
      };
      this.store.dispatch(ExpenseActions.createExpense({ tripId, request: createExpenseRequest }));
    });

    this.closeAddFrequentExpensesModal();
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

  protected enterExpectedExpense(slot: ExpectedExpenseSlot, date: string): void {
    this.activeExpectedSlotId.set(slot.slotId);
    this.expectedSlotSavePending.set(false);
    this.defaultExpenseDate.set(date);
    this.defaultExpenseCategory.set(slot.category);
    this.defaultExpenseDescription.set(slot.detail);
    this.isExpenseFormOpen.set(true);
  }

  protected markNoExpense(slotId: string): void {
    this.noExpenseSlotIds.update((current) => new Set(current).add(slotId));
  }

  protected undoNoExpense(slotId: string): void {
    this.noExpenseSlotIds.update((current) => {
      const next = new Set(current);
      next.delete(slotId);
      return next;
    });
  }

  protected cancelExpectedExpenseEntry(): void {
    this.closeExpenseForm();
  }

  private buildExpenseDayGroups(): ExpenseDayGroup[] {
    const trip = this.trip();
    if (!trip)
      return [];

    const tripExpenses = this.expenses()
      .filter((expense) => expense.tripId === trip.id);
    const expectedByDate = new Map(
      (this.expectedChecklist()?.days ?? []).map((day) => [day.date, day]),
    );
    const actualByDate = new Map<string, Expense[]>();
    for (const expense of tripExpenses) {
      const group = actualByDate.get(expense.date) ?? [];
      group.push(expense);
      actualByDate.set(expense.date, group);
    }

    const groups: ExpenseDayGroup[] = [];
    const tripDates: string[] = [];
    const start = new Date(`${trip.startDate}T00:00:00Z`).getTime();
    const end = new Date(`${trip.endDate}T00:00:00Z`).getTime();
    for (let timestamp = start; timestamp <= end; timestamp += 24 * 60 * 60 * 1000) {
      tripDates.push(new Date(timestamp).toISOString().slice(0, 10));
    }

    for (const date of tripDates) {
      const expectedDay = expectedByDate.get(date);
      const slots = [...(expectedDay?.slots ?? [])].sort((left, right) =>
        this.categoryLabel(left.category).localeCompare(this.categoryLabel(right.category), this.localeService.currentLocale()),
      );
      const remainingExpenses = this.sortExpensesByCategory(actualByDate.get(date) ?? []);
      const matchedBySlotId = new Map<string, Expense>();

      for (const slot of slots.filter((item) => item.state === 'done')) {
        const expense = remainingExpenses.find((item) => item.id === slot.expenseId);
        if (expense) {
          matchedBySlotId.set(slot.slotId, expense);
        }
      }

      const consumedIds = new Set([...matchedBySlotId.values()].map((expense) => expense.id));
      const missingSlots = slots
        .filter((slot) => !matchedBySlotId.has(slot.slotId))
        .sort((left, right) => {
          const leftHasExact = remainingExpenses.some((expense) =>
            !consumedIds.has(expense.id) &&
            expense.category === left.category &&
            this.normalizeDetail(expense.description) === this.normalizeDetail(left.detail),
          );
          const rightHasExact = remainingExpenses.some((expense) =>
            !consumedIds.has(expense.id) &&
            expense.category === right.category &&
            this.normalizeDetail(expense.description) === this.normalizeDetail(right.detail),
          );
          return Number(rightHasExact) - Number(leftHasExact);
        });

      for (const slot of missingSlots) {
        const candidates = remainingExpenses.filter((expense) =>
          !consumedIds.has(expense.id) && expense.category === slot.category,
        );
        const exact = candidates.find((expense) =>
          this.normalizeDetail(expense.description) === this.normalizeDetail(slot.detail),
        );
        const matchedExpense = exact ?? candidates[0];
        if (matchedExpense) {
          matchedBySlotId.set(slot.slotId, matchedExpense);
          consumedIds.add(matchedExpense.id);
        }
      }

      const expectedSlots = slots.map((slot): ExpectedSlotDisplay => {
        const expense = matchedBySlotId.get(slot.slotId) ?? null;
        if (expense)
          return { slot, state: 'done', expense };
        if (this.activeExpectedSlotId() === slot.slotId)
          return { slot, state: 'editing', expense: null };
        if (this.noExpenseSlotIds().has(slot.slotId))
          return { slot, state: 'none', expense: null };
        return { slot, state: 'missing', expense: null };
      });

      const total = expectedSlots.length;
      const covered = expectedSlots.filter((item) =>
        item.state === 'done' || item.state === 'none',
      ).length;
      groups.push({
        date,
        role: expectedDay?.role ?? null,
        expectedSlots,
        expenses: this.sortExpensesByCategory(
          (actualByDate.get(date) ?? []).filter((expense) => !consumedIds.has(expense.id)),
        ),
        total,
        covered,
        missing: total - covered,
      });
    }

    const otherDateExpenses = tripExpenses
      .filter((expense) => expense.date < trip.startDate || expense.date > trip.endDate)
      .sort((left, right) =>
        left.date.localeCompare(right.date) ||
        this.categoryLabel(left.category).localeCompare(this.categoryLabel(right.category), this.localeService.currentLocale()),
      );
    if (otherDateExpenses.length > 0) {
      groups.push({
        date: null,
        role: null,
        expectedSlots: [],
        expenses: otherDateExpenses,
        total: 0,
        covered: 0,
        missing: 0,
      });
    }

    return groups;
  }

  private sortExpensesByCategory(expenses: Expense[]): Expense[] {
    return [...expenses].sort((left, right) =>
      this.categoryLabel(left.category).localeCompare(this.categoryLabel(right.category), this.localeService.currentLocale()) ||
      left.description.localeCompare(right.description, this.localeService.currentLocale()),
    );
  }

  private categoryLabel(category: ExpenseCategory): string {
    return this.translate.instant(`expenseCategory.${category}`);
  }

  private normalizeDetail(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLocaleLowerCase()
      .replace(/\s+/g, ' ');
  }

  private getTripSignature(trip: Trip): string {
    return JSON.stringify([
      trip.id,
      trip.startDate,
      trip.endDate,
      trip.destination,
      trip.status,
      trip.trainBooking,
      trip.hotelBooking,
    ]);
  }

  private mergeExpectedExpenses(
    previous: ExpectedExpensesResponse,
    current: ExpectedExpensesResponse,
  ): ExpectedExpensesResponse {
    const previousDays = new Map(previous.days.map((day) => [day.date, day]));
    const days = current.days.map((day) => {
      const oldDay = previousDays.get(day.date);
      if (!oldDay)
        return day;

      const currentSlots = new Map(day.slots.map((slot) => [slot.slotId, slot]));
      const mergedSlots = [
        ...day.slots,
        ...oldDay.slots
          .filter((slot) => !currentSlots.has(slot.slotId))
          .map((slot) => ({
            ...slot,
            state: 'missing' as const,
            expenseId: null,
          })),
      ];
      return { ...day, slots: mergedSlots };
    });

    return {
      summary: current.summary,
      days,
    };
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
