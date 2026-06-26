import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { BookingConfirmationActions } from '../store/booking-confirmation.actions';
import { selectParseStatus } from '../store/booking-confirmation.reducer';

@Component({
  selector: 'app-booking-confirmation-upload',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './booking-confirmation-upload.html',
})
export class BookingConfirmationUploadComponent {
  private readonly store = inject(Store);

  private readonly parseStatus = this.store.selectSignal(selectParseStatus);

  protected readonly isParsing = computed(() => this.parseStatus() === 'loading');
  protected readonly parseError = computed<string | null>(() =>
    this.parseStatus() === 'failure' ? 'bookingConfirmation.parseError' : null,
  );

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = '';
    this.store.dispatch(BookingConfirmationActions.parseConfirmation({ file }));
  }
}
