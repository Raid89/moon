import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';

let nextDialogId = 0;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'moon-dialog',
  styleUrl: './dialog.scss',
  templateUrl: './dialog.html',
})
export class Dialog {
  readonly description = input('');
  readonly eyebrow = input('Moon');
  readonly open = model(false);
  readonly title = input('');
  readonly closed = output<void>();
  protected readonly titleId = `moon-dialog-${nextDialogId++}`;
  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const element = this.dialog()?.nativeElement;
      if (!element) return;
      if (this.open() && !element.open) element.showModal();
      if (!this.open() && element.open) element.close();
    });
  }

  protected close(): void {
    this.open.set(false);
  }
  protected onCancel(event: Event): void {
    event.preventDefault();
    this.close();
  }
  protected onNativeClose(): void {
    if (this.open()) this.open.set(false);
    this.closed.emit();
  }
  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }
}
