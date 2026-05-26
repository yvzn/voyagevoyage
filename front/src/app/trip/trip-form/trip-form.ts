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
import { Trip, TripStatus } from '../trip.model';
import { TripActions } from '../store/trip.actions';
import { selectTripsCreateStatus, selectTripsUpdateStatus, selectAllTrips } from '../store/trip.selectors';
import { LocaleService } from '../../locale.service';
import { selectConstraints, selectPublicHolidays } from '../../constraints/store/settings.selectors';
import { SettingsActions } from '../../constraints/store/settings.actions';
import { constraintViolationValidator, ConstraintViolationReason } from './constraint-violation.validator';
import { getTripStatusTranslationKey } from '../trip-status.utils';
import { PersonalLeaveActions } from '../../personal-leave/store/personal-leave.actions';
import { selectAllPersonalLeaves } from '../../personal-leave/store/personal-leave.selectors';

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
  readonly cancelled = output<void>();

  private readonly dialogEl = viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');
  private readonly store = inject(Store);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly localeService = inject(LocaleService);

  private readonly constraints = this.store.selectSignal(selectConstraints);
  private readonly publicHolidays = this.store.selectSignal(selectPublicHolidays);
  private readonly personalLeaves = this.store.selectSignal(selectAllPersonalLeaves);
  private readonly allTrips = this.store.selectSignal(selectAllTrips);
  private readonly createStatus = this.store.selectSignal(selectTripsCreateStatus);
  private readonly updateStatus = this.store.selectSignal(selectTripsUpdateStatus);

  protected readonly TripStatus = TripStatus;
  protected readonly tripStatuses = [TripStatus.Planned, TripStatus.Confirmed, TripStatus.Cancelled];
  protected readonly getTripStatusTranslationKey = getTripStatusTranslationKey;

  protected readonly isSaving = computed(
    () => this.createStatus() === 'loading' || this.updateStatus() === 'loading',
  );

  protected readonly isLoading = computed(() => this.isSaving());

  protected readonly errorKey = computed<string | null>(() => {
    if (this.createStatus() === 'failure' || this.updateStatus() === 'failure')
      return 'tripForm.saveError';
    return null;
  });

  /** Violation reasons from the form's constraintWarning or constraintError. */
  protected readonly violationReasons = computed<ConstraintViolationReason[]>(() => {
    const detail =
      this.form.getError('constraintWarning') ?? this.form.getError('constraintError');
    return detail?.reasons ?? [];
  });

  /** Tracks which save operation (create/update) was last dispatched by this instance. */
  private saveOp: 'create' | 'update' | null = null;

  protected readonly form = this.fb.group(
    {
      destination: ['', [Validators.required, Validators.minLength(1)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      status: [TripStatus.Planned as TripStatus, Validators.required],
    },
    {
      validators: [
        endDateAfterStartDate,
        constraintViolationValidator(
          () => this.constraints(),
          () => this.publicHolidays(),
          () => this.personalLeaves(),
          () => this.allTrips(),
          () => this.trip()?.id ?? null,
        ),
      ],
    },
  );

  constructor() {
    // Ensure public holidays and personal leaves are available for constraint checking
    this.store.dispatch(SettingsActions.loadPublicHolidays());
    this.store.dispatch(PersonalLeaveActions.loadPersonalLeaves());

    effect(() => {
      const t = this.trip();
      const d = this.defaultDate();
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

    // React to save (create/update) completion via store status
    effect(() => {
      const cs = this.createStatus();
      if (this.saveOp === 'create') {
        if (cs === 'success') { this.saveOp = null; this.saved.emit(); }
        else if (cs === 'failure') { this.saveOp = null; }
      }
    });
    effect(() => {
      const us = this.updateStatus();
      if (this.saveOp === 'update') {
        if (us === 'success') { this.saveOp = null; this.saved.emit(); }
        else if (us === 'failure') { this.saveOp = null; }
      }
    });
  }

  ngAfterViewInit(): void {
    this.dialogEl().nativeElement.showModal();
  }

  get isEditMode(): boolean {
    return this.trip() !== null;
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

    const trip = this.trip();
    if (trip) {
      this.saveOp = 'update';
      this.store.dispatch(TripActions.updateTrip({ id: trip.id, request }));
    } else {
      this.saveOp = 'create';
      this.store.dispatch(TripActions.createTrip({ request }));
    }
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }
}
