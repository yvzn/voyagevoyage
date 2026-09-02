import { Component, effect, input, output, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { NgClass } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { FiscalRule, CreateFiscalRuleRequest, UpdateFiscalRuleRequest } from '../fiscal-rule.model';

function dateRangeValidator(control: AbstractControl): ValidationErrors | null {
  const startDate = control.get('startDate')?.value;
  const endDate = control.get('endDate')?.value;
  if (startDate && endDate && endDate < startDate) {
    return { dateRangeInvalid: true };
  }
  return null;
}

@Component({
  selector: 'app-fiscal-rule-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './fiscal-rule-form.html',
})
export class FiscalRuleFormComponent {
  readonly fiscalRule = input<FiscalRule | null>(null);
  readonly saved = output<CreateFiscalRuleRequest | UpdateFiscalRuleRequest>();
  readonly cancelled = output<void>();
  readonly isSubmitting = input(false);

  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    mealAllowance: [0, [Validators.required, Validators.min(0)]],
    mealVoucherFaceValue: [0, [Validators.required, Validators.min(0)]],
    mealVoucherEmployerContributionPercentage: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    remoteWorkAllowance: [0, [Validators.required, Validators.min(0)]],
  }, { validators: dateRangeValidator });

  constructor() {
    effect(() => {
      const rule = this.fiscalRule();
      if (rule) {
        this.form.patchValue({
          startDate: rule.startDate,
          endDate: rule.endDate,
          mealAllowance: rule.mealAllowance,
          mealVoucherFaceValue: rule.mealVoucherFaceValue,
          mealVoucherEmployerContributionPercentage: rule.mealVoucherEmployerContributionPercentage,
          remoteWorkAllowance: rule.remoteWorkAllowance,
        });
      } else {
        this.form.reset({
          startDate: '',
          endDate: '',
          mealAllowance: 0,
          mealVoucherFaceValue: 0,
          mealVoucherEmployerContributionPercentage: 0,
          remoteWorkAllowance: 0,
        });
      }
    });
  }

  protected readonly isEdit = computed(() => !!this.fiscalRule());

  protected onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      return;
    }

    const formValue = this.form.getRawValue();
    const request: CreateFiscalRuleRequest | UpdateFiscalRuleRequest = {
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      mealAllowance: formValue.mealAllowance,
      mealVoucherFaceValue: formValue.mealVoucherFaceValue,
      mealVoucherEmployerContributionPercentage: formValue.mealVoucherEmployerContributionPercentage,
      remoteWorkAllowance: formValue.remoteWorkAllowance,
    };

    this.saved.emit(request);
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }
}
