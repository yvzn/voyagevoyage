import { Component, computed, inject, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ReceiptService } from '../receipt.service';

@Component({
  selector: 'app-receipt-preview',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './receipt-preview.html',
})
export class ReceiptPreviewComponent {
  /** The receipt to preview */
  readonly receipt = input<{
    id: string;
    fileName: string;
    contentType: string;
  } | null>(null);

  /** Whether the preview modal is open */
  readonly isOpen = input<boolean>(false);

  /** Event emitted when the preview should be closed */
  readonly closed = output<void>();

  protected readonly receiptService = inject(ReceiptService);

  /** Whether this is a PDF file */
  protected readonly isPdf = computed(() => {
    const receipt = this.receipt();
    return receipt ? receipt.contentType.startsWith('application/pdf') : false;
  });

  /** Whether this is an image file */
  protected readonly isImage = computed(() => {
    const receipt = this.receipt();
    return receipt ? receipt.contentType.startsWith('image/') : false;
  });

  /** URL for the preview */
  protected readonly previewUrl = computed(() => {
    const receipt = this.receipt();
    return receipt ? this.receiptService.getPreviewUrl(receipt.id) : '';
  });

  /** File name for display */
  protected readonly fileName = computed(() => this.receipt()?.fileName ?? '');

  /** Gets a safe file name for display (truncated if too long) */
  protected getDisplayFileName(fileName: string): string {
    if (fileName.length <= 50) return fileName;
    return fileName.slice(0, 47) + '...';
  }

  /** Handle image load errors gracefully */
  protected onImageError(): void {
    // Image failed to load, but we don't need to do anything special
    // The browser will show a broken image icon
  }
}