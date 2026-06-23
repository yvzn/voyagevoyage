import { AfterViewInit, Component, computed, effect, inject, input, signal, ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { initFlowbite } from 'flowbite';
import { ReceiptActions } from '../store/receipt.actions';
import {
  selectReceiptsByExpenseId,
  selectUploadStatus,
  selectDeleteStatus,
} from '../store/receipt.reducer';
import { ReceiptService } from '../receipt.service';
import { ReceiptPreviewComponent } from '../receipt-preview/receipt-preview';

@Component({
  selector: 'app-receipt-upload',
  standalone: true,
  imports: [TranslatePipe, ReceiptPreviewComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './receipt-upload.html',
})
export class ReceiptUploadComponent implements AfterViewInit {
  /** When set, receipts are loaded/uploaded for this expense. */
  readonly expenseId = input<string | null>(null);

  private readonly store = inject(Store);
  protected readonly receiptService = inject(ReceiptService);

  private readonly allByExpense = this.store.selectSignal(selectReceiptsByExpenseId);

  protected readonly receipts = computed(() => {
    const expenseId = this.expenseId();
    if (expenseId) return this.allByExpense()[expenseId] ?? [];
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
  protected readonly isDeleting = computed(() => this.deleteStatus() === 'loading');

  /** Id of the receipt pending deletion confirmation; null if no confirmation is shown */
  protected readonly pendingDeleteId = signal<string | null>(null);

  /** Id of the receipt currently being previewed; null if no preview is shown */
  protected readonly previewReceiptId = signal<string | null>(null);

  constructor() {
    // Load receipts when the entity id becomes known
    effect(() => {
      const expenseId = this.expenseId();
      if (expenseId) {
        this.store.dispatch(ReceiptActions.loadReceiptsForExpense({ expenseId }));
      }
    });
  }

  ngAfterViewInit(): void {
    initFlowbite();
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Reset the input so the same file can be re-selected after an error
    input.value = '';

    const expenseId = this.expenseId();
    if (expenseId) {
      this.store.dispatch(ReceiptActions.uploadReceiptForExpense({ expenseId, file }));
    }
  }

  protected requestDelete(id: string): void {
    this.pendingDeleteId.set(id);
  }

  protected cancelDelete(): void {
    this.pendingDeleteId.set(null);
  }

  protected onDelete(id: string): void {
    const expenseId = this.expenseId();
    if (!expenseId || this.isDeleting()) return;

    this.pendingDeleteId.set(null);
    this.store.dispatch(
      ReceiptActions.deleteReceipt({ id, linkedEntityId: expenseId }),
    );
  }

  protected getDownloadUrl(id: string): string {
    return this.receiptService.getDownloadUrl(id);
  }

  protected isImage(contentType: string): boolean {
    return contentType.startsWith('image/');
  }

  /** Open preview for the specified receipt */
  protected openPreview(receiptId: string): void {
    this.previewReceiptId.set(receiptId);
  }

  /** Close the preview modal */
  protected closePreview(): void {
    this.previewReceiptId.set(null);
  }

  /** Get the receipt object by ID for preview */
  protected getReceiptById(receiptId: string | null): { id: string; fileName: string; contentType: string } | null {
    if (!receiptId) return null;
    
    const receipts = this.receipts();
    const receipt = receipts.find(r => r.id === receiptId);
    if (!receipt) return null;
    
    return {
      id: receipt.id,
      fileName: receipt.fileName,
      contentType: receipt.contentType
    };
  }
}
