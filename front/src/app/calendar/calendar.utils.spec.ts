import { getCalendarWeeks, getDayOfWeekNames, getMonthNames, getYearRange } from './calendar.utils';

describe('calendar.utils', () => {
  describe('getCalendarWeeks', () => {
    it('should return weeks for a given month', () => {
      const weeks = getCalendarWeeks(2026, 0); // January 2026
      expect(weeks.length).toBeGreaterThanOrEqual(4);
      expect(weeks.length).toBeLessThanOrEqual(6);
    });

    it('should have 7 days in each week', () => {
      const weeks = getCalendarWeeks(2026, 3); // April 2026
      for (const week of weeks) {
        expect(week.days.length).toBe(7);
      }
    });

    it('should include all days of the month', () => {
      const weeks = getCalendarWeeks(2026, 3); // April 2026 has 30 days
      const currentMonthDays = weeks
        .flatMap((w) => w.days)
        .filter((d) => d.isCurrentMonth)
        .map((d) => d.date);
      expect(currentMonthDays.length).toBe(30);
      expect(currentMonthDays[0]).toBe(1);
      expect(currentMonthDays[currentMonthDays.length - 1]).toBe(30);
    });

    it('should mark leading days as not current month', () => {
      // January 2026 starts on Thursday. Monday-Wednesday should be from December 2025
      const weeks = getCalendarWeeks(2026, 0);
      const firstWeek = weeks[0];
      // First day of Jan 2026 is Thursday (index 3 in ISO week)
      expect(firstWeek.days[0].isCurrentMonth).toBe(false);
      expect(firstWeek.days[1].isCurrentMonth).toBe(false);
      expect(firstWeek.days[2].isCurrentMonth).toBe(false);
      expect(firstWeek.days[3].isCurrentMonth).toBe(true);
      expect(firstWeek.days[3].date).toBe(1);
    });

    it('should mark trailing days as not current month', () => {
      const weeks = getCalendarWeeks(2026, 3); // April 2026 - 30 days
      const lastWeek = weeks[weeks.length - 1];
      const lastCurrentDay = lastWeek.days.findIndex(
        (d) => d.isCurrentMonth && d.date === 30
      );
      if (lastCurrentDay < 6) {
        expect(lastWeek.days[lastCurrentDay + 1].isCurrentMonth).toBe(false);
      }
    });

    it('should handle February correctly', () => {
      const weeks = getCalendarWeeks(2026, 1); // February 2026
      const febDays = weeks.flatMap((w) => w.days).filter((d) => d.isCurrentMonth);
      expect(febDays.length).toBe(28);
    });

    it('should handle leap year February correctly', () => {
      const weeks = getCalendarWeeks(2028, 1); // February 2028 is a leap year
      const febDays = weeks.flatMap((w) => w.days).filter((d) => d.isCurrentMonth);
      expect(febDays.length).toBe(29);
    });

    it('should handle December to January transition (previous month)', () => {
      const weeks = getCalendarWeeks(2026, 0); // January 2026
      const leadingDays = weeks[0].days.filter((d) => !d.isCurrentMonth);
      for (const day of leadingDays) {
        expect(day.month).toBe(11); // December
        expect(day.year).toBe(2025);
      }
    });

    it('should handle December to January transition (next month)', () => {
      const weeks = getCalendarWeeks(2025, 11); // December 2025
      const lastWeek = weeks[weeks.length - 1];
      const trailingDays = lastWeek.days.filter((d) => !d.isCurrentMonth);
      for (const day of trailingDays) {
        expect(day.month).toBe(0); // January
        expect(day.year).toBe(2026);
      }
    });
  });

  describe('getMonthNames', () => {
    it('should return 12 month names', () => {
      const names = getMonthNames('fr');
      expect(names.length).toBe(12);
    });

    it('should return non-empty names', () => {
      const names = getMonthNames('fr');
      for (const name of names) {
        expect(name.length).toBeGreaterThan(0);
      }
    });

    it('should return localized names for French', () => {
      const names = getMonthNames('fr');
      expect(names[0]).toMatch(/janvier/i);
      expect(names[11]).toMatch(/décembre/i);
    });
  });

  describe('getDayOfWeekNames', () => {
    it('should return 7 day names', () => {
      const names = getDayOfWeekNames('fr');
      expect(names.length).toBe(7);
    });

    it('should start with Monday', () => {
      const names = getDayOfWeekNames('en');
      expect(names[0]).toMatch(/Mon/i);
    });

    it('should return non-empty names', () => {
      const names = getDayOfWeekNames('fr');
      for (const name of names) {
        expect(name.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getYearRange', () => {
    it('should return 11 years centered on the current year', () => {
      const years = getYearRange(2026);
      expect(years.length).toBe(11);
      expect(years[0]).toBe(2021);
      expect(years[10]).toBe(2031);
    });

    it('should include the current year', () => {
      const years = getYearRange(2026);
      expect(years).toContain(2026);
    });
  });
});
