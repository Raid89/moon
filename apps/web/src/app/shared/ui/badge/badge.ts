import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type BadgeTone = 'brand' | 'neutral' | 'success' | 'warning' | 'danger';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'moon-badge',
  styleUrl: './badge.scss',
  templateUrl: './badge.html',
})
export class Badge {
  readonly tone = input<BadgeTone>('neutral');
}
