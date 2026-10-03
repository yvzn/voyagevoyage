import { TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { Component } from '@angular/core';
import { of } from 'rxjs';
import { provideTranslateService } from '@ngx-translate/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Alert, AlertStatus, AlertType } from './alerts/alert.model';
import { AlertsService } from './alerts/alerts.service';
import { App } from './app';
import { TripService } from './trip/trip.service';

@Component({
  standalone: true,
  template: '',
})
class AlertTripTestPage {}

describe('App', () => {
  const originalMatchMedia = window.matchMedia;
  let alertsService: { getAll: ReturnType<typeof vi.fn>; updateStatus: ReturnType<typeof vi.fn> };
  let tripsService: { getAll: ReturnType<typeof vi.fn> };
  const testAlert: Alert = {
    id: 'alert-1',
    tripId: 'trip-1',
    tripStartDate: '2026-04-06',
    tripEndDate: '2026-04-08',
    type: AlertType.MissingBooking,
    description: 'No booking is recorded.',
    status: AlertStatus.New,
  };

  beforeEach(async () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: true,
      media: '(max-width: 767px)',
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }));
    alertsService = {
      getAll: vi.fn().mockReturnValue(of([])),
      updateStatus: vi.fn().mockReturnValue(of({ ...testAlert, status: AlertStatus.Handled })),
    };
    tripsService = {
      getAll: vi.fn().mockReturnValue(of([{
        id: 'trip-1',
        startDate: '2026-04-06',
        endDate: '2026-04-08',
        destination: 'Lyon',
        status: 'confirmed',
      }])),
    };

    await TestBed.configureTestingModule({
      imports: [App, RouterModule.forRoot([{ path: 'trip/:id', component: AlertTripTestPage }])],
      providers: [
        provideTranslateService(),
        { provide: AlertsService, useValue: alertsService },
        { provide: TripService, useValue: tripsService },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    document.body.innerHTML = '';
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the app title as a link', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('a[href="/"]');
    expect(link).toBeTruthy();
    expect(link?.textContent).toContain('Voyage Voyage');
    expect(link?.getAttribute('target')).toBe('_top');
  });

  it('should have a main content area', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('main')).toBeTruthy();
  });

  it('should have a sidebar navigation', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('aside')).toBeTruthy();
  });

  it('should have a language switcher button', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const langBtn = compiled.querySelector('#language-dropdown');
    expect(langBtn).toBeTruthy();
    const toggleBtn = langBtn?.parentElement?.querySelector('button[aria-haspopup]');
    expect(toggleBtn).toBeTruthy();
  });

  it('should not show an alert badge when no unresolved alerts are available', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#alerts-drawer')?.classList.contains('hidden')).toBe(true);
    expect(compiled.querySelector('[aria-controls="alerts-drawer"] span')).toBeNull();
    compiled.querySelector<HTMLButtonElement>('[aria-controls="alerts-drawer"]')?.click();
    fixture.detectChanges();

    expect(compiled.textContent).toContain('alerts.empty');
  });

  it('should open the alert panel, navigate to a trip, and keep the panel open', async () => {
    alertsService.getAll.mockReturnValue(of([testAlert]));
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('[aria-controls="alerts-drawer"]')?.textContent).toContain('1');
    compiled.querySelector<HTMLButtonElement>('[aria-controls="alerts-drawer"]')?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.querySelector('#alerts-heading')).toBeTruthy();
    expect(compiled.textContent).toContain('Lyon');
    const openTripLink = compiled.querySelector<HTMLAnchorElement>('#alerts-drawer a');
    expect(openTripLink?.getAttribute('href')).toBe('/trip/trip-1');
    openTripLink?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.querySelector('#alerts-heading')).toBeTruthy();
    expect(compiled.textContent).toContain('alerts.currentTrip');
    expect(compiled.querySelector('article')?.classList.contains('border-rose-400')).toBe(true);
  });

  it.each([
    [AlertStatus.Handled, 'alerts.handledFeedback'],
    [AlertStatus.Ignored, 'alerts.ignoredFeedback'],
  ])('should update an alert as %s and remove it from unresolved alerts', async (status, feedbackKey) => {
    alertsService.getAll.mockReturnValue(of([testAlert]));
    alertsService.updateStatus.mockReturnValue(of({ ...testAlert, status }));
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    compiled.querySelector<HTMLButtonElement>('[aria-controls="alerts-drawer"]')?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const actionButton = compiled.querySelectorAll<HTMLButtonElement>('#alerts-drawer article button')[
      status === AlertStatus.Handled ? 0 : 1
    ];

    actionButton?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(alertsService.updateStatus).toHaveBeenCalledWith(testAlert.id, status);
    expect(compiled.querySelector('article')).toBeNull();
    expect(compiled.textContent).toContain(feedbackKey);
  });

  it('should have a skip link to main content', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const skipLink = compiled.querySelector('a[href="#main-content"]');
    expect(skipLink).toBeTruthy();
    const main = compiled.querySelector('#main-content');
    expect(main).toBeTruthy();
  });

  it('should close the mobile drawer and remove the backdrop when navigation changes', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    const hideSpy = vi.fn();
    const flowbiteDrawerInstance = { hide: hideSpy };
    (window as Window & { FlowbiteInstances?: { getInstance: ReturnType<typeof vi.fn> } }).FlowbiteInstances = {
      getInstance: vi.fn().mockReturnValue(flowbiteDrawerInstance),
    } as any;

    const drawer = document.getElementById('drawer-navigation') as HTMLElement | null;
    expect(drawer).not.toBeNull();
    drawer?.classList.add('translate-x-0');

    const backdrop = document.createElement('div');
    backdrop.setAttribute('drawer-backdrop', '');
    document.body.appendChild(backdrop);
    document.body.classList.add('overflow-hidden');

    (app as any).closeMobileDrawer();

    expect((window as any).FlowbiteInstances.getInstance).toHaveBeenCalledWith('Drawer', 'drawer-navigation');
    expect(hideSpy).toHaveBeenCalledTimes(1);
    expect(drawer?.classList.contains('translate-x-0')).toBeTruthy();
    expect(document.querySelector('[drawer-backdrop]')?.isConnected).toBe(true);
    expect(document.body.classList.contains('overflow-hidden')).toBeTruthy();
  });

  it('should keep the drawer open on desktop widths', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      media: '(max-width: 767px)',
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    });

    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    const drawer = document.getElementById('drawer-navigation') as HTMLElement | null;

    expect(drawer).not.toBeNull();
    drawer?.classList.add('translate-x-0');

    (app as any).closeMobileDrawer();

    expect(drawer?.classList.contains('translate-x-0')).toBeTruthy();
    expect(document.querySelector('[data-drawer-backdrop]')).toBeNull();
  });
});
