import { TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './app';

describe('App', () => {
  const originalMatchMedia = window.matchMedia;

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

    await TestBed.configureTestingModule({
      imports: [App, RouterModule.forRoot([])],
      providers: [provideTranslateService()],
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
