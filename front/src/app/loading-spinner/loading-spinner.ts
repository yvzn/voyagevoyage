import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <svg class="h-full w-full" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="15" stroke="#BFDBFE" stroke-width="3" />
      <g class="vv-spinner-arc">
        <circle
          cx="20"
          cy="20"
          r="15"
          stroke="currentColor"
          stroke-width="3"
          stroke-dasharray="22 72"
          stroke-linecap="round"
        />
      </g>
      <circle cx="20" cy="20" r="2.5" fill="#16BAC5" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
    }

    svg {
      display: block;
      overflow: visible;
    }

    .vv-spinner-arc {
      transform-box: view-box;
      transform-origin: 20px 20px;
      animation: vv-spinner-rotate 1.4s linear infinite;
    }

    @keyframes vv-spinner-rotate {
      to {
        transform: rotate(360deg);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .vv-spinner-arc {
        animation: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class LoadingSpinnerComponent {}
