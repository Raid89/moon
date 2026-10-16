import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}
let nextSelectId = 0;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, multi: true, useExisting: Select }],
  selector: 'moon-select',
  styles: `
    :host {
      display: block;
    }
    .field {
      display: grid;
      gap: var(--moon-space-2);
    }
    label {
      color: var(--moon-text);
      font-size: 0.875rem;
      font-weight: 700;
    }
    select {
      appearance: none;
      background: var(--moon-surface-raised)
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%23E7DCCA' stroke-linecap='round' stroke-linejoin='round' stroke-width='2'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E")
        no-repeat right 1rem center;
      border: 1px solid var(--moon-border);
      border-radius: var(--moon-radius-md);
      box-sizing: border-box;
      color: var(--moon-text);
      font: inherit;
      min-height: 48px;
      outline: none;
      padding: 0 2.75rem 0 var(--moon-space-3);
      width: 100%;
    }
    select:focus {
      border-color: var(--moon-brand);
      box-shadow: 0 0 0 3px var(--moon-focus);
    }
    select:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }
    .hint,
    .error {
      font-size: 0.8125rem;
      line-height: 1.4;
    }
    .hint {
      color: var(--moon-text-muted);
    }
    .error {
      color: var(--moon-danger);
    }
    .has-error select {
      border-color: var(--moon-danger);
    }
  `,
  template: `
    <div class="field" [class.has-error]="error()">
      @if (label()) {
        <label [for]="fieldId">{{ label() }}</label>
      }
      <select
        [attr.aria-describedby]="describedBy()"
        [attr.aria-invalid]="!!error()"
        [disabled]="isDisabled()"
        [id]="fieldId"
        [value]="value()"
        (blur)="markTouched()"
        (change)="updateValue($event)"
      >
        @if (placeholder()) {
          <option value="" disabled>{{ placeholder() }}</option>
        }
        @for (option of options(); track option.value) {
          <option [disabled]="option.disabled" [value]="option.value">{{ option.label }}</option>
        }
      </select>
      @if (error()) {
        <span class="error" [id]="errorId">{{ error() }}</span>
      } @else if (hint()) {
        <span class="hint" [id]="hintId">{{ hint() }}</span>
      }
    </div>
  `,
})
export class Select implements ControlValueAccessor {
  readonly error = input('');
  readonly hint = input('');
  readonly label = input('');
  readonly options = input<readonly SelectOption[]>([]);
  readonly placeholder = input('Selecciona una opción');
  protected readonly value = signal('');
  protected readonly isDisabled = signal(false);
  protected readonly fieldId = `moon-select-${nextSelectId++}`;
  protected readonly hintId = `${this.fieldId}-hint`;
  protected readonly errorId = `${this.fieldId}-error`;
  protected readonly describedBy = computed(() =>
    this.error() ? this.errorId : this.hint() ? this.hintId : null,
  );
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.isDisabled.set(disabled);
  }
  protected updateValue(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.value.set(value);
    this.onChange(value);
  }
  protected markTouched(): void {
    this.onTouched();
  }
}
