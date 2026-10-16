import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type BadgeTone = 'brand' | 'neutral' | 'success' | 'warning' | 'danger';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'moon-badge',
  styles: `
    :host {
      display: inline-flex;
    }
    .badge {
      align-items: center;
      border: 1px solid transparent;
      border-radius: var(--moon-radius-pill);
      display: inline-flex;
      font-size: 0.75rem;
      font-weight: 750;
      gap: 0.35rem;
      line-height: 1;
      min-height: 24px;
      padding: 0 0.55rem;
    }
    .brand {
      background: var(--moon-brand-soft);
      color: var(--moon-ink);
    }
    .neutral {
      background: var(--moon-surface-raised);
      border-color: var(--moon-border);
      color: var(--moon-text-muted);
    }
    .success {
      background: var(--moon-success-soft);
      color: var(--moon-success);
    }
    .warning {
      background: var(--moon-warning-soft);
      color: var(--moon-warning);
    }
    .danger {
      background: var(--moon-danger-soft);
      color: var(--moon-danger);
    }
  `,
  template: `<span class="badge {{ tone() }}"><ng-content /></span>`,
})
export class Badge {
  readonly tone = input<BadgeTone>('neutral');
}
