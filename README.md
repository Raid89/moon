# Moon App

Monorepo de `pnpm` y Turborepo con las aplicaciones iniciales:

- `apps/web`: Angular, cliente web.
- `apps/api`: NestJS, API HTTP.

## Requisitos

- Node.js 24 o superior.
- pnpm 11 (`corepack enable` si aún no está disponible).

## Comandos

```bash
pnpm install
pnpm dev       # levanta Angular (4200) y Nest (3000)
pnpm build     # construye todas las aplicaciones mediante Turbo
pnpm test      # ejecuta las pruebas disponibles
pnpm lint      # ejecuta los linters disponibles
```

Para iniciar una sola aplicación, usa `pnpm dev:web` o `pnpm dev:api`.
