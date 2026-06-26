import {
  AfterViewInit,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { ParsedBookingConfirmation, BookingConfirmationType } from '../booking-confirmation.model';
import { BookingConfirmationActions } from '../store/booking-confirmation.actions';
import { selectApplyStatus } from '../store/booking-confirmation.reducer';
import { selectAllTrips } from '../../trip/store/trip.selectors';
import { Trip, TripStatus } from '../../trip/trip.model';
import { LocaleService } from '../../locale.service';

@Component({
  selector: 'app-booking-confirmation-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './booking-confirmation-form.html',
})
export class BookingConfirmationFormComponent implements AfterViewInit {
  private readonly store = inject(Store);
  protected readonly localeService = inject(LocaleService);
  private readonly fb = inject(FormBuilder);

  readonly parsed = input<ParsedBookingConfirmation | null>(null);
  readonly file = input<File | null>(null);
  readonly saved = output<string>(); // emits tripId
  readonly cancelled = output<void>();

  protected readonly dialogEl = viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');

  protected readonly form = this.fb.group({
    type: ['train' as BookingConfirmationType],
    tripId: [''],          // '' = create new trip
    tripDestination: [''],
    tripStartDate: [''],
    tripEndDate: [''],
    departure: [''],
    arrival: [''],
    departureDateTime: [''],
    returnDateTime: [''],
    hotelName: [''],
    hotelAddress: [''],
    bookingDate: [''],
  });

  private readonly applyStatus = this.store.selectSignal(selectApplyStatus);
  private readonly allTrips = this.store.selectSignal(selectAllTrips);

  protected readonly isSaving = computed(() => this.applyStatus() === 'loading');
  protected readonly saveError = computed<string | null>(() =>
    this.applyStatus() === 'failure' ? 'bookingConfirmation.applyError' : null,
  );

  protected readonly isTrainType = computed(() => this.form.getRawValue().type === 'train');

  /** Trips auto-filtered by date overlap with parsed start/end; all trips if no date available. */
  protected readonly suggestedTrips = computed<Trip[]>(() => {
    const p = this.parsed();
    const trips = this.allTrips();
    if (!p?.startDate) return trips;
    return trips.filter((t) => t.startDate <= p.startDate! && t.endDate >= p.startDate!);
  });

  protected readonly isCreatingNewTrip = computed(() => this.form.getRawValue().tripId === '');

  private saveOp = false;

  constructor() {
    effect(() => {
      const p = this.parsed();
      if (!p) return;
      const suggested = this.suggestedTrips();
      this.form.reset({
        type: p.detectedType,
        tripId: suggested[0]?.id ?? '',
        tripDestination: suggested[0]?.destination ?? p.arrival ?? p.hotelName ?? '',
        tripStartDate: suggested[0]?.startDate ?? p.startDate ?? p.checkInDate ?? '',
        tripEndDate: suggested[0]?.endDate ?? p.endDate ?? p.checkOutDate ?? '',
        departure: p.departure ?? '',
        arrival: p.arrival ?? '',
        departureDateTime: p.departureDateTime?.slice(0, 16) ?? '',
        returnDateTime: p.returnDateTime?.slice(0, 16) ?? '',
        hotelName: p.hotelName ?? '',
        hotelAddress: p.hotelAddress ?? '',
        bookingDate: p.checkInDate ?? p.startDate ?? '',
      });
    });

    effect(() => {
      const tripId = this.form.getRawValue().tripId;
      const trips = this.allTrips();
      const selected = trips.find((t) => t.id === tripId);
      if (selected) {
        this.form.patchValue({
          tripDestination: selected.destination,
          tripStartDate: selected.startDate,
          tripEndDate: selected.endDate,
        });
      }
    });

    effect(() => {
      const status = this.applyStatus();
      if (this.saveOp && status === 'success') {
        this.saveOp = false;
        const resolvedTripId = this.form.getRawValue().tripId ?? '';
        this.saved.emit(resolvedTripId);
      } else if (this.saveOp && status === 'failure') {
        this.saveOp = false;
      }
    });
  }

  ngAfterViewInit(): void {
    this.dialogEl().nativeElement.showModal();
  }

  protected onDialogCancel(event: Event): void {
    event.preventDefault();
    this.onCancel();
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === this.dialogEl().nativeElement) this.onCancel();
  }

  protected onSubmit(): void {
    const f = this.file();
    if (!f || this.isSaving()) return;

    const v = this.form.getRawValue();
    const type = v.type as BookingConfirmationType;
    const tripIdOrNull = v.tripId || null;

    const trainBooking = type === 'train' && (v.departure?.trim() || v.arrival?.trim())
      ? { departure: v.departure?.trim() ?? '', arrival: v.arrival?.trim() ?? '', departureDateTime: v.departureDateTime || null, returnDateTime: v.returnDateTime || null }
      : null;

    const hotelBooking = type === 'hotel' && (v.hotelName?.trim() || v.hotelAddress?.trim())
      ? { bookingDate: v.bookingDate?.trim() || v.tripStartDate?.trim() || '', hotelName: v.hotelName?.trim() ?? '', hotelAddress: v.hotelAddress?.trim() ?? '' }
      : null;

    this.saveOp = true;
    this.store.dispatch(BookingConfirmationActions.applyBookingConfirmation({
      file: f,
      tripId: tripIdOrNull,
      tripDestination: v.tripDestination?.trim() ?? '',
      tripStartDate: v.tripStartDate?.trim() ?? '',
      tripEndDate: v.tripEndDate?.trim() ?? '',
      tripStatus: TripStatus.Planned,
      trainBooking,
      hotelBooking,
    }));
  }

  protected onCancel(): void {
    this.store.dispatch(BookingConfirmationActions.clearParsedConfirmation());
    this.cancelled.emit();
  }

  protected formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Intl.DateTimeFormat(this.localeService.currentLocale(), {
      year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, day)));
  }
}
