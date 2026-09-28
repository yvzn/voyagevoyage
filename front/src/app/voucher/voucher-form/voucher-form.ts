import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { CreateVoucherRequest, UpdateVoucherRequest, Voucher, VoucherCategory } from '../voucher.model';

@Component({
  selector: 'app-voucher-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './voucher-form.html',
})
export class VoucherFormComponent {
  readonly voucher = input<Voucher | null>(null);
  readonly saved = output<CreateVoucherRequest | UpdateVoucherRequest>();
  readonly cancelled = output<void>();

  private readonly fb = inject(FormBuilder);

  protected readonly categories = Object.values(VoucherCategory);

  protected readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.maxLength(100)]],
    category: [VoucherCategory.Train, Validators.required],
    description: ['', Validators.maxLength(500)],
    expirationDate: [''],
  });

  protected readonly isEdit = computed(() => !!this.voucher());

  constructor() {
    effect(() => {
      const voucher = this.voucher();
      if (voucher) {
        this.form.patchValue({
          code: voucher.code,
          category: voucher.category,
          description: voucher.description ?? '',
          expirationDate: voucher.expirationDate ?? '',
        });
        return;
      }

      this.form.reset({
        code: '',
        category: VoucherCategory.Train,
        description: '',
        expirationDate: '',
      });
    });
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const request: CreateVoucherRequest | UpdateVoucherRequest = {
      code: value.code.trim(),
      category: value.category,
      description: value.description.trim(),
      expirationDate: value.expirationDate || null,
    };

    this.saved.emit(request);
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }
}
