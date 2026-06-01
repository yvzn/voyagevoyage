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
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { HotelBooking, Trip } from '../../trip/trip.model';
import { TripActions } from '../../trip/store/trip.actions';
import { selectTripsUpdateStatus } from '../../trip/store/trip.selectors';
import { LocaleService } from '../../locale.service';

@Component({
  selector: 'app-hotel-booking-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './hotel-booking-form.html',
})
export class HotelBookingFormComponent implements AfterViewInit {
  private readonly store = inject(Store);
  protected readonly localeService = inject(LocaleService);
  private readonly fb = inject(FormBuilder);

  readonly trip = input<Trip | null>(null);
  readonly saved = output<void>();
  readonly cancelled = output<void>();

  protected readonly dialogEl = viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');

  protected readonly form = this.fb.group({
    bookingDate: [''],
    hotelName: [''],
    hotelAddress: [''],
  });

  private readonly updateStatus = this.store.selectSignal(selectTripsUpdateStatus);
  protected readonly isSaving = computed(() => this.updateStatus() === 'loading');
  protected readonly saveError = computed<string | null>(() =>
    this.updateStatus() === 'failure' ? 'hotelBookingForm.saveError' : null,
  );

  private saveOp = false;

  constructor() {
    effect(() => {
      const t = this.trip();
      this.form.reset({
        bookingDate: t?.hotelBooking?.bookingDate ?? t?.startDate ?? '',
        hotelName: t?.hotelBooking?.hotelName ?? '',
        hotelAddress: t?.hotelBooking?.hotelAddress ?? '',
      });
    });

    effect(() => {
      const us = this.updateStatus();
      if (this.saveOp) {
        if (us === 'success') { this.saveOp = false; this.saved.emit(); }
        else if (us === 'failure') { this.saveOp = false; }
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
    if (event.target === this.dialogEl().nativeElement) {
      this.onCancel();
    }
  }

  protected onSubmit(): void {
    const trip = this.trip();
    if (!trip || this.isSaving()) return;

    const { bookingDate, hotelName, hotelAddress } = this.form.getRawValue();
    const hasAnyField = !!(bookingDate?.trim() || hotelName?.trim() || hotelAddress?.trim());
    const hotelBooking: HotelBooking | null = hasAnyField
      ? {
          bookingDate: bookingDate?.trim() || trip.startDate,
          hotelName: hotelName?.trim() ?? '',
          hotelAddress: hotelAddress?.trim() ?? '',
        }
      : null;

    this.saveOp = true;
    this.store.dispatch(TripActions.updateTrip({
      id: trip.id,
      request: {
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        status: trip.status,
        trainBooking: trip.trainBooking ?? null,
        hotelBooking,
      },
    }));
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }
}
