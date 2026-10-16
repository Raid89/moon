import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let nextInputId = 0;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, multi: true, useExisting: forwardRef(() => Input) }],
  selector: 'moon-input',
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
    input {
      background: var(--moon-surface-raised);
      border: 1px solid var(--moon-border);
      border-radius: var(--moon-radius-md);
      box-sizing: border-box;
      color: var(--moon-text);
      font: inherit;
      min-height: 48px;
      outline: none;
      padding: 0 var(--moon-space-3);
      transition:
        border-color var(--moon-duration-fast),
        box-shadow var(--moon-duration-fast);
      width: 100%;
    }
    input::placeholder {
      color: var(--moon-text-faint);
    }
    input:hover:not(:disabled) {
      border-color: var(--moon-border-strong);
    }
    input:focus {
      border-color: var(--moon-brand);
      box-shadow: 0 0 0 3px var(--moon-focus);
    }
    input:disabled {
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
    .has-error input {
      border-color: var(--moon-danger);
    }
    @media (prefers-reduced-motion: reduce) {
      input {
        transition: none;
      }
    }
  `,
  template: `
    <div class="field" [class.has-error]="error()">
      @if (label()) {
        <label [for]="fieldId()">{{ label() }}</label>
      }
      <input
        [attr.aria-describedby]="describedBy()"
        [attr.aria-invalid]="!!error()"
        [autocomplete]="autocomplete()"
        [disabled]="isDisabled()"
        [id]="fieldId()"
        [inputMode]="inputmode()"
        [maxLength]="maxlength()"
        [name]="name()"
        [placeholder]="placeholder()"
        [type]="type()"
        [value]="value()"
        (blur)="markTouched()"
        (input)="updateValue($event)"
      />
      @if (error()) {
        <span class="error" [id]="errorId()">{{ error() }}</span>
      } @else if (hint()) {
        <span class="hint" [id]="hintId()">{{ hint() }}</span>
      }
    </div>
  `,
})
export class Input implements ControlValueAccessor {
  readonly autocomplete = input('off');
  readonly controlId = input('');
  readonly error = input('');
  readonly hint = input('');
  readonly inputmode = input<'email' | 'numeric' | 'text' | 'tel' | 'url'>('text');
  readonly label = input('');
  readonly maxlength = input<number | null>(100);
  readonly name = input('');
  readonly placeholder = input('');
  readonly type = input<
    'email' | 'password' | 'search' | 'tel' | 'text' | 'url' | 'number' | 'datetime-local'
  >('text');

  protected readonly value = signal('');
  protected readonly isDisabled = signal(false);
  private readonly generatedId = `moon-input-${nextInputId++}`;
  protected readonly fieldId = computed(() => this.controlId() || this.generatedId);
  protected readonly hintId = computed(() => `${this.fieldId()}-hint`);
  protected readonly errorId = computed(() => `${this.fieldId()}-error`);
  protected readonly describedBy = computed(() =>
    this.error() ? this.errorId() : this.hint() ? this.hintId() : null,
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
    const value = (event.target as HTMLInputElement).value;
    this.value.set(value);
    this.onChange(value);
  }

  protected markTouched(): void {
    this.onTouched();
  }
}
