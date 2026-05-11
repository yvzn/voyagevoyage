import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { TravelConstraints } from '../../constraints/constraints.model';

/**
 * Cross-field validator that checks whether the selected date range violates the
 * user's travel constraints.
 *
 * - Returns `{ constraintError: true }` when the dates fall outside the allowed
 *   days of the week and the constraints are **strict** (save must be blocked).
 * - Returns `{ constraintWarning: true }` when the constraints are **flexible**
 *   (a warning is shown but the user can still save).
 * - Returns `null` when no constraints are configured, no days are restricted,
 *   or the selected dates are compliant.
 *
 * @param getConstraints A function (e.g. a signal getter) that returns the current
 *   constraints so the validator always reads the latest value.
 */
export function constraintViolationValidator(
  getConstraints: () => TravelConstraints | null,
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const constraints = getConstraints();
    if (!constraints || constraints.allowedDaysOfWeek.length === 0) return null;

    const start = group.get('startDate')?.value as string;
    const end = group.get('endDate')?.value as string;
    if (!start || !end) return null;

    const startDate = new Date(start + 'T00:00:00');
    const endDate = new Date(end + 'T00:00:00');

    const current = new Date(startDate);

    while (current <= endDate) {
      // JS getDay(): 0 = Sunday … 6 = Saturday — matches DayOfWeek enum values
      if (!constraints.allowedDaysOfWeek.includes(current.getDay())) {
        return constraints.isStrict ? { constraintError: true } : { constraintWarning: true };
      }
      current.setDate(current.getDate() + 1);
    }

    return null;
  };
}
