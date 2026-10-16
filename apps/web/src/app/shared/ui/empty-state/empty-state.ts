import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'moon-empty-state',
  styles: `
    :host {
      display: block;
    }
    .empty {
      align-items: center;
      background: var(--moon-surface);
      border: 1px dashed var(--moon-border-strong);
      border-radius: var(--moon-radius-lg);
      display: grid;
      justify-items: center;
      min-height: 230px;
      padding: var(--moon-space-6);
      text-align: center;
    }
    .mark {
      align-items: center;
      background: var(--moon-brand-soft);
      border-radius: 50%;
      color: var(--moon-ink);
      display: grid;
      font-size: 1.5rem;
      height: 52px;
      place-items: center;
      width: 52px;
    }
    h2 {
      font: var(--moon-font-heading);
      font-size: 1.25rem;
      letter-spacing: -0.02em;
      margin: var(--moon-space-3) 0 var(--moon-space-2);
    }
    p {
      color: var(--moon-text-muted);
      margin: 0;
      max-width: 32rem;
    }
    .action {
      margin-top: var(--moon-space-4);
    }
  `,
  template: `
    <section class="empty" [attr.aria-label]="title()">
      <div class="mark" aria-hidden="true">{{ icon() }}</div>
      <div>
        <h2>{{ title() }}</h2>
        <p>{{ description() }}</p>
      </div>
      <div class="action"><ng-content select="[moonEmptyAction]" /></div>
    </section>
  `,
})
export class EmptyState {
  readonly description = input('Prueba cambiar tus filtros o crea algo nuevo para empezar.');
  readonly icon = input('✦');
  readonly title = input('Aún no hay nada por aquí');
}
