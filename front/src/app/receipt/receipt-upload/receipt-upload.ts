import { Component, computed, effect, inject, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { ReceiptActions } from '../store/receipt.actions';
import {
  selectReceiptsByExpenseId,
  selectReceiptsByTripId,
  selectUploadStatus,
  selectDeleteStatus,
} from '../store/receipt.reducer';
import { ReceiptService } from '../receipt.service';

@Component({
  selector: 'app-receipt-upload',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './receipt-upload.html',
})
export class ReceiptUploadComponent {
  /** When set, receipts are loaded/uploaded for this expense. */
  readonly expenseId = input<string | null>(null);

  /** When set, receipts are loaded/uploaded for this trip. */
  readonly tripId = input<string | null>(null);

  private readonly store = inject(Store);
  protected readonly receiptService = inject(ReceiptService);

  private readonly allByExpense = this.store.selectSignal(selectReceiptsByExpenseId);
  private readonly allByTrip = this.store.selectSignal(selectReceiptsByTripId);

  protected readonly receipts = computed(() => {
    const expenseId = this.expenseId();
    const tripId = this.tripId();
    if (expenseId) return this.allByExpense()[expenseId] ?? [];
    if (tripId) return this.allByTrip()[tripId] ?? [];
    return [];
  });

  private readonly uploadStatus = this.store.selectSignal(selectUploadStatus);
  private readonly deleteStatus = this.store.selectSignal(selectDeleteStatus);

  protected readonly isUploading = computed(() => this.uploadStatus() === 'loading');
  protected readonly uploadError = computed<string | null>(() =>
    this.uploadStatus() === 'failure' ? 'receipt.uploadError' : null,
  );
  protected readonly deleteError = computed<string | null>(() =>
    this.deleteStatus() === 'failure' ? 'receipt.deleteError' : null,
  );

  constructor() {
    // Load receipts when the entity id becomes known
    effect(() => {
      const expenseId = this.expenseId();
      if (expenseId) {
        this.store.dispatch(ReceiptActions.loadReceiptsForExpense({ expenseId }));
      }
    });

    effect(() => {
      const tripId = this.tripId();
      if (tripId) {
        this.store.dispatch(ReceiptActions.loadReceiptsForTrip({ tripId }));
      }
    });
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Reset the input so the same file can be re-selected after an error
    input.value = '';

    const expenseId = this.expenseId();
    const tripId = this.tripId();

    if (expenseId) {
      this.store.dispatch(ReceiptActions.uploadReceiptForExpense({ expenseId, file }));
    } else if (tripId) {
      this.store.dispatch(ReceiptActions.uploadReceiptForTrip({ tripId, file }));
    }
  }

  protected onDelete(id: string): void {
    const expenseId = this.expenseId();
    const tripId = this.tripId();

    if (expenseId) {
      this.store.dispatch(
        ReceiptActions.deleteReceipt({ id, linkedEntityType: 'expense', linkedEntityId: expenseId }),
      );
    } else if (tripId) {
      this.store.dispatch(
        ReceiptActions.deleteReceipt({ id, linkedEntityType: 'trip', linkedEntityId: tripId }),
      );
    }
  }

  protected getDownloadUrl(id: string): string {
    return this.receiptService.getDownloadUrl(id);
  }

  protected isImage(contentType: string): boolean {
    return contentType.startsWith('image/');
  }
}
