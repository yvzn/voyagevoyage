import { TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { CalendarComponent } from './calendar';

describe('CalendarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarComponent],
      providers: [{ provide: LOCALE_ID, useValue: 'fr' }],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should display a calendar grid', async () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const table = compiled.querySelector('table');
    expect(table).toBeTruthy();
  });

  it('should display day of week headers', async () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const headers = compiled.querySelectorAll('th');
    expect(headers.length).toBe(7);
  });

  it('should display calendar weeks with days', async () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const rows = compiled.querySelectorAll('tbody tr');
    expect(rows.length).toBeGreaterThanOrEqual(4);
    expect(rows.length).toBeLessThanOrEqual(6);

    const firstRowCells = rows[0].querySelectorAll('td');
    expect(firstRowCells.length).toBe(7);
  });

  it('should have a previous month button', async () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const prevButton = compiled.querySelector('button[aria-label="Previous month"]');
    expect(prevButton).toBeTruthy();
  });

  it('should have a next month button', async () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const nextButton = compiled.querySelector('button[aria-label="Next month"]');
    expect(nextButton).toBeTruthy();
  });

  it('should have a today button', async () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const todayButton = compiled.querySelector('button');
    const buttons = Array.from(compiled.querySelectorAll('button'));
    const todayBtn = buttons.find((b) => b.textContent?.trim() === 'Today');
    expect(todayBtn).toBeTruthy();
  });

  it('should have month and year selectors', async () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const monthSelect = compiled.querySelector('#month-select') as HTMLSelectElement;
    const yearSelect = compiled.querySelector('#year-select') as HTMLSelectElement;
    expect(monthSelect).toBeTruthy();
    expect(yearSelect).toBeTruthy();
    expect(monthSelect.options.length).toBe(12);
    expect(yearSelect.options.length).toBe(11);
  });

  it('should navigate to previous month when clicking previous button', async () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    const initialMonth = component['currentMonth']();
    const initialYear = component['currentYear']();

    component.goToPreviousMonth();
    fixture.detectChanges();

    if (initialMonth === 0) {
      expect(component['currentMonth']()).toBe(11);
      expect(component['currentYear']()).toBe(initialYear - 1);
    } else {
      expect(component['currentMonth']()).toBe(initialMonth - 1);
      expect(component['currentYear']()).toBe(initialYear);
    }
  });

  it('should navigate to next month when clicking next button', async () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    const initialMonth = component['currentMonth']();
    const initialYear = component['currentYear']();

    component.goToNextMonth();
    fixture.detectChanges();

    if (initialMonth === 11) {
      expect(component['currentMonth']()).toBe(0);
      expect(component['currentYear']()).toBe(initialYear + 1);
    } else {
      expect(component['currentMonth']()).toBe(initialMonth + 1);
      expect(component['currentYear']()).toBe(initialYear);
    }
  });

  it('should navigate to today when clicking today button', async () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    // Navigate away first
    component.goToNextMonth();
    component.goToNextMonth();
    fixture.detectChanges();

    // Click today
    component.goToToday();
    fixture.detectChanges();

    const today = new Date();
    expect(component['currentMonth']()).toBe(today.getMonth());
    expect(component['currentYear']()).toBe(today.getFullYear());
  });

  it('should handle December to January transition correctly', () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component['currentMonth'].set(11);
    component['currentYear'].set(2025);
    fixture.detectChanges();

    component.goToNextMonth();
    fixture.detectChanges();

    expect(component['currentMonth']()).toBe(0);
    expect(component['currentYear']()).toBe(2026);
  });

  it('should handle January to December transition correctly', () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component['currentMonth'].set(0);
    component['currentYear'].set(2026);
    fixture.detectChanges();

    component.goToPreviousMonth();
    fixture.detectChanges();

    expect(component['currentMonth']()).toBe(11);
    expect(component['currentYear']()).toBe(2025);
  });

  it('should have accessible section with heading', async () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const section = compiled.querySelector('section');
    expect(section).toBeTruthy();
    expect(section?.getAttribute('aria-labelledby')).toBe('calendar-heading');

    const heading = compiled.querySelector('#calendar-heading');
    expect(heading).toBeTruthy();
  });

  it('should have accessible navigation with aria-label', async () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const nav = compiled.querySelector('nav');
    expect(nav).toBeTruthy();
    expect(nav?.getAttribute('aria-label')).toBeTruthy();
  });

  it('should have labeled select elements', async () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const monthLabel = compiled.querySelector('label[for="month-select"]');
    const yearLabel = compiled.querySelector('label[for="year-select"]');
    expect(monthLabel).toBeTruthy();
    expect(yearLabel).toBeTruthy();
  });
});
