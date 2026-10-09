import { provideMockActions } from '@ngrx/effects/testing';
import { EMPTY } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { vi } from 'vitest';
import { NoTravelDaysPageComponent } from './no-travel-days-page';
import { NoTravelDay } from './no-travel-day.model';
import { NoTravelDayActions } from './store/no-travel-day.actions';
import {
  selectAllNoTravelDays,
  selectNoTravelDayCreateStatus,
  selectNoTravelDayDeleteStatus,
  selectNoTravelDayUpdateStatus,
  selectNoTravelDaysLoadStatus,
} from './store/no-travel-day.reducer';

const sampleDay: NoTravelDay = {
  id: 'meeting',
  startDate: '2026-05-04',
  endDate: '2026-05-04',
  isRecurring: true,
  label: 'Annual meeting',
};

async function setup(): Promise<MockStore> {
  await TestBed.configureTestingModule({
    imports: [NoTravelDaysPageComponent],
    providers: [
      provideTranslateService(),
      provideMockActions(() => EMPTY),
      provideMockStore({
        selectors: [
          { selector: selectAllNoTravelDays, value: [sampleDay] },
          { selector: selectNoTravelDaysLoadStatus, value: 'success' },
          { selector: selectNoTravelDayCreateStatus, value: 'idle' },
          { selector: selectNoTravelDayUpdateStatus, value: 'idle' },
          { selector: selectNoTravelDayDeleteStatus, value: 'idle' },
        ],
      }),
    ],
  }).compileComponents();
  return TestBed.inject(MockStore);
}

describe('NoTravelDaysPageComponent', () => {
  it('dispatches a create request with same-day annual recurrence', async () => {
    const store = await setup();
    const fixture = TestBed.createComponent(NoTravelDaysPageComponent);
    fixture.detectChanges();
    const dispatch = vi.spyOn(store, 'dispatch');
    const component = fixture.componentInstance;
    component.openCreateForm();
    component['form'].patchValue({
      startDate: '2026-05-04',
      endDate: '2026-05-09',
      isRecurring: true,
      label: 'Annual meeting',
    });

    component.onSubmit();

    expect(dispatch).toHaveBeenCalledWith(NoTravelDayActions.createNoTravelDay({
      request: {
        startDate: '2026-05-04',
        endDate: '2026-05-04',
        isRecurring: true,
        label: 'Annual meeting',
      },
    }));
  });

  it('dispatches updates and deletions for existing no-travel periods', async () => {
    const store = await setup();
    const fixture = TestBed.createComponent(NoTravelDaysPageComponent);
    fixture.detectChanges();
    const dispatch = vi.spyOn(store, 'dispatch');
    const component = fixture.componentInstance;
    component.openEditForm(sampleDay);
    component['form'].patchValue({ label: 'Updated meeting' });
    component.onSubmit();
    expect(dispatch).toHaveBeenCalledWith(NoTravelDayActions.updateNoTravelDay({
      id: sampleDay.id,
      request: {
        startDate: sampleDay.startDate,
        endDate: sampleDay.endDate,
        isRecurring: true,
        label: 'Updated meeting',
      },
    }));

    component.requestDelete(sampleDay);
    component.confirmDelete(sampleDay);
    expect(dispatch).toHaveBeenCalledWith(NoTravelDayActions.deleteNoTravelDay({ id: sampleDay.id }));
  });

  it('shows the delete confirmation with the shared alert and button styles', async () => {
    await setup();
    const fixture = TestBed.createComponent(NoTravelDaysPageComponent);
    fixture.detectChanges();
    fixture.componentInstance.requestDelete(sampleDay);
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('[role="alertdialog"]') as HTMLElement;
    const buttons = Array.from(dialog.querySelectorAll('button'));
    expect(dialog.classList.contains('bg-red-50')).toBe(true);
    expect(buttons[0].classList.contains('bg-red-600')).toBe(true);
    expect(buttons[1].classList.contains('border-gray-300')).toBe(true);
  });
});
