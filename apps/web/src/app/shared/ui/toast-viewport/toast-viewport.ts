import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService, type ToastTone } from '../toast/toast';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'moon-toast-viewport',
  styleUrl: './toast-viewport.scss',
  templateUrl: './toast-viewport.html',
})
export class ToastViewport {
  protected readonly toastService = inject(ToastService);
  protected icon(tone: ToastTone): string {
    return tone === 'success' ? 'check_circle' : tone === 'error' ? 'error' : 'info';
  }
}
