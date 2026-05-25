import { TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { PersonalLeaveFormComponent } from './personal-leave-form';
import { PersonalLeave, LeaveType } from '../personal-leave.model';
import { ApiStatus } from '../store/personal-leave.reducer';
import {
  selectPersonalLeavesCreateStatus,
  selectPersonalLeavesUpdateStatus,
} from '../store/personal-leave.selectors';

const EN_TRANSLATIONS = {
  personalLeaveForm: {
    createTitle: 'New leave period',
    editTitle: 'Edit leave period',
    startDate: 'Start date',
    startDateRequired: 'Start date is required.',
    endDate: 'End date',
    endDateRequired: 'End date is required.',
    endBeforeStart: 'End date must be on or after the start date.',
    type: 'Leave type',
    label: 'Label',
    save: 'Save',
    saving: 'Saving…',
    cancel: 'Cancel',
    saveError: 'An error occurred while saving the leave period. Please try again.',
  },
  leaveType: {
    annual: 'Annual leave',
    sick: 'Sick leave',
    other: 'Other',
  },
};

// JSDOM does not implement HTMLDialogElement.showModal(); stub it globally
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = () => {};
});

async function setupModule(): Promise<MockStore> {
  await TestBed.configureTestingModule({
    imports: [PersonalLeaveFormComponent, TranslateModule.forRoot()],
    providers: [
      provideMockStore({
        selectors: [
          { selector: selectPersonalLeavesCreateStatus, value: 'idle' as ApiStatus },
          { selector: selectPersonalLeavesUpdateStatus, value: 'idle' as ApiStatus },
        ],
      }),
    ],
  }).compileComponents();

  const translate = TestBed.inject(TranslateService);
  translate.setTranslation('en', EN_TRANSLATIONS);
  translate.use('en');

  return TestBed.inject(MockStore);
}

describe('PersonalLeaveFormComponent — display', () => {
  beforeEach(async () => {
    await setupModule();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PersonalLeaveFormComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show create title when no leave is set', async () => {
    const fixture = TestBed.createComponent(PersonalLeaveFormComponent);
    fixture.componentRef.setInput('leave', null);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const title = compiled.querySelector('h3');
    expect(title?.textContent?.trim()).toBe('New leave period');
  });

  it('should show edit title when a leave is set', async () => {
    const leave: PersonalLeave = {
      id: 'leave-1',
      startDate: '2026-06-01',
      endDate: '2026-06-05',
      type: LeaveType.Annual,
      label: 'Summer vacation',
    };

    const fixture = TestBed.createComponent(PersonalLeaveFormComponent);
    fixture.componentRef.setInput('leave', leave);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const title = compiled.querySelector('h3');
    expect(title?.textContent?.trim()).toBe('Edit leave period');
  });

  it('should pre-fill fields with leave values in edit mode', async () => {
    const leave: PersonalLeave = {
      id: 'leave-1',
      startDate: '2026-07-10',
      endDate: '2026-07-15',
      type: LeaveType.Sick,
      label: 'Medical appointment',
    };

    const fixture = TestBed.createComponent(PersonalLeaveFormComponent);
    fixture.componentRef.setInput('leave', leave);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    expect(component['form'].get('startDate')?.value).toBe('2026-07-10');
    expect(component['form'].get('endDate')?.value).toBe('2026-07-15');
    expect(component['form'].get('type')?.value).toBe(LeaveType.Sick);
    expect(component['form'].get('label')?.value).toBe('Medical appointment');
  });

  it('should pre-fill start and end date from defaultDate in create mode', async () => {
    const fixture = TestBed.createComponent(PersonalLeaveFormComponent);
    fixture.componentRef.setInput('leave', null);
    fixture.componentRef.setInput('defaultDate', '2026-10-15');
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    expect(component['form'].get('startDate')?.value).toBe('2026-10-15');
    expect(component['form'].get('endDate')?.value).toBe('2026-10-15');
  });

  it('should emit cancelled when cancel button is clicked', async () => {
    const fixture = TestBed.createComponent(PersonalLeaveFormComponent);
    fixture.componentRef.setInput('leave', null);
    fixture.detectChanges();
    await fixture.whenStable();

    let cancelled = false;
    fixture.componentInstance.cancelled.subscribe(() => (cancelled = true));

    const compiled = fixture.nativeElement as HTMLElement;
    const cancelBtn = Array.from(compiled.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Cancel',
    );
    (cancelBtn as HTMLButtonElement).click();

    expect(cancelled).toBe(true);
  });
});

