# Moon UI: guía de reutilizables

## Estado y fuente de verdad

**Estado: IMPLEMENTADO Y VERIFICADO EN REPOSITORIO.** Esta guía describe el kit UI actual de
Angular. La API pública está en
[`apps/web/src/app/shared/ui/index.ts`](../../apps/web/src/app/shared/ui/index.ts) y los tokens en
[`apps/web/src/styles.scss`](../../apps/web/src/styles.scss).

Moon es una web de eventos sociales oficiales. La UI debe priorizar descubrir eventos, entender
cupos y completar la inscripción; no debe convertirse en un dashboard genérico.

## Instrucciones para IA y contribuyentes

1. Lee esta guía y revisa `shared/ui/index.ts` antes de crear una pantalla.
2. Importa desde el barrel, no desde rutas internas:

   ```ts
   import { Button, Input, ToastService } from "./shared/ui";
   ```

3. Reutiliza una variante existente antes de crear un componente, token o color nuevo.
4. Para una necesidad recurrente no cubierta, primero compón primitivas existentes. Crea una nueva
   primitiva solo ante una necesidad repetida, un requisito de accesibilidad o una simplificación
   clara. Documenta su contrato aquí en el mismo cambio.
5. No uses valores raw para color, radio, espaciado, sombras o motion cuando exista un token
   `--moon-*`. No agregues librerías visuales sin una necesidad demostrada.

Los componentes son standalone y usan `ChangeDetectionStrategy.OnPush`. Sus estilos dependen de los
tokens globales; conserva `src/styles.scss` en la aplicación consumidora.

## Fundaciones

| Propósito    | Tokens principales                                                                |
| ------------ | --------------------------------------------------------------------------------- |
| Superficies  | `--moon-night`, `--moon-surface`, `--moon-surface-raised`, `--moon-surface-hover` |
| Texto        | `--moon-text`, `--moon-text-muted`, `--moon-text-faint`                           |
| Marca y foco | `--moon-brand`, `--moon-brand-strong`, `--moon-brand-soft`, `--moon-focus`        |
| Estados      | `--moon-success`, `--moon-warning`, `--moon-danger` y sus variantes `-soft`       |
| Estructura   | `--moon-radius-*`, `--moon-space-*`, `--moon-shadow-*`                            |
| Movimiento   | `--moon-duration-fast`, `--moon-duration-medium`, `--moon-ease-out`               |

No comuniques un estado solo con color: combina color, texto, ícono o semántica. El movimiento es
breve y se reduce con `prefers-reduced-motion`.

## Importación

```ts
import {
  Badge,
  Button,
  Dialog,
  EmptyState,
  Input,
  Select,
  Textarea,
  ToastService,
  ToastViewport,
  type SelectOption,
} from "./shared/ui";
```

Agrega cada componente standalone a `imports` del componente consumidor. `ToastService` se inyecta;
`ToastViewport` se renderiza una sola vez, cerca del shell raíz.

## Acciones: `moon-button`

Usa un botón cuando la acción ocurre en la página. Para navegar, usa un enlace real (`a` o
`RouterLink`), no un botón estilizado como enlace.

| Input      | Tipo                                              | Valor por defecto |
| ---------- | ------------------------------------------------- | ----------------- |
| `variant`  | `'primary' \| 'secondary' \| 'quiet' \| 'danger'` | `'primary'`       |
| `size`     | `'sm' \| 'md' \| 'lg'`                            | `'md'`            |
| `type`     | `'button' \| 'submit' \| 'reset'`                 | `'button'`        |
| `disabled` | booleano                                          | `false`           |
| `loading`  | booleano                                          | `false`           |

```html
<moon-button type="submit" [loading]="saving()"
  >Guardar inscripción</moon-button
>
<moon-button variant="secondary" type="button" (click)="cancel()"
  >Cancelar</moon-button
>
<moon-button variant="danger" type="button" (click)="removeDraft()"
  >Eliminar borrador</moon-button
>
```

- `primary`: única acción principal del contexto.
- `secondary`: alternativa importante, pero no dominante.
- `quiet`: acción secundaria de bajo énfasis.
- `danger`: acción destructiva; confirma con `moon-dialog` si no es reversible.
- `loading` deshabilita el control y expone `aria-busy`; conserva un texto que describa la acción.

## Formulario: `moon-input`, `moon-textarea` y `moon-select`

Los tres implementan `ControlValueAccessor`: úsalos con `ReactiveFormsModule`, `FormControl` y
`formControlName`. No dupliques su estado con `[(ngModel)]` ni crees un input nativo paralelo.

```ts
readonly cityControl = new FormControl('', { nonNullable: true });
```

```html
<moon-input
  label="Ciudad de residencia"
  name="city"
  autocomplete="address-level2"
  placeholder="Bogotá"
  hint="Debe estar en Colombia"
  [formControl]="cityControl"
/>
```

Cuando el formulario determine que un campo es inválido, pasa un mensaje específico mediante
`error`. El componente asocia label, ayuda/error e `aria-invalid`.

```html
<moon-input
  label="Correo"
  type="email"
  autocomplete="email"
  [error]="emailControl.touched && emailControl.invalid ? 'Escribe un correo válido.' : ''"
  [formControl]="emailControl"
/>
```

### `moon-input`

Inputs: `label`, `name`, `placeholder`, `hint`, `error`, `controlId`, `autocomplete`, `inputmode`, `maxlength` y `type`.
`inputmode` y `maxlength` se usan para guiar teclados y longitudes, por ejemplo `inputmode="numeric"` y `maxlength="6"` para un OTP. `type` admite `text`, `email`, `password`, `search`, `tel` y `url`. Usa `controlId` únicamente si
necesitas un identificador estable; en caso contrario se genera automáticamente.

### `moon-textarea`

