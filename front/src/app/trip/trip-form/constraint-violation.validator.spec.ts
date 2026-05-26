import { FormBuilder } from '@angular/forms';
import { DayOfWeek, TravelConstraints, PublicHoliday } from '../../constraints/constraints.model';
import { PersonalLeave, LeaveType } from '../../personal-leave/personal-leave.model';
import { Trip, TripStatus } from '../trip.model';
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
  publicHolidays: PublicHoliday[] = [],
  personalLeaves: PersonalLeave[] = [],
  existingTrips: Trip[] = [],
  currentTripId: string | null = null,
) {
  const fb = new FormBuilder();
  return fb.group(
    { startDate: [startDate], endDate: [endDate] },
    {
      validators: constraintViolationValidator(
        () => constraints,
        () => publicHolidays,
        () => personalLeaves,
        () => existingTrips,
        () => currentTripId,
      ),
    },
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

  describe('when a day in range violates flexible constraints (allowedDaysOfWeek)', () => {
    it('should return constraintWarning with allowedDaysOfWeek reason', () => {
      // 2026-08-03 is a Monday — only allow Tuesday
      const constraints = makeConstraints({
        allowedDaysOfWeek: [DayOfWeek.Tuesday],
        isStrict: false,
      });
      const group = makeGroup('2026-08-03', '2026-08-03', constraints);
      expect(group.hasError('constraintWarning')).toBe(true);
      expect(group.hasError('constraintError')).toBe(false);
      expect(group.getError('constraintWarning').reasons).toContain('allowedDaysOfWeek');
    });
  });

  describe('when a day in range violates strict constraints (allowedDaysOfWeek)', () => {
    it('should return constraintError with allowedDaysOfWeek reason', () => {
      // 2026-08-03 is a Monday — only allow Tuesday, strict mode
      const constraints = makeConstraints({
        allowedDaysOfWeek: [DayOfWeek.Tuesday],
        isStrict: true,
      });
      const group = makeGroup('2026-08-03', '2026-08-03', constraints);
      expect(group.hasError('constraintError')).toBe(true);
      expect(group.hasError('constraintWarning')).toBe(false);
      expect(group.getError('constraintError').reasons).toContain('allowedDaysOfWeek');
    });
  });

  describe('when a multi-day range spans an excluded day', () => {
    it('should detect the violation on any day in the range', () => {
      // Range: Monday–Friday. Only Mon/Tue/Wed/Thu allowed → Friday violation
      const constraints = makeConstraints({
        allowedDaysOfWeek: [DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday],
        isStrict: false,
      });
      const group = makeGroup('2026-08-03', '2026-08-07', constraints);
      expect(group.hasError('constraintWarning')).toBe(true);
    });
  });

  describe('public holiday constraint', () => {
    const holiday: PublicHoliday = { id: 'h1', date: '2026-08-05', name: 'Test Holiday', region: 'test' };

    it('should return null when considerPublicHolidays is false', () => {
      const constraints = makeConstraints({ considerPublicHolidays: false });
      const group = makeGroup('2026-08-03', '2026-08-07', constraints, [holiday]);
      expect(group.errors).toBeNull();
    });

    it('should return constraintWarning when trip overlaps a public holiday (flexible)', () => {
      const constraints = makeConstraints({ considerPublicHolidays: true, isStrict: false });
      const group = makeGroup('2026-08-03', '2026-08-07', constraints, [holiday]);
      expect(group.hasError('constraintWarning')).toBe(true);
      expect(group.getError('constraintWarning').reasons).toContain('publicHoliday');
    });

    it('should return constraintError when trip overlaps a public holiday (strict)', () => {
      const constraints = makeConstraints({ considerPublicHolidays: true, isStrict: true });
      const group = makeGroup('2026-08-03', '2026-08-07', constraints, [holiday]);
      expect(group.hasError('constraintError')).toBe(true);
      expect(group.getError('constraintError').reasons).toContain('publicHoliday');
    });

    it('should return null when trip does not overlap any public holiday', () => {
      const constraints = makeConstraints({ considerPublicHolidays: true });
      const group = makeGroup('2026-08-10', '2026-08-12', constraints, [holiday]);
      expect(group.errors).toBeNull();
    });
  });

  describe('personal leave constraint', () => {
    const leave: PersonalLeave = {
      id: 'l1',
      startDate: '2026-08-10',
      endDate: '2026-08-14',
      type: LeaveType.Annual,
      label: 'Summer leave',
    };

    it('should return null when considerVacationDays is false', () => {
      const constraints = makeConstraints({ considerVacationDays: false });
      const group = makeGroup('2026-08-10', '2026-08-12', constraints, [], [leave]);
      expect(group.errors).toBeNull();
    });

    it('should return constraintWarning when trip overlaps a personal leave (flexible)', () => {
      const constraints = makeConstraints({ considerVacationDays: true, isStrict: false });
      const group = makeGroup('2026-08-10', '2026-08-12', constraints, [], [leave]);
      expect(group.hasError('constraintWarning')).toBe(true);
      expect(group.getError('constraintWarning').reasons).toContain('personalLeave');
    });

    it('should return constraintError when trip overlaps a personal leave (strict)', () => {
      const constraints = makeConstraints({ considerVacationDays: true, isStrict: true });
      const group = makeGroup('2026-08-10', '2026-08-12', constraints, [], [leave]);
      expect(group.hasError('constraintError')).toBe(true);
      expect(group.getError('constraintError').reasons).toContain('personalLeave');
    });

    it('should return null when trip does not overlap any personal leave', () => {
      const constraints = makeConstraints({ considerVacationDays: true });
      const group = makeGroup('2026-08-01', '2026-08-05', constraints, [], [leave]);
      expect(group.errors).toBeNull();
    });
  });

  describe('maxDaysPerMonth constraint', () => {
    const existingTrip: Trip = {
      id: 'trip1',
      destination: 'Lyon',
      startDate: '2026-08-01',
      endDate: '2026-08-08', // 8 days in August
      status: TripStatus.Planned,
    };

    it('should return null when maxDaysPerMonth is null', () => {
      const constraints = makeConstraints({ maxDaysPerMonth: null });
      const group = makeGroup('2026-08-10', '2026-08-15', constraints, [], [], [existingTrip]);
      expect(group.errors).toBeNull();
    });

    it('should return constraintWarning when adding new trip would exceed monthly limit (flexible)', () => {
      // existing trip uses 8 days; limit is 10; new trip adds 5 → 13 > 10
      const constraints = makeConstraints({ maxDaysPerMonth: 10, isStrict: false });
      const group = makeGroup('2026-08-10', '2026-08-14', constraints, [], [], [existingTrip]);
      expect(group.hasError('constraintWarning')).toBe(true);
      expect(group.getError('constraintWarning').reasons).toContain('maxDaysPerMonth');
    });

    it('should return constraintError when adding new trip would exceed monthly limit (strict)', () => {
      const constraints = makeConstraints({ maxDaysPerMonth: 10, isStrict: true });
      const group = makeGroup('2026-08-10', '2026-08-14', constraints, [], [], [existingTrip]);
      expect(group.hasError('constraintError')).toBe(true);
      expect(group.getError('constraintError').reasons).toContain('maxDaysPerMonth');
    });

    it('should return null when new trip stays within the monthly limit', () => {
      // existing trip uses 8 days; limit is 10; new trip adds 2 → 10 = 10 (not exceeded)
      const constraints = makeConstraints({ maxDaysPerMonth: 10 });
      const group = makeGroup('2026-08-10', '2026-08-11', constraints, [], [], [existingTrip]);
      expect(group.errors).toBeNull();
    });

    it('should exclude cancelled trips from the count', () => {
      const cancelledTrip: Trip = { ...existingTrip, id: 'trip-cancelled', status: TripStatus.Cancelled };
      const constraints = makeConstraints({ maxDaysPerMonth: 5 });
      // If cancelled trips are excluded, no existing days → 3 new days ≤ 5 → no violation
      const group = makeGroup('2026-08-10', '2026-08-12', constraints, [], [], [cancelledTrip]);
      expect(group.errors).toBeNull();
    });

    it('should exclude the current trip being edited from the count', () => {
      // existingTrip already uses 8 days; limit is 10; we are editing existingTrip to new dates
      // The old dates should not count → only the new 3 days count
      const constraints = makeConstraints({ maxDaysPerMonth: 10 });
      const fb = new FormBuilder();
      const group = fb.group(
        { startDate: ['2026-08-10'], endDate: ['2026-08-12'] },
        {
          validators: constraintViolationValidator(
            () => constraints,
            () => [],
            () => [],
            () => [existingTrip],
            () => existingTrip.id, // editing the same trip
          ),
        },
      );
      expect(group.errors).toBeNull();
    });
  });

  describe('multiple violations', () => {
    it('should report multiple reasons when several constraints are violated', () => {
      const holiday: PublicHoliday = { id: 'h1', date: '2026-08-03', name: 'Holiday', region: 'test' };
      const constraints = makeConstraints({
        allowedDaysOfWeek: [DayOfWeek.Tuesday], // Monday violation on 2026-08-03
        considerPublicHolidays: true,
        isStrict: false,
      });
      const group = makeGroup('2026-08-03', '2026-08-03', constraints, [holiday]);
      const reasons = group.getError('constraintWarning').reasons as string[];
      expect(reasons).toContain('allowedDaysOfWeek');
      expect(reasons).toContain('publicHoliday');
    });
  });
});

