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
  styles: `
    dialog {
      background: var(--moon-surface-raised);
      border: 1px solid var(--moon-border-strong);
      border-radius: var(--moon-radius-lg);
      box-shadow: var(--moon-shadow-modal);
      color: var(--moon-text);
      max-width: min(32rem, calc(100vw - 2rem));
      padding: 0;
      width: 100%;
    }
    dialog::backdrop {
      background: var(--moon-overlay);
      backdrop-filter: blur(3px);
    }
    .content {
      padding: var(--moon-space-5);
    }
    .top {
      align-items: start;
      display: flex;
      gap: var(--moon-space-3);
      justify-content: space-between;
    }
    .eyebrow {
      color: var(--moon-brand-soft);
      font-size: 0.8125rem;
      font-weight: 750;
      margin: 0 0 0.35rem;
    }
    .title {
      font: var(--moon-font-heading);
      font-size: 1.45rem;
      letter-spacing: -0.025em;
      margin: 0;
    }
    .description {
      color: var(--moon-text-muted);
      line-height: 1.5;
      margin: var(--moon-space-2) 0 0;
    }
    .close {
      background: transparent;
      border: 0;
      border-radius: 50%;
      color: var(--moon-text-muted);
      cursor: pointer;
      font: inherit;
      font-size: 1.3rem;
      height: 36px;
      line-height: 1;
      margin: -0.45rem;
      width: 36px;
    }
    .close:hover {
      background: var(--moon-surface-hover);
      color: var(--moon-text);
    }
    .close:focus-visible {
      outline: 3px solid var(--moon-focus);
      outline-offset: 2px;
    }
    .body {
      margin-top: var(--moon-space-4);
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--moon-space-2);
      justify-content: flex-end;
      margin-top: var(--moon-space-5);
    }
  `,
  template: `
    <dialog
      #dialog
      [attr.aria-labelledby]="titleId"
      (cancel)="onCancel($event)"
      (click)="onBackdropClick($event)"
      (close)="onNativeClose()"
    >
      <div class="content">
        <div class="top">
          <div>
            <p class="eyebrow">{{ eyebrow() }}</p>
            <h2 class="title" [id]="titleId">{{ title() }}</h2>
          </div>
          <button class="close" type="button" aria-label="Cerrar ventana" (click)="close()">
            ×
          </button>
        </div>
        @if (description()) {
          <p class="description">{{ description() }}</p>
        }
        <div class="body"><ng-content /></div>
        <div class="actions"><ng-content select="[moonDialogActions]" /></div>
      </div>
    </dialog>
  `,
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