Inputs: `label`, `name`, `placeholder`, `hint`, `error`, `controlId` y `rows` (por defecto `4`).
Úsalo para descripciones o reglas de varias líneas, no para respuestas cortas.

### `moon-select`

Inputs: `label`, `placeholder`, `hint`, `error` y `options`.

```ts
readonly cityOptions: readonly SelectOption[] = [
  { label: 'Bogotá', value: 'bogota' },
  { label: 'Medellín', value: 'medellin' },
  { label: 'Cali', value: 'cali', disabled: true },
];
```

```html
<moon-select
  label="Ciudad"
  [options]="cityOptions"
  [formControl]="cityControl"
/>
```

El valor es siempre `string`. Para listas grandes, búsqueda remota o multiselección no hay
componente actual: no conviertas este select en un combobox ad hoc; define primero una nueva
primitiva con su contrato accesible.

## Feedback no bloqueante: `ToastService` y `moon-toast-viewport`

Monta un único viewport en el shell:

```html
<moon-toast-viewport />
```

Inyecta el servicio desde el componente que completa una acción:

```ts
private readonly toast = inject(ToastService);

saveSucceeded(): void {
  this.toast.show({
    tone: 'success',
    title: 'Inscripción confirmada',
    message: 'Te avisaremos cualquier cambio del evento.',
  });
}
```

`show` recibe `title`, `message`, `tone` (`'success' | 'error' | 'info'`) y opcionalmente
`duration` en milisegundos. Por defecto dura `5000`; usa `duration: 0` solo para un aviso que debe
cerrarse manualmente. Úsalo para confirmar, informar o reportar un fallo recuperable. No sustituye
la validación de formulario ni una decisión que requiera confirmación.

Los errores usan `role="alert"`; los demás, `role="status"`. Cada toast tiene cierre accesible.

## Decisiones: `moon-dialog`

`moon-dialog` usa el elemento nativo `dialog`. Úsalo para confirmar una acción relevante o explicar
una consecuencia antes de continuar; no para información que cabe en la página.

| Input / output        | Uso                                                       |
| --------------------- | --------------------------------------------------------- |
| `title`               | Título visible y nombre accesible. Proporciónalo siempre. |
| `description`         | Contexto breve opcional.                                  |
| `eyebrow`             | Contexto; por defecto `Moon`.                             |
| `open` / `openChange` | Estado controlado.                                        |
| `closed`              | Se emite al cerrarse el diálogo nativo.                   |

```ts
readonly cancelDialogOpen = signal(false);
```

```html
<moon-button variant="danger" (click)="cancelDialogOpen.set(true)"
  >Cancelar inscripción</moon-button
>

<moon-dialog
  title="¿Cancelar tu inscripción?"
  description="Tu cupo quedará disponible para otra persona."
  [open]="cancelDialogOpen()"
  (openChange)="cancelDialogOpen.set($event)"
>
  <p>Esta acción no se puede deshacer desde la web.</p>
  <moon-button
    moonDialogActions
    variant="secondary"
    (click)="cancelDialogOpen.set(false)"
    >Volver</moon-button
  >
  <moon-button moonDialogActions variant="danger" (click)="confirmCancel()"
    >Cancelar inscripción</moon-button
  >
</moon-dialog>
```

Las acciones se proyectan con el atributo `moonDialogActions`. El componente admite Escape, cierre
por botón y clic sobre backdrop. Mantén el contenido corto y ofrece una salida segura.

## Estado: `moon-badge` y `moon-empty-state`

### `moon-badge`

`tone` admite `brand`, `neutral`, `success`, `warning` y `danger` (por defecto `neutral`). Es una
etiqueta compacta, no el único lugar donde explicar una condición importante.

```html
<moon-badge tone="success">12 de 50 cupos confirmados</moon-badge>
```

### `moon-empty-state`

Inputs: `title`, `description` e `icon`. Proyecta la acción opcional con `moonEmptyAction`.

```html
<moon-empty-state
  title="No hay eventos esta semana"
  description="Vuelve pronto o explora otras fechas."
  icon="✦"
>
  <moon-button moonEmptyAction>Ver próximos eventos</moon-button>
</moon-empty-state>
```

Un estado vacío dice qué falta y cuál es la siguiente acción. No lo uses durante carga: aún no hay un
patrón de skeleton/loading.

## Cobertura actual y límites explícitos

El kit no incluye navegación, enlace, card, avatar, iconografía, checkbox/radio/switch, date picker,
loader/skeleton, tooltip, menú, popover ni combobox. No supongas que existen ni copies estilos de una
pantalla para simularlos. Antes de agregar uno, valida el caso de uso, teclado, estados y si puede
componerse con las primitivas actuales.

## Checklist antes de entregar una pantalla

- Importa desde `shared/ui`, sin duplicar estilos o tokens.
- El control tiene label, acción clara y foco visible.
- Hay una sola acción `primary` por contexto; las destructivas se confirman cuando aplica.
- La validación aparece junto al campo; los toasts no sustituyen errores de formulario.
- El diálogo tiene título, salida segura y no contiene flujos largos.
- El texto soporta móvil, zoom y traducciones; no depende solo de color.
- Se respeta `prefers-reduced-motion` cuando se añade interacción.

## Actualización y validación

Si cambia una API o se agrega una primitiva, actualiza en el mismo cambio:

1. `apps/web/src/app/shared/ui/index.ts`.
2. Esta guía, con propósito, contrato, ejemplo, accesibilidad y límites.
3. El catálogo de composición de `apps/web/src/app/app.ts` si aporta un caso real de uso.

Verifica como mínimo:

```bash
./node_modules/.bin/prettier --check apps/web/src/app docs/frontend/UI_COMPONENTS.md
pnpm --filter @moon/web build
```
