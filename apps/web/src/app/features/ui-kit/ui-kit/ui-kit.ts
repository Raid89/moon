import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  Badge,
  Button,
  EmptyState,
  Input,
  Select,
  type SelectOption,
  Textarea,
} from '../../../shared/ui';

@Component({
  selector: 'app-ui-kit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Badge, Button, EmptyState, Input, Select, Textarea],
  styleUrl: './ui-kit.scss',
  templateUrl: './ui-kit.html',
})
export class UiKit {
  readonly email = new FormControl('', { nonNullable: true });
  readonly plan = new FormControl('', { nonNullable: true });
  readonly message = new FormControl('', { nonNullable: true });
  readonly options: readonly SelectOption[] = [{ value: 'cafe', label: 'Café y conversación' }];
}
