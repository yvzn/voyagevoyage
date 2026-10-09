import { Component, ChangeDetectionStrategy, computed, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NoTravelDay } from './no-travel-day.model';
import { NoTravelDayActions } from './store/no-travel-day.actions';
import {
  selectAllNoTravelDays,
  selectNoTravelDayCreateStatus,
  selectNoTravelDayDeleteStatus,
  selectNoTravelDayUpdateStatus,
  selectNoTravelDaysLoadStatus,
} from './store/no-travel-day.reducer';
import { LocaleService } from '../locale.service';

function endAfterStartValidator(group: AbstractControl): ValidationErrors | null {
  const start = group.get('startDate')?.value as string | null;
  const end = group.get('endDate')?.value as string | null;
  return start && end && end < start ? { endBeforeStart: true } : null;
}

@Component({
  selector: 'app-no-travel-days-page',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './no-travel-days-page.html',
})
export class NoTravelDaysPageComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);
  private readonly fb = inject(FormBuilder);
  protected readonly localeService = inject(LocaleService);

  protected readonly days = this.store.selectSignal(selectAllNoTravelDays);
  private readonly loadStatus = this.store.selectSignal(selectNoTravelDaysLoadStatus);
  private readonly createStatus = this.store.selectSignal(selectNoTravelDayCreateStatus);
  private readonly updateStatus = this.store.selectSignal(selectNoTravelDayUpdateStatus);
  private readonly deleteStatus = this.store.selectSignal(selectNoTravelDayDeleteStatus);

  protected readonly isLoading = computed(() => this.loadStatus() === 'loading');
  protected readonly loadError = computed(() => this.loadStatus() === 'failure');
  protected readonly isSaving = computed(
    () => this.createStatus() === 'loading' || this.updateStatus() === 'loading',
  );
  protected readonly isDeleting = computed(() => this.deleteStatus() === 'loading');
  protected readonly saveError = computed(
    () => this.createStatus() === 'failure' || this.updateStatus() === 'failure',
  );
  protected readonly deleteError = computed(() => this.deleteStatus() === 'failure');
  protected readonly isFormOpen = signal(false);
  protected readonly editingDay = signal<NoTravelDay | null>(null);
  protected readonly deletingDayId = signal<string | null>(null);

  protected readonly form = this.fb.group({
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    isRecurring: [false],
    label: [''],
  }, { validators: endAfterStartValidator });

  constructor() {
    this.form.controls.isRecurring.valueChanges.subscribe((isRecurring) => {
      if (isRecurring) {
        this.form.controls.endDate.setValue(this.form.controls.startDate.value, { emitEvent: false });
      }
    });
    this.form.controls.startDate.valueChanges.subscribe((startDate) => {
      if (this.form.controls.isRecurring.value) {
        this.form.controls.endDate.setValue(startDate, { emitEvent: false });
      }
    });

    this.actions$
      .pipe(
        ofType(NoTravelDayActions.createNoTravelDaySuccess, NoTravelDayActions.updateNoTravelDaySuccess),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.closeForm());

    this.actions$
      .pipe(ofType(NoTravelDayActions.deleteNoTravelDaySuccess), takeUntilDestroyed())
      .subscribe(() => this.deletingDayId.set(null));
  }

  ngOnInit(): void {
    this.store.dispatch(NoTravelDayActions.loadNoTravelDays());
  }

  retryLoad(): void {
    this.store.dispatch(NoTravelDayActions.loadNoTravelDays());
  }

  openCreateForm(): void {
    this.editingDay.set(null);
    this.form.reset({ startDate: '', endDate: '', isRecurring: false, label: '' });
    this.isFormOpen.set(true);
  }

  openEditForm(day: NoTravelDay): void {
    this.editingDay.set(day);
    this.form.reset({
      startDate: day.startDate,
      endDate: day.endDate,
      isRecurring: day.isRecurring,
      label: day.label,
    });
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.editingDay.set(null);
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSaving()) return;
    const value = this.form.getRawValue();
    const request = {
      startDate: value.startDate!,
      endDate: value.isRecurring ? value.startDate! : value.endDate!,
      isRecurring: value.isRecurring ?? false,
      label: value.label ?? '',
    };
    const day = this.editingDay();
    if (day) {
      this.store.dispatch(NoTravelDayActions.updateNoTravelDay({ id: day.id, request }));
    } else {
      this.store.dispatch(NoTravelDayActions.createNoTravelDay({ request }));
    }
  }

  requestDelete(day: NoTravelDay): void {
    this.deletingDayId.set(day.id);
  }

  cancelDelete(): void {
    this.deletingDayId.set(null);
  }

  confirmDelete(day: NoTravelDay): void {
    if (this.isDeleting()) return;
    this.store.dispatch(NoTravelDayActions.deleteNoTravelDay({ id: day.id }));
  }

  formatDate(date: string): string {
    const [year, month, day] = date.split('-').map(Number);
    return new Intl.DateTimeFormat(this.localeService.currentLocale(), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, day)));
  }
}
