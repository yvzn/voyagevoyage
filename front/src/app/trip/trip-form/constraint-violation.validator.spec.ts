import { FormBuilder } from '@angular/forms';
import { DayOfWeek, TravelConstraints } from '../../constraints/constraints.model';
import { constraintViolationValidator } from './constraint-violation.validator';

function makeConstraints(overrides: Partial<TravelConstraints> = {}): TravelConstraints {
  return {
    allowedDaysOfWeek: [],
    maxDaysPerMonth: null,
    considerPublicHolidays: false,
    considerVacationDays: false,
    isStrict: false,
    planningHorizonDays: 365,
    publicHolidayRegions: [],
    schoolHolidayZones: [],
    ...overrides,
  };
}

function makeGroup(
  startDate: string,
  endDate: string,
  constraints: TravelConstraints | null,
) {
  const fb = new FormBuilder();
  return fb.group(
    { startDate: [startDate], endDate: [endDate] },
    { validators: constraintViolationValidator(() => constraints) },
  );
}

describe('constraintViolationValidator', () => {
  describe('when no constraints configured', () => {
    it('should return null', () => {
      const group = makeGroup('2026-08-01', '2026-08-03', null);
      expect(group.errors).toBeNull();
    });
  });

  describe('when allowedDaysOfWeek is empty', () => {
    it('should return null (all days allowed)', () => {
      const group = makeGroup('2026-08-01', '2026-08-03', makeConstraints({ allowedDaysOfWeek: [] }));
      expect(group.errors).toBeNull();
    });
  });

  describe('when dates are missing', () => {
    it('should return null when startDate is empty', () => {
      const group = makeGroup('', '2026-08-03', makeConstraints({ allowedDaysOfWeek: [DayOfWeek.Monday] }));
      expect(group.errors).toBeNull();
    });

    it('should return null when endDate is empty', () => {
      const group = makeGroup('2026-08-01', '', makeConstraints({ allowedDaysOfWeek: [DayOfWeek.Monday] }));
      expect(group.errors).toBeNull();
    });
  });

  describe('when all days in range are allowed', () => {
    it('should return null', () => {
      // 2026-08-03 is a Monday, 2026-08-04 is a Tuesday
      const constraints = makeConstraints({
        allowedDaysOfWeek: [DayOfWeek.Monday, DayOfWeek.Tuesday],
      });
      const group = makeGroup('2026-08-03', '2026-08-04', constraints);
      expect(group.errors).toBeNull();
    });
  });

  describe('when a day in range violates flexible constraints', () => {
    it('should return constraintWarning', () => {
      // 2026-08-03 is a Monday — only allow Tuesday
      const constraints = makeConstraints({
        allowedDaysOfWeek: [DayOfWeek.Tuesday],
        isStrict: false,
      });
      const group = makeGroup('2026-08-03', '2026-08-03', constraints);
      expect(group.hasError('constraintWarning')).toBe(true);
      expect(group.hasError('constraintError')).toBe(false);
    });
  });

  describe('when a day in range violates strict constraints', () => {
    it('should return constraintError', () => {
      // 2026-08-03 is a Monday — only allow Tuesday, strict mode
      const constraints = makeConstraints({
        allowedDaysOfWeek: [DayOfWeek.Tuesday],
        isStrict: true,
      });
      const group = makeGroup('2026-08-03', '2026-08-03', constraints);
      expect(group.hasError('constraintError')).toBe(true);
      expect(group.hasError('constraintWarning')).toBe(false);
    });
  });

  describe('when a multi-day range spans an excluded day', () => {
    it('should detect the violation on any day in the range', () => {
      // Range: Monday–Friday. Only Mon/Tue/Wed/Thu allowed → Friday (6 = Saturday? No, let me think)
      // 2026-08-03 = Monday, 2026-08-07 = Friday
      // Allow Mon, Tue, Wed, Thu but NOT Friday
      const constraints = makeConstraints({
        allowedDaysOfWeek: [DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday],
        isStrict: false,
      });
      const group = makeGroup('2026-08-03', '2026-08-07', constraints);
      expect(group.hasError('constraintWarning')).toBe(true);
    });
  });
});
