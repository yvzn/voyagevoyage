import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { DayOfWeek, TravelConstraints } from '../constraints.model';
import { SettingsActions } from '../store/settings.actions';
import { selectConstraints } from '../store/settings.selectors';

@Component({
  selector: 'app-constraints-settings',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass, TranslatePipe],
  templateUrl: './constraints-settings.html',
})
export class ConstraintsSettingsComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  private readonly storeConstraints = toSignal(this.store.select(selectConstraints), {
    initialValue: null as TravelConstraints | null,
  });

  protected readonly DayOfWeek = DayOfWeek;
  protected readonly allDays: DayOfWeek[] = [
    DayOfWeek.Monday,
    DayOfWeek.Tuesday,
    DayOfWeek.Wednesday,
    DayOfWeek.Thursday,
    DayOfWeek.Friday,
    DayOfWeek.Saturday,
    DayOfWeek.Sunday,
  ];

  protected readonly isLoading = signal(false);
  protected readonly isSaved = signal(false);
  protected readonly errorKey = signal<string | null>(null);

  protected readonly form = this.fb.group({
    monday: [false],
    tuesday: [false],
    wednesday: [false],
    thursday: [false],
    friday: [false],
    saturday: [false],
    sunday: [false],
    maxDaysPerMonth: [null as number | null, [Validators.min(1), Validators.max(31)]],
    considerPublicHolidays: [false],
    considerVacationDays: [false],
    isStrict: [false],
  });

  ngOnInit(): void {
    this.store.dispatch(SettingsActions.loadSettings());
    const existing = this.storeConstraints();
    if (existing) {
      this.applyConstraints(existing);
    }
  }

  private applyConstraints(constraints: TravelConstraints): void {
    this.form.patchValue({
      monday: constraints.allowedDaysOfWeek.includes(DayOfWeek.Monday),
      tuesday: constraints.allowedDaysOfWeek.includes(DayOfWeek.Tuesday),
      wednesday: constraints.allowedDaysOfWeek.includes(DayOfWeek.Wednesday),
      thursday: constraints.allowedDaysOfWeek.includes(DayOfWeek.Thursday),
      friday: constraints.allowedDaysOfWeek.includes(DayOfWeek.Friday),
      saturday: constraints.allowedDaysOfWeek.includes(DayOfWeek.Saturday),
      sunday: constraints.allowedDaysOfWeek.includes(DayOfWeek.Sunday),
      maxDaysPerMonth: constraints.maxDaysPerMonth ?? null,
      considerPublicHolidays: constraints.considerPublicHolidays,
      considerVacationDays: constraints.considerVacationDays,
      isStrict: constraints.isStrict,
    });
  }

  protected getDayTranslationKey(day: DayOfWeek): string {
    switch (day) {
      case DayOfWeek.Monday:    return 'constraints.monday';
      case DayOfWeek.Tuesday:   return 'constraints.tuesday';
      case DayOfWeek.Wednesday: return 'constraints.wednesday';
      case DayOfWeek.Thursday:  return 'constraints.thursday';
      case DayOfWeek.Friday:    return 'constraints.friday';
      case DayOfWeek.Saturday:  return 'constraints.saturday';
      case DayOfWeek.Sunday:    return 'constraints.sunday';
    }
  }

  protected getDayControlName(day: DayOfWeek): string {
    switch (day) {
      case DayOfWeek.Monday:    return 'monday';
      case DayOfWeek.Tuesday:   return 'tuesday';
      case DayOfWeek.Wednesday: return 'wednesday';
      case DayOfWeek.Thursday:  return 'thursday';
      case DayOfWeek.Friday:    return 'friday';
      case DayOfWeek.Saturday:  return 'saturday';
      case DayOfWeek.Sunday:    return 'sunday';
    }
  }

  private buildAllowedDays(): DayOfWeek[] {
    const v = this.form.getRawValue();
    const days: DayOfWeek[] = [];
    if (v.monday)    days.push(DayOfWeek.Monday);
    if (v.tuesday)   days.push(DayOfWeek.Tuesday);
    if (v.wednesday) days.push(DayOfWeek.Wednesday);
    if (v.thursday)  days.push(DayOfWeek.Thursday);
    if (v.friday)    days.push(DayOfWeek.Friday);
    if (v.saturday)  days.push(DayOfWeek.Saturday);
    if (v.sunday)    days.push(DayOfWeek.Sunday);
    return days;
  }

  protected onSubmit(): void {
    if (this.form.invalid || this.isLoading()) return;

    const v = this.form.getRawValue();
    const request = {
      allowedDaysOfWeek: this.buildAllowedDays(),
      maxDaysPerMonth: v.maxDaysPerMonth ?? null,
      considerPublicHolidays: v.considerPublicHolidays ?? false,
      considerVacationDays: v.considerVacationDays ?? false,
      isStrict: v.isStrict ?? false,
    };

    this.isLoading.set(true);
    this.errorKey.set(null);
    this.isSaved.set(false);

    this.store.dispatch(SettingsActions.updateSettings({ request }));

    this.actions$.pipe(
      ofType(SettingsActions.updateSettingsSuccess, SettingsActions.updateSettingsFailure),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((action) => {
      this.isLoading.set(false);
      if (action.type === SettingsActions.updateSettingsSuccess.type) {
        this.isSaved.set(true);
      } else {
        this.errorKey.set('constraints.saveError');
      }
    });
  }
}
