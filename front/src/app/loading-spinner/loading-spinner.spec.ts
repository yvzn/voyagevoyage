import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LoadingSpinnerComponent } from './loading-spinner';

@Component({
  standalone: true,
  imports: [LoadingSpinnerComponent],
  template: '<app-loading-spinner class="h-4 w-4" role="status" aria-label="Loading trips"></app-loading-spinner>',
})
class LoadingSpinnerHostComponent {}

describe('LoadingSpinnerComponent', () => {
  it('renders the branded spinner as a decorative graphic within the caller sizing', async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingSpinnerHostComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(LoadingSpinnerHostComponent);
    fixture.detectChanges();

    const host = fixture.nativeElement.querySelector('app-loading-spinner') as HTMLElement;
    expect(host.classList.contains('h-4')).toBe(true);
    expect(host.classList.contains('w-4')).toBe(true);
    expect(host.getAttribute('role')).toBe('status');
    expect(host.getAttribute('aria-label')).toBe('Loading trips');

    const graphic = host.querySelector('svg');
    expect(graphic?.getAttribute('aria-hidden')).toBe('true');
    expect(graphic?.querySelectorAll('circle')).toHaveLength(3);
  });
});
