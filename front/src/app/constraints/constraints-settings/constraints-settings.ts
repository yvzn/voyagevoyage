import { Component, OnInit, computed, effect, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { DayOfWeek, PUBLIC_HOLIDAY_REGIONS, SCHOOL_HOLIDAY_ZONES, TravelConstraints } from '../constraints.model';
import { SettingsActions } from '../store/settings.actions';
import {
  selectConstraints,
  selectSettingsImportIcsStatus,
  selectSettingsImportPersonalLeaveIcsStatus,
  selectSettingsImportSchoolIcsStatus,
  selectSettingsLoadStatus,
  selectSettingsUpdateStatus,
} from '../store/settings.selectors';

@Component({
  selector: 'app-constraints-settings',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass, TranslatePipe],
  templateUrl: './constraints-settings.html',
})
export class ConstraintsSettingsComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly fb = inject(FormBuilder);

  private readonly storeConstraints = this.store.selectSignal(selectConstraints);
  private readonly loadStatus = this.store.selectSignal(selectSettingsLoadStatus);
  private readonly updateStatus = this.store.selectSignal(selectSettingsUpdateStatus);
  private readonly importIcsStatus = this.store.selectSignal(selectSettingsImportIcsStatus);
  private readonly importSchoolIcsStatus = this.store.selectSignal(selectSettingsImportSchoolIcsStatus);
  private readonly importPersonalLeaveIcsStatus = this.store.selectSignal(selectSettingsImportPersonalLeaveIcsStatus);

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

  protected readonly allRegions = PUBLIC_HOLIDAY_REGIONS;
  protected readonly allZones = SCHOOL_HOLIDAY_ZONES;

  protected readonly isDataLoading = computed(() => this.loadStatus() === 'loading');
  protected readonly isLoading = computed(() => this.updateStatus() === 'loading');
  protected readonly isSaved = computed(() => this.updateStatus() === 'success');
  protected readonly loadErrorKey = computed<string | null>(() =>
    this.loadStatus() === 'failure' ? 'constraints.loadError' : null,
  );
  protected readonly errorKey = computed<string | null>(() =>
    this.updateStatus() === 'failure' ? 'constraints.saveError' : null,
  );
  protected readonly isImportingIcs = computed(() => this.importIcsStatus() === 'loading');
  protected readonly isIcsImported = computed(() => this.importIcsStatus() === 'success');
  protected readonly icsImportErrorKey = computed<string | null>(() =>
    this.importIcsStatus() === 'failure' ? 'constraints.icsImportError' : null,
  );
  protected readonly isImportingSchoolIcs = computed(() => this.importSchoolIcsStatus() === 'loading');
  protected readonly isSchoolIcsImported = computed(() => this.importSchoolIcsStatus() === 'success');
  protected readonly schoolIcsImportErrorKey = computed<string | null>(() =>
    this.importSchoolIcsStatus() === 'failure' ? 'constraints.schoolIcsImportError' : null,
  );
  protected readonly isImportingPersonalLeaveIcs = computed(() => this.importPersonalLeaveIcsStatus() === 'loading');
  protected readonly isPersonalLeaveIcsImported = computed(() => this.importPersonalLeaveIcsStatus() === 'success');
  protected readonly personalLeaveIcsImportErrorKey = computed<string | null>(() =>
    this.importPersonalLeaveIcsStatus() === 'failure' ? 'constraints.personalLeaveIcsImportError' : null,
  );

  protected readonly form = this.fb.group({
    monday: [false],
    tuesday: [false],
    wednesday: [false],
    thursday: [false],
    friday: [false],
    saturday: [false],
    sunday: [false],
    maxDaysPerMonth: [null as number | null, [Validators.min(1), Validators.max(31)]],
    planningHorizonDays: [90, [Validators.required, Validators.min(1), Validators.max(365)]],
    considerPublicHolidays: [false],
    considerVacationDays: [false],
    isStrict: [false],
    // One boolean control per public holiday region
    'region-france-metropole': [false],
    // One boolean control per school holiday zone
    'zone-Zone A': [false],
    'zone-Zone B': [false],
    'zone-Zone C': [false],
  });

  constructor() {
    // Populate the form whenever constraints arrive from a successful load.
    effect(() => {
      if (this.loadStatus() === 'success') {
        const c = this.storeConstraints();
        if (c) {
          this.applyConstraints(c);
        }
      }
    });
  }

  ngOnInit(): void {
    this.store.dispatch(SettingsActions.loadSettings());
  }

  retryLoad(): void {
    this.store.dispatch(SettingsActions.loadSettings());
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
      planningHorizonDays: constraints.planningHorizonDays ?? 90,
      considerPublicHolidays: constraints.considerPublicHolidays,
      considerVacationDays: constraints.considerVacationDays,
      isStrict: constraints.isStrict,
      'region-france-metropole': constraints.publicHolidayRegions?.includes('france-metropole') ?? false,
      'zone-Zone A': constraints.schoolHolidayZones?.includes('Zone A') ?? false,
      'zone-Zone B': constraints.schoolHolidayZones?.includes('Zone B') ?? false,
      'zone-Zone C': constraints.schoolHolidayZones?.includes('Zone C') ?? false,
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

  protected getRegionControlName(region: string): string {
    return `region-${region}`;
  }

  protected getRegionTranslationKey(region: string): string {
    return `constraints.region.${region.replaceAll('-', '.')}`;
  }

  protected getZoneControlName(zone: string): string {
    return `zone-${zone}`;
  }

  protected getZoneTranslationKey(zone: string): string {
    return `constraints.schoolZone.${zone.replace(' ', '').toLowerCase()}`;
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

  private buildPublicHolidayRegions(): string[] {
    const v = this.form.getRawValue();
    const regions: string[] = [];
    if (v['region-france-metropole']) regions.push('france-metropole');
    return regions;
  }

  private buildSchoolHolidayZones(): string[] {
    const v = this.form.getRawValue();
    const zones: string[] = [];
    if (v['zone-Zone A']) zones.push('Zone A');
    if (v['zone-Zone B']) zones.push('Zone B');
    if (v['zone-Zone C']) zones.push('Zone C');
    return zones;
  }

  protected onSubmit(): void {
    if (this.form.invalid || this.isLoading()) return;

    const v = this.form.getRawValue();
    const request = {
      allowedDaysOfWeek: this.buildAllowedDays(),
      maxDaysPerMonth: v.maxDaysPerMonth ?? null,
      planningHorizonDays: v.planningHorizonDays ?? 90,
      considerPublicHolidays: v.considerPublicHolidays ?? false,
      considerVacationDays: v.considerVacationDays ?? false,
      isStrict: v.isStrict ?? false,
      publicHolidayRegions: this.buildPublicHolidayRegions(),
      schoolHolidayZones: this.buildSchoolHolidayZones(),
    };

    this.store.dispatch(SettingsActions.updateSettings({ request }));
  }

  protected onIcsFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.store.dispatch(SettingsActions.importIcs({ file }));

    // Reset the file input so the same file can be re-selected if needed
    input.value = '';
  }

  protected onSchoolIcsFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.store.dispatch(SettingsActions.importSchoolIcs({ file }));

    // Reset the file input so the same file can be re-selected if needed
    input.value = '';
  }

  protected onPersonalLeaveIcsFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.store.dispatch(SettingsActions.importPersonalLeaveIcs({ file }));

    // Reset the file input so the same file can be re-selected if needed
    input.value = '';
  }
}