describe('PersonalLeaveFormComponent — validation', () => {
  beforeEach(async () => {
    await setupModule();
  });

  it('should be invalid when start date is empty', () => {
    const fixture = TestBed.createComponent(PersonalLeaveFormComponent);
    fixture.componentRef.setInput('leave', null);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component['form'].setValue({
      startDate: '',
      endDate: '2026-08-03',
      type: LeaveType.Annual,
      label: '',
    });

    expect(component['form'].invalid).toBe(true);
    expect(component['form'].get('startDate')?.hasError('required')).toBe(true);
  });

  it('should be invalid when end date is empty', () => {
    const fixture = TestBed.createComponent(PersonalLeaveFormComponent);
    fixture.componentRef.setInput('leave', null);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component['form'].setValue({
      startDate: '2026-08-01',
      endDate: '',
      type: LeaveType.Annual,
      label: '',
    });

    expect(component['form'].invalid).toBe(true);
    expect(component['form'].get('endDate')?.hasError('required')).toBe(true);
  });

  it('should be invalid when end date is before start date', () => {
    const fixture = TestBed.createComponent(PersonalLeaveFormComponent);
    fixture.componentRef.setInput('leave', null);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component['form'].setValue({
      startDate: '2026-08-05',
      endDate: '2026-08-03',
      type: LeaveType.Annual,
      label: '',
    });

    expect(component['form'].hasError('endBeforeStart')).toBe(true);
  });

  it('should sync end date to start date when end date is empty', async () => {
    const fixture = TestBed.createComponent(PersonalLeaveFormComponent);
    fixture.componentRef.setInput('leave', null);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    component['form'].setValue({
      startDate: '2026-08-01',
      endDate: '',
      type: LeaveType.Annual,
      label: '',
    });

    // Change start date
    component['form'].get('startDate')?.setValue('2026-08-05');
    await fixture.whenStable();

    // End date should sync to the new start date
    expect(component['form'].get('endDate')?.value).toBe('2026-08-05');
  });

  it('should sync end date to start date when end date is before start date', async () => {
    const fixture = TestBed.createComponent(PersonalLeaveFormComponent);
    fixture.componentRef.setInput('leave', null);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    component['form'].setValue({
      startDate: '2026-08-01',
      endDate: '2026-08-03',
      type: LeaveType.Annual,
      label: '',
    });

    // Change start date to after end date
    component['form'].get('startDate')?.setValue('2026-08-10');
    await fixture.whenStable();

    // End date should sync to the new start date
    expect(component['form'].get('endDate')?.value).toBe('2026-08-10');
  });

  it('should not sync end date when end date is after start date', async () => {
    const fixture = TestBed.createComponent(PersonalLeaveFormComponent);
    fixture.componentRef.setInput('leave', null);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    component['form'].setValue({
      startDate: '2026-08-01',
      endDate: '2026-08-05',
      type: LeaveType.Annual,
      label: '',
    });

    // Change start date to before end date
    component['form'].get('startDate')?.setValue('2026-07-30');
    await fixture.whenStable();

    // End date should remain unchanged
    expect(component['form'].get('endDate')?.value).toBe('2026-08-05');
  });
});

describe('PersonalLeaveFormComponent — create operation', () => {
  const createdLeave: PersonalLeave = {
    id: 'new-1',
    startDate: '2026-08-01',
    endDate: '2026-08-05',
    type: LeaveType.Annual,
    label: 'Summer vacation',
  };
  let store: MockStore;

  beforeEach(async () => {
    store = await setupModule();
  });

  it('should dispatch createPersonalLeave and emit saved on success action', () => {
    const fixture = TestBed.createComponent(PersonalLeaveFormComponent);
    fixture.componentRef.setInput('leave', null);
    fixture.detectChanges();

    let saved = false;
    fixture.componentInstance.saved.subscribe(() => (saved = true));

    const component = fixture.componentInstance;
    component['form'].setValue({
      startDate: '2026-08-01',
      endDate: '2026-08-05',
      type: LeaveType.Annual,
      label: 'Summer vacation',
    });
    component['onSubmit']();

    store.overrideSelector(selectPersonalLeavesCreateStatus, 'success');
    store.refreshState();
    TestBed.flushEffects();

    expect(saved).toBe(true);
  });
});

describe('PersonalLeaveFormComponent — update operation', () => {
  const leave: PersonalLeave = {
    id: 'leave-1',
    startDate: '2026-06-01',
    endDate: '2026-06-05',
    type: LeaveType.Annual,
    label: 'Summer vacation',
  };
  let store: MockStore;

  beforeEach(async () => {
    store = await setupModule();
  });

  it('should dispatch updatePersonalLeave and emit saved on success action', () => {
    const fixture = TestBed.createComponent(PersonalLeaveFormComponent);
    fixture.componentRef.setInput('leave', leave);
    fixture.detectChanges();

    let saved = false;
    fixture.componentInstance.saved.subscribe(() => (saved = true));

    fixture.componentInstance['onSubmit']();

    store.overrideSelector(selectPersonalLeavesUpdateStatus, 'success');
    store.refreshState();
    TestBed.flushEffects();

    expect(saved).toBe(true);
  });
});

describe('PersonalLeaveFormComponent — error handling', () => {
  let store: MockStore;

  beforeEach(async () => {
    store = await setupModule();
  });

  it('should show error message on save failure action', () => {
    const fixture = TestBed.createComponent(PersonalLeaveFormComponent);
    fixture.componentRef.setInput('leave', null);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component['form'].setValue({
      startDate: '2026-08-01',
      endDate: '2026-08-05',
      type: LeaveType.Annual,
      label: 'Summer vacation',
    });
    component['onSubmit']();

    store.overrideSelector(selectPersonalLeavesCreateStatus, 'failure');
    store.refreshState();

    expect(component['errorKey']()).toBe('personalLeaveForm.saveError');
  });
});
