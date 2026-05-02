import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { NgClass } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Trip, TripStatus } from '../trip.model';
import { TripService } from '../trip.service';

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
export class TripFormComponent implements OnChanges {
  /** null = create mode; a Trip object = edit mode */
  @Input() trip: Trip | null = null;
  /** Pre-fill the start/end date when creating a new trip */
  @Input() defaultDate: string | null = null;

  @Output() saved = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly tripService = inject(TripService);
  private readonly fb = inject(FormBuilder);

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
    { validators: endDateAfterStartDate },
  );

  ngOnChanges(): void {
    this.errorKey.set(null);
    if (this.trip) {
      this.form.setValue({
        destination: this.trip.destination,
        startDate: this.trip.startDate,
        endDate: this.trip.endDate,
        status: this.trip.status,
      });
    } else {
      this.form.reset({
        destination: '',
        startDate: this.defaultDate ?? '',
        endDate: this.defaultDate ?? '',
        status: TripStatus.Planned,
      });
    }
  }

  get isEditMode(): boolean {
    return this.trip !== null;
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

  protected onSubmit(): void {
    if (this.form.invalid || this.isLoading()) return;

    const { destination, startDate, endDate, status } = this.form.getRawValue();
    const request = {
      destination: destination!,
      startDate: startDate!,
      endDate: endDate!,
      status: status!,
    };

    this.isLoading.set(true);
    this.errorKey.set(null);

    const operation = this.isEditMode
      ? this.tripService.update(this.trip!.id, request)
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
    if (!this.trip || this.isLoading()) return;

    this.isLoading.set(true);
    this.errorKey.set(null);

    this.tripService.delete(this.trip.id).subscribe({
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
