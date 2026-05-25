import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { NgClass } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  PersonalLeave,
  LeaveType,
  CreatePersonalLeaveRequest,
  UpdatePersonalLeaveRequest,
} from '../personal-leave.model';
import { PersonalLeaveActions } from '../store/personal-leave.actions';
import {
  selectPersonalLeavesCreateStatus,
  selectPersonalLeavesUpdateStatus,
} from '../store/personal-leave.selectors';

/** Validates that endDate >= startDate when both are set. */
function endAfterStartValidator(group: AbstractControl): ValidationErrors | null {
  const start = group.get('startDate')?.value as string | null;
  const end = group.get('endDate')?.value as string | null;
  if (start && end && end < start) {
    return { endBeforeStart: true };
  }
  return null;
}

@Component({
  selector: 'app-personal-leave-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass, TranslatePipe],
  templateUrl: './personal-leave-form.html',
})
export class PersonalLeaveFormComponent implements AfterViewInit {
  /** When set, the form is in edit mode for this leave period. */
  readonly leave = input<PersonalLeave | null>(null);

  /** Pre-fill the start date field (YYYY-MM-DD). */
  readonly defaultDate = input<string | null>(null);

  readonly saved = output<void>();
  readonly cancelled = output<void>();

  private readonly dialogEl = viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');
  private readonly store = inject(Store);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  private readonly createStatus = this.store.selectSignal(selectPersonalLeavesCreateStatus);
  private readonly updateStatus = this.store.selectSignal(selectPersonalLeavesUpdateStatus);

  protected readonly LeaveType = LeaveType;
  protected readonly leaveTypes = [LeaveType.Annual, LeaveType.Sick, LeaveType.Other];

  protected readonly isSaving = computed(
    () => this.createStatus() === 'loading' || this.updateStatus() === 'loading',
  );
  protected readonly isLoading = computed(() => this.isSaving());

  protected readonly errorKey = computed<string | null>(() => {
    if (this.createStatus() === 'failure' || this.updateStatus() === 'failure')
      return 'personalLeaveForm.saveError';
    return null;
  });

  get isEditMode(): boolean {
    return this.leave() !== null;
  }

  /** Tracks which save operation (create/update) was last dispatched by this instance. */
  private saveOp: 'create' | 'update' | null = null;

  protected readonly form = this.fb.group(
    {
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      type: [LeaveType.Annual as LeaveType, Validators.required],
      label: [''],
    },
    { validators: endAfterStartValidator },
  );

  constructor() {
    // Populate form when inputs change
    effect(() => {
      const l = this.leave();
      const d = this.defaultDate();
      if (l) {
        this.form.setValue({
          startDate: l.startDate,
          endDate: l.endDate,
          type: l.type,
          label: l.label,
        });
      } else {
        this.form.reset({
          startDate: d ?? '',
          endDate: d ?? '',
          type: LeaveType.Annual,
          label: '',
        });
      }
    });

    // Sync end date when start date changes
    effect(() => {
      const startDateControl = this.form.get('startDate');
      const endDateControl = this.form.get('endDate');
      if (startDateControl && endDateControl) {
        startDateControl.valueChanges
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((newStartDate: string | null) => {
            if (newStartDate) {
              const currentEndDate = endDateControl.value as string;
              // Sync end date if it's empty or before the new start date
              if (!currentEndDate || currentEndDate < newStartDate) {
                endDateControl.setValue(newStartDate, { emitEvent: false });
              }
            }
          });
      }
    });

    // React to create completion
    effect(() => {
      const cs = this.createStatus();
      if (this.saveOp === 'create') {
        if (cs === 'success') {
          this.saveOp = null;
          this.saved.emit();
        } else if (cs === 'failure') {
          this.saveOp = null;
        }
      }
    });

    // React to update completion
    effect(() => {
      const us = this.updateStatus();
      if (this.saveOp === 'update') {
        if (us === 'success') {
          this.saveOp = null;
          this.saved.emit();
        } else if (us === 'failure') {
          this.saveOp = null;
        }
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
    if (this.form.invalid || this.isLoading()) return;

    const { startDate, endDate, type, label } = this.form.getRawValue();
    const leave = this.leave();

    if (leave) {
      const request: UpdatePersonalLeaveRequest = {
        startDate: startDate!,
        endDate: endDate!,
        type: type!,
        label: label ?? '',
      };
      this.saveOp = 'update';
      this.store.dispatch(PersonalLeaveActions.updatePersonalLeave({ id: leave.id, request }));
    } else {
      const request: CreatePersonalLeaveRequest = {
        startDate: startDate!,
        endDate: endDate!,
        type: type!,
        label: label ?? '',
      };
      this.saveOp = 'create';
      this.store.dispatch(PersonalLeaveActions.createPersonalLeave({ request }));
    }
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }
}
