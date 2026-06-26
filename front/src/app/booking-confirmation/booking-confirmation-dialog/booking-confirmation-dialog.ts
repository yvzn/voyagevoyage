import { Component, inject, output, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { BookingConfirmationFormComponent } from '../booking-confirmation-form/booking-confirmation-form';
import { BookingConfirmationActions } from '../store/booking-confirmation.actions';
import { selectParsedConfirmation, selectParsedFile } from '../store/booking-confirmation.reducer';
import { TripActions } from '../../trip/store/trip.actions';

@Component({
  selector: 'app-booking-confirmation-dialog',
  standalone: true,
  imports: [BookingConfirmationFormComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './booking-confirmation-dialog.html',
})
export class BookingConfirmationDialogComponent {
  private readonly store = inject(Store);

  readonly closed = output<void>();

  protected readonly parsedConfirmation = this.store.selectSignal(selectParsedConfirmation);
  protected readonly parsedFile = this.store.selectSignal(selectParsedFile);

  protected onSaved(tripId: string): void {
    this.store.dispatch(TripActions.loadTrips());
    this.store.dispatch(BookingConfirmationActions.clearParsedConfirmation());
    this.closed.emit();
  }

  protected onCancelled(): void {
    this.store.dispatch(BookingConfirmationActions.clearParsedConfirmation());
    this.closed.emit();
  }
}
