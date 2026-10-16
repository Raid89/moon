import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastViewport } from './shared/ui';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, ToastViewport],
  selector: 'app-root',
  styles: `
    :host {
      display: block;
      min-height: 100vh;
    }
  `,
  template: `<router-outlet /><moon-toast-viewport />`,
})
export class App {}
