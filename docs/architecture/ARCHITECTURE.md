# Moon — Arquitectura de software (objetivo, no inspección del repositorio)

## Contexto confirmado

Monorepo **Turborepo + pnpm**, frontend **Angular**, backend **NestJS**. Skills relevantes instaladas: `angular-developer`, `nestjs-best-practices`, `zod`, `moon-design-system`, `frontend-design`, `ui-ux-pro-max`, `ui-visual-composition`, `design-systems-frontend-architecture`, `web-design-guidelines`.

## Componentes (propuesta)

```text
Navegador
   │ HTTPS
   ▼
Angular Web (Vercel) ──► NestJS API [hosting pendiente] ─► MongoDB Atlas (`moon1`)
                           ├──► Proveedor email OTP [PENDIENTE]
                           ├──► Cloudflare R2 (archivos; integración pendiente)
                           └──► Mapas/geocoding [PENDIENTE; integrar frontend y/o backend]
```

## Límites

- **Angular:** rutas públicas, descubrimiento, detalle, login OTP, perfil, mis eventos, panel de organizador y presentación. No decide quién puede inscribirse ni quién es organizador.
- **NestJS:** identidad/sesión, autorización, eventos, cupos, inscripciones, validación, uploads y auditoría relevante.
- **Persistencia:** MongoDB Atlas (`moon1`) mediante Mongoose, con datos consistentes y restricciones para concurrencia.
- **Servicios externos:** Cloudflare R2 almacenará archivos. Sus credenciales solo viven del lado servidor; los uploads deben estar limitados y controlados. La API no se desplegará en Vercel por inferencia: su hosting sigue pendiente.

## Límites de dominio propuestos

`auth`, `users`, `events`, `registrations`, `media` (y `locations` solo si la complejidad real lo necesita). Evitar microservicios o colas desde el primer día sin caso demostrado.

## Monorepo: ejemplo NO prescriptivo

```text
apps/<nombre-web-real>/     # Angular
apps/<nombre-api-real>/     # NestJS
packages/<contracts?>/     # Contratos si existe/conviene
packages/<design-tokens?>/ # Tokens si existe/conviene
AGENTS.md
docs/
```

Antes de crear carpetas, Codex debe inspeccionar `pnpm-workspace.yaml`, `turbo.json`, `apps/`, dependencias, scripts y convenciones de código. No renombrar directorios existentes porque el documento muestre ejemplos.

## Dependencias y contratos

- Preferir contratos compartidos y validación runtime con Zod **si concuerda con las convenciones ya implementadas**; NestJS puede estar usando DTO/class-validator: no duplicar estrategias sin decisión.
- Respuestas y errores HTTP con formato coherente; tipos/estados publicables al frontend.
- Las transiciones de estados y cupos se ejecutan en backend; nunca basarse solo en el contador mostrado.
- Las fechas de eventos necesitan formato ISO y semántica explícita de zona horaria.

## SEO y renderizado

Las páginas públicas deben tener URLs estables, contenido indexable, metadatos y etiquetas sociales. El frontend se desplegará en Vercel. Evaluar Angular SSR/prerender contra la versión e infraestructura existentes; no habilitar SSR automáticamente sin revisar implicaciones de deploy.

## Principios operativos

MVP modular y simple; cambios trazables; despliegue separado o conjunto según infraestructura actual; secretos por entorno; logs seguros; tests de concurrencia de inscripciones; optimizar imágenes, fuentes y paquetes para Core Web Vitals.
