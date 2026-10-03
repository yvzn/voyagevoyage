import { Component, ChangeDetectionStrategy, computed, inject, input, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Trip } from '../trip/trip.model';
import { Expense } from '../expense/expense.model';
import { CalendarDay, CalendarWeek, getTripsPerDay } from './calendar.utils';
import { getTripStatusClass, getTripStatusTranslationKey } from '../trip/trip-status.utils';
import { DayConstraints } from './calendar-constraints.utils';

@Component({
  selector: 'app-calendar-agenda',
  standalone: true,
  imports: [NgClass, RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './calendar-agenda.html',
})
export class CalendarAgendaComponent {
  private readonly translateService = inject(TranslateService);

  readonly weeks = input<CalendarWeek[]>([]);
  readonly trips = input<Trip[]>([]);
  readonly expenses = input<Expense[]>([]);
  readonly constraintsPerDay = input<Map<string, DayConstraints>>(new Map());
  readonly allowedDaysOfWeek = input<number[]>([]);
  readonly dayNames = input<string[]>([]);
  readonly displayMonth = input<string>('');
  readonly displayYear = input<string>('');

  readonly tripClicked = output<Trip>();
  readonly addTripClicked = output<CalendarDay>();

  protected readonly getTripStatusClass = getTripStatusClass;
  protected readonly days = computed(() => this.weeks().flatMap(week => week.days).filter(day => day.isCurrentMonth));
  private readonly tripsPerDay = computed(() => getTripsPerDay(this.trips()));

  protected getTripsForDay(day: CalendarDay): Trip[] {
    return this.tripsPerDay().get(this.dayKey(day)) ?? [];
  }

  protected getTripAriaLabel(trip: Trip): string {
    const statusLabel = this.translateService.instant(getTripStatusTranslationKey(trip.status));
    return `${trip.destination} (${statusLabel})`;
  }

  protected tripHasExpenses(trip: Trip): boolean {
    return this.expenses().some(expense => expense.tripId === trip.id);
  }

  protected getDayName(day: CalendarDay): string {
    return this.dayNames()[(new Date(day.year, day.month, day.date).getDay() + 6) % 7] ?? '';
  }

  protected getConstraintsForDay(day: CalendarDay): DayConstraints {
    return this.constraintsPerDay().get(this.dayKey(day)) ?? { publicHolidays: [], schoolHolidays: [], personalLeaves: [] };
  }

  protected isRestrictedWeekday(day: CalendarDay): boolean {
    const allowed = this.allowedDaysOfWeek();
    return allowed.length > 0 && !allowed.includes(new Date(day.year, day.month, day.date).getDay());
  }

  protected getDayCellClass(day: CalendarDay): string {
    const constraints = this.getConstraintsForDay(day);
    const blocked = this.isRestrictedWeekday(day) || constraints.publicHolidays.length > 0 || constraints.personalLeaves.length > 0;
    return blocked
      ? 'border-gray-200 dark:border-gray-700'
      : 'border-blue-100 dark:border-blue-700/50';
  }

  protected trackByDay(_index: number, day: CalendarDay): string {
    return this.dayKey(day);
  }

  private dayKey(day: CalendarDay): string {
    return `${day.year}-${String(day.month + 1).padStart(2, '0')}-${String(day.date).padStart(2, '0')}`;
  }
}
