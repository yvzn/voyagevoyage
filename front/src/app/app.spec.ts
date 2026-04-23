import { TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App, RouterModule.forRoot([]), TranslateModule.forRoot()],
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
});
