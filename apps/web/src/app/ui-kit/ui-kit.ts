import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  Badge,
  Button,
  EmptyState,
  Input,
  Select,
  type SelectOption,
  Textarea,
} from '../shared/ui';

@Component({
  selector: 'app-ui-kit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Badge, Button, EmptyState, Input, Select, Textarea],
  styles: `
    :host {
      display: block;
    }
    .page {
      margin: auto;
      max-width: 52rem;
      padding: var(--moon-space-6) var(--moon-space-4);
    }
    h1 {
      font: var(--moon-font-display);
      font-size: clamp(2rem, 7vw, 4rem);
      margin: 0;
    }
    .grid {
      display: grid;
      gap: var(--moon-space-4);
      grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
      margin-top: var(--moon-space-6);
    }
    section {
      background: var(--moon-surface);
      border: 1px solid var(--moon-border);
      border-radius: var(--moon-radius-lg);
      display: grid;
      gap: var(--moon-space-3);
      padding: var(--moon-space-4);
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: var(--moon-space-2);
    }
  `,
  template: `<main class="page">
    <p><img src="/moon_logo.png" alt="Moon" width="48" height="48" /> UI</p>
    <h1>Componentes reutilizables</h1>
    <div class="grid">
      <section>
        <h2>Acciones</h2>
        <div class="row">
          <moon-button>Principal</moon-button
          ><moon-button variant="secondary">Secundario</moon-button>
        </div>
        <div class="row">
          <moon-badge tone="brand">Marca</moon-badge><moon-badge tone="success">Éxito</moon-badge>
        </div>
      </section>
      <section>
        <h2>Formulario</h2>
        <moon-input label="Correo" type="email" [formControl]="email" /><moon-select
          label="Plan"
          [options]="options"
          [formControl]="plan"
        /><moon-textarea label="Mensaje" [formControl]="message" />
      </section>
      <moon-empty-state
        title="Sin planes todavía"
        description="Este es el estado vacío reutilizable."
        icon="☾"
        ><moon-button moonEmptyAction>Explorar</moon-button></moon-empty-state
      >
    </div>
  </main>`,
})
export class UiKit {
  readonly email = new FormControl('', { nonNullable: true });
  readonly plan = new FormControl('', { nonNullable: true });
  readonly message = new FormControl('', { nonNullable: true });
  readonly options: readonly SelectOption[] = [{ value: 'cafe', label: 'Café y conversación' }];
}
