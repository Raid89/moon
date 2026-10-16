import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let nextTextareaId = 0;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, multi: true, useExisting: Textarea }],
  selector: 'moon-textarea',
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
    textarea {
      background: var(--moon-surface-raised);
      border: 1px solid var(--moon-border);
      border-radius: var(--moon-radius-md);
      box-sizing: border-box;
      color: var(--moon-text);
      font: inherit;
      line-height: 1.5;
      min-height: 112px;
      outline: none;
      padding: var(--moon-space-3);
      resize: vertical;
      transition:
        border-color var(--moon-duration-fast),
        box-shadow var(--moon-duration-fast);
      width: 100%;
    }
    textarea::placeholder {
      color: var(--moon-text-faint);
    }
    textarea:focus {
      border-color: var(--moon-brand);
      box-shadow: 0 0 0 3px var(--moon-focus);
    }
    textarea:disabled {
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
    .has-error textarea {
      border-color: var(--moon-danger);
    }
    @media (prefers-reduced-motion: reduce) {
      textarea {
        transition: none;
      }
    }
  `,
  template: `
    <div class="field" [class.has-error]="error()">
      @if (label()) {
        <label [for]="fieldId()">{{ label() }}</label>
      }
      <textarea
        [attr.aria-describedby]="describedBy()"
        [attr.aria-invalid]="!!error()"
        [disabled]="isDisabled()"
        [id]="fieldId()"
        [name]="name()"
        [placeholder]="placeholder()"
        [rows]="rows()"
        [value]="value()"
        (blur)="markTouched()"
        (input)="updateValue($event)"
      ></textarea>
      @if (error()) {
        <span class="error" [id]="errorId()">{{ error() }}</span>
      } @else if (hint()) {
        <span class="hint" [id]="hintId()">{{ hint() }}</span>
      }
    </div>
  `,
})
export class Textarea implements ControlValueAccessor {
  readonly controlId = input('');
  readonly error = input('');
  readonly hint = input('');
  readonly label = input('');
  readonly name = input('');
  readonly placeholder = input('');
  readonly rows = input(4);

  protected readonly value = signal('');
  protected readonly isDisabled = signal(false);
  private readonly generatedId = `moon-textarea-${nextTextareaId++}`;
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
    const value = (event.target as HTMLTextAreaElement).value;
    this.value.set(value);
    this.onChange(value);
  }
  protected markTouched(): void {
    this.onTouched();
  }
}
