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
  styleUrl: './select.scss',
  templateUrl: './select.html',
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
