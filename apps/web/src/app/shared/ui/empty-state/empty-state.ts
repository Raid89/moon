import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'moon-empty-state',
  styleUrl: './empty-state.scss',
  templateUrl: './empty-state.html',
})
export class EmptyState {
  readonly description = input('Prueba cambiar tus filtros o crea algo nuevo para empezar.');
  readonly icon = input('auto_awesome');
  readonly title = input('Aún no hay nada por aquí');
}
