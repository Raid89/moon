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
  styleUrl: './input.scss',
  templateUrl: './input.html',
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
