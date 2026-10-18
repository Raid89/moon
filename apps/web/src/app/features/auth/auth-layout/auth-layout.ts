import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-auth-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './auth-layout.scss',
  templateUrl: './auth-layout.html',
})
export class AuthLayout {
  readonly step = input.required<1 | 2 | 3>();
  readonly eyebrow = input.required<string>();
  readonly heading = input.required<string>();
  readonly description = input.required<string>();
  protected readonly steps = ['Tu correo', 'Tu código', 'Tu perfil'];
}
