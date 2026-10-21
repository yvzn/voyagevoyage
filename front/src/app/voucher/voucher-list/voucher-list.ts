import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { VoucherFormComponent } from '../voucher-form/voucher-form';
import { CreateVoucherRequest, UpdateVoucherRequest, Voucher, VoucherCategory } from '../voucher.model';
import { VoucherService, getVoucherCategoryLabelKey, getVoucherStatusLabelKey, isVoucherExpired } from '../voucher.service';

@Component({
  selector: 'app-voucher-list',
  standalone: true,
  imports: [CommonModule, TranslatePipe, VoucherFormComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './voucher-list.html',
})
export class VoucherListComponent {
  private readonly voucherService = inject(VoucherService);

  protected readonly vouchers = this.voucherService.vouchers;
  protected readonly loading = this.voucherService.loading;
  protected readonly loadError = this.voucherService.loadError;
  protected readonly saving = signal(false);
  protected readonly actionError = signal(false);
  protected readonly selectedCategory = signal<VoucherCategory | 'all'>('all');
  protected readonly isFormOpen = signal(false);
  protected readonly selectedVoucher = signal<Voucher | null>(null);
  protected readonly voucherToDelete = signal<Voucher | null>(null);

  protected readonly categories = Object.values(VoucherCategory);

  protected readonly filteredVouchers = computed(() => {
    const category = this.selectedCategory();
    return this.vouchers().filter((voucher) => category === 'all' || voucher.category === category);
  });

  protected readonly activeVoucherCount = computed(() => this.voucherService.getActiveVouchers().length);
  protected readonly usedVouchers = computed(() => {
    const category = this.selectedCategory();
    return this.vouchers().filter((voucher) => voucher.status === 'used' && (category === 'all' || voucher.category === category));
  });

  protected readonly categoryGroups = computed(() => {
    const activeCategory = this.selectedCategory();
    return this.categories
      .filter((category) => activeCategory === 'all' || category === activeCategory)
      .map((category) => ({
        category,
        vouchers: this.vouchers().filter((voucher) => voucher.category === category && voucher.status !== 'used'),
      }));
  });

  protected createVoucher(): void {
    this.selectedVoucher.set(null);
    this.isFormOpen.set(true);
  }

  protected editVoucher(voucher: Voucher): void {
    this.selectedVoucher.set(voucher);
    this.isFormOpen.set(true);
  }

  protected onFormSaved(request: CreateVoucherRequest | UpdateVoucherRequest): void {
    if (this.saving()) {
      return;
    }

    const voucher = this.selectedVoucher();
    const save$ = voucher
      ? this.voucherService.updateVoucher(voucher.id, request as UpdateVoucherRequest)
      : this.voucherService.addVoucher(request as CreateVoucherRequest);

    this.saving.set(true);
    this.actionError.set(false);
    save$.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
      },
      error: () => {
        this.saving.set(false);
        this.actionError.set(true);
      },
    });
  }

  protected onFormCancelled(): void {
    this.closeForm();
  }

  protected closeForm(): void {
    this.isFormOpen.set(false);
    this.selectedVoucher.set(null);
    this.actionError.set(false);
  }

  protected markAsUsed(voucher: Voucher): void {
    this.actionError.set(false);
    this.voucherService.markVoucherAsUsed(voucher.id).subscribe({
      error: () => this.actionError.set(true),
    });
  }

  protected deleteVoucher(voucher: Voucher): void {
    this.voucherToDelete.set(voucher);
  }

  protected confirmDelete(): void {
    const voucher = this.voucherToDelete();
    if (!voucher) {
      return;
    }

    this.actionError.set(false);
    this.voucherService.deleteVoucher(voucher.id).subscribe({
      next: () => this.voucherToDelete.set(null),
      error: () => {
        this.voucherToDelete.set(null);
        this.actionError.set(true);
      },
    });
  }

  protected retryLoad(): void {
    this.voucherService.load();
  }

  protected cancelDelete(): void {
    this.voucherToDelete.set(null);
  }

  protected isExpired(voucher: Voucher): boolean {
    return isVoucherExpired(voucher);
  }

  protected getStatusLabel(voucher: Voucher): string {
    return getVoucherStatusLabelKey(voucher);
  }

  protected getCategoryLabel(category: VoucherCategory): string {
    return getVoucherCategoryLabelKey(category);
  }

  protected formatDate(date: string | null): string {
    if (!date) {
      return '';
    }
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
  }
}
