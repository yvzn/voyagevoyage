import {
  AfterViewInit,
  Component,
  ElementRef,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { NgClass } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Trip, TripStatus } from '../trip.model';
import { TripService } from '../trip.service';
import { LocaleService } from '../../locale.service';
import { ConstraintsService } from '../../constraints/constraints.service';
import { constraintViolationValidator } from './constraint-violation.validator';

function endDateAfterStartDate(group: AbstractControl): ValidationErrors | null {
  const start = group.get('startDate')?.value as string;
  const end = group.get('endDate')?.value as string;
  if (start && end && end < start) {
    return { endBeforeStart: true };
  }
  return null;
}

@Component({
  selector: 'app-trip-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass, TranslatePipe],
  templateUrl: './trip-form.html',
})
export class TripFormComponent implements AfterViewInit {
  /** null = create mode; a Trip object = edit mode */
  readonly trip = input<Trip | null>(null);
  /** Pre-fill the start/end date when creating a new trip */
  readonly defaultDate = input<string | null>(null);

  readonly saved = output<void>();
  readonly deleted = output<void>();
  readonly cancelled = output<void>();

  private readonly dialogEl = viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');
  private readonly tripService = inject(TripService);
  private readonly fb = inject(FormBuilder);
  protected readonly localeService = inject(LocaleService);
  private readonly constraintsService = inject(ConstraintsService);

  protected readonly TripStatus = TripStatus;
  protected readonly tripStatuses = [TripStatus.Planned, TripStatus.Confirmed, TripStatus.Cancelled];

  protected readonly isLoading = signal(false);
  protected readonly errorKey = signal<string | null>(null);

  protected readonly form = this.fb.group(
    {
      destination: ['', [Validators.required, Validators.minLength(1)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      status: [TripStatus.Planned as TripStatus, Validators.required],
    },
    { validators: [endDateAfterStartDate, constraintViolationValidator(() => this.constraintsService.constraints())] },
  );

  constructor() {
    effect(
      () => {
        const t = this.trip();
        const d = this.defaultDate();
        this.errorKey.set(null);
        if (t) {
          this.form.setValue({
            destination: t.destination,
            startDate: t.startDate,
            endDate: t.endDate,
            status: t.status,
          });
        } else {
          this.form.reset({
            destination: '',
            startDate: d ?? '',
            endDate: d ?? '',
            status: TripStatus.Planned,
          });
        }
      },
      { allowSignalWrites: true },
    );
  }

  ngAfterViewInit(): void {
    this.dialogEl().nativeElement.showModal();
  }

  get isEditMode(): boolean {
    return this.trip() !== null;
  }

  protected getTripStatusTranslationKey(status: TripStatus): string {
    switch (status) {
      case TripStatus.Planned:
        return 'tripStatus.planned';
      case TripStatus.Confirmed:
        return 'tripStatus.confirmed';
      case TripStatus.Cancelled:
        return 'tripStatus.cancelled';
    }
  }

  protected onDialogCancel(event: Event): void {
    // Prevent the browser from closing the dialog directly; let our close logic handle it
    event.preventDefault();
    this.onCancel();
  }

  protected onBackdropClick(event: MouseEvent): void {
    // The inner content div stops propagation; clicks reaching the <dialog> are on the backdrop
    if (event.target === this.dialogEl().nativeElement) {
      this.onCancel();
    }
  }

  protected onSubmit(): void {
    // constraintWarning (flexible mode) is informational — it must not block submission.
    // Check field-level errors and specific group errors explicitly instead of form.invalid.
    const fieldInvalid = ['destination', 'startDate', 'endDate', 'status'].some(
      (name) => this.form.get(name)?.invalid,
    );
    const groupInvalid = this.form.hasError('endBeforeStart') || this.form.hasError('constraintError');
    if (fieldInvalid || groupInvalid || this.isLoading()) return;

    const { destination, startDate, endDate, status } = this.form.getRawValue();
    const request = {
      destination: destination!,
      startDate: startDate!,
      endDate: endDate!,
      status: status!,
    };

    this.isLoading.set(true);
    this.errorKey.set(null);

    const trip = this.trip();
    const operation = trip
      ? this.tripService.update(trip.id, request)
      : this.tripService.create(request);

    operation.subscribe({
      next: () => {
        this.isLoading.set(false);
        this.saved.emit();
      },
      error: () => {
        this.isLoading.set(false);
        this.errorKey.set('tripForm.saveError');
      },
    });
  }

  protected onDelete(): void {
    const trip = this.trip();
    if (!trip || this.isLoading()) return;

    this.isLoading.set(true);
    this.errorKey.set(null);

    this.tripService.delete(trip.id).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.deleted.emit();
      },
      error: () => {
        this.isLoading.set(false);
        this.errorKey.set('tripForm.deleteError');
      },
    });
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }
}
