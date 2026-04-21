import { TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { LOCALE_ID } from '@angular/core';
import { App } from './app';
import { LocaleService } from './locale.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App, RouterModule.forRoot([])],
      providers: [
        { provide: LOCALE_ID, useValue: 'fr' },
        LocaleService,
      ],
    }).compileComponents();
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
    const langBtn = compiled.querySelector('[data-dropdown-toggle="language-dropdown"]');
    expect(langBtn).toBeTruthy();
  });
});
