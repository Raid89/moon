import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let nextTextareaId = 0;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, multi: true, useExisting: Textarea }],
  selector: 'moon-textarea',
  styleUrl: './textarea.scss',
  templateUrl: './textarea.html',
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
