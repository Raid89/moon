# Moon — API contracts preliminares (PROPUESTA)

No implementar rutas o payloads como definitivos sin revisar API actual y decisiones pendientes. Prefijo de ejemplo: `/api`.

| Método  | Ruta ilustrativa    | Acceso                | Función                        |
| ------- | ------------------- | --------------------- | ------------------------------ |
| `POST`  | `/auth/otp/request` | Público, rate limited | Solicitar OTP por email        |
| `POST`  | `/auth/otp/verify`  | Público, rate limited | Verificar OTP e iniciar sesión |
| `POST`  | `/auth/logout`      | Sesión                | Revocar sesión                 |
| `GET`   | `/auth/me`          | Sesión                | Identidad/perfil/rol           |
| `PATCH` | `/users/me`         | Sesión                | Nombre y ciudad                |

## Implementado: autenticación y perfil

Las rutas de autenticación están bajo `/api`. `POST /auth/otp/request` recibe `{ email }` y retorna
`challengeId`, `expiresAt` y `resendAvailableAt`; responde de forma neutra y limita solicitudes.
`POST /auth/otp/verify` recibe `{ challengeId, code }`, crea una cookie de sesión HttpOnly y devuelve
`{ user }`. `GET /auth/me`, `POST /auth/logout` y `PATCH /users/me` completan la sesión y el perfil.
El perfil recibe `{ name, cityCode }`, donde `cityCode` es el código DIVIPOLA de cinco caracteres.

`GET /api/locations/departments` y `GET /api/locations/municipalities?departmentCode=05` entregan el
catálogo usado por el formulario. Los errores usan `{ code, message, requestId }`.
| `GET` | `/events` | Público | Listado paginado de publicados |
| `GET` | `/events/:slug` | Público | Detalle público + inscritos confirmados/capacidad |
| `POST` | `/events/:id/registrations` | USER u ORGANIZER autenticado | Inscribirse, idempotente |
| `DELETE` | `/events/:id/registrations/me` | Sesión | Cancelación si se permite |
| `GET` | `/users/me/registrations` | Sesión | Mis eventos |
| `POST` | `/organizer/events` | ORGANIZER | Crear borrador |
| `PATCH` | `/organizer/events/:id` | ORGANIZER | Editar evento |
| `POST` | `/organizer/events/:id/publish` | ORGANIZER | Publicar |
| `POST` | `/organizer/events/:id/cancel` | ORGANIZER | Cancelar |
| `GET` | `/organizer/events/:id/registrations` | ORGANIZER | Lista interna de inscritos |

## Respuesta pública de evento (ejemplo)

```json
{
  "id": "evt_123",
  "slug": "noche-bajo-las-estrellas",
  "title": "Una noche bajo las estrellas",
  "description": "...",
  "activityDescription": "...",
  "rules": "...",
  "startsAt": "2026-11-14T23:00:00Z",
  "timeZone": "America/Bogota",
  "location": {
    "city": "Bogotá",
    "address": "Dirección del evento",
    "latitude": 4.65,
    "longitude": -74.08
  },
  "images": [],
  "capacity": 50,
  "confirmedCount": 10,
  "remainingSpots": 40,
  "status": "PUBLISHED"
}
```

**Datos de ejemplo ficticios**, no un evento real.

## Errores propuestos

- `OTP_INVALID`, `OTP_EXPIRED`, `OTP_RATE_LIMITED`
- `UNAUTHENTICATED`, `FORBIDDEN`, `PROFILE_INCOMPLETE`
- `EVENT_NOT_FOUND`, `EVENT_NOT_OPEN`, `EVENT_FULL`, `ALREADY_REGISTERED`
- `VALIDATION_FAILED`, `CONFLICT`

Definir contrato consistente de `code`, `message`, `details?`, `requestId?` y códigos HTTP usando estándares existentes del repo. No devolver detalles internos, correos de terceros ni existencia de cuentas en solicitudes OTP.

## Paginación/privacidad

Paginación y filtros acotados. APIs públicas retornan totales y datos del evento, **no lista nominal** de participantes. Revalidar cupos durante inscripción, no confiar en el contador del cliente.

## Implementado: organizador — 2026-10-15

Todas las rutas siguientes requieren sesión, perfil completo y correo en `ORGANIZER_EMAILS`.

| Método | Ruta real                           | Resultado                                                                       |
| ------ | ----------------------------------- | ------------------------------------------------------------------------------- |
| GET    | `/api/organizer/events?page=1`      | `{ events, total, page, pageSize: 20 }`, propios, orden de creación descendente |
| GET    | `/api/organizer/events/:id`         | `{ event }`, propio                                                             |
| POST   | `/api/organizer/events`             | `{ event }`, crea `DRAFT`                                                       |
| PATCH  | `/api/organizer/events/:id`         | `{ event }`, reemplaza los campos editables del borrador                        |
| POST   | `/api/organizer/events/:id/publish` | `{ event }`, transición a `PUBLISHED`, bloquea edición                          |

POST/PATCH reciben todos los campos: `title` (3–160), `description` (10–10000),
`activityDescription` y `rules` (3–5000), `startsAt` (ISO con Z/offset explícito), `capacity`
(entero 1–100000), `venueName` (2–160), `address` (3–300), `cityCode` (DIVIPOLA válido),
`mapLink` HTTPS de Google Maps (máximo 2048 caracteres). Los campos de texto se recortan antes de
validar. Las imágenes no se aceptan en este payload.
`role`, `organizerId`, `status` y campos desconocidos son rechazados.

`description`, `activityDescription` y `rules` reciben HTML de `ngx-quill`. La API conserva solo
párrafos, encabezados, énfasis, listas, citas, enlaces e imágenes HTTPS; elimina scripts,
atributos de evento y URLs inseguras antes de persistir.

La respuesta añade `id`, `status`, `timeZone: America/Bogota`, `cityName` y `publishedAt` nullable.
No incluye propietarios ni correos. `imageUrls` contiene rutas de lectura privadas de la API, nunca
una URL ni una credencial de R2. Publicación exige inicio futuro. Errores relevantes:
`PROFILE_INCOMPLETE` (403), `FORBIDDEN` (403), `EVENT_NOT_FOUND` (404 también para otro propietario),
`EVENT_LOCKED` (409), `EVENT_INCOMPLETE` (400) y `CONFLICT` (409 por cambio durante publicación).
Las demás rutas ilustrativas de eventos e inscripciones continúan propuestas, sin implementar.

### Portada privada del borrador [IMPLEMENTADO — 2026-10-16]

| Método | Ruta real                                    | Resultado                                                                   |
| ------ | -------------------------------------------- | --------------------------------------------------------------------------- |
| POST   | `/api/organizer/events/:id/cover`            | Recibe `multipart/form-data` con `file`; reemplaza la portada del borrador. |
| GET    | `/api/organizer/events/:id/images/:imageKey` | Devuelve la imagen solo al organizador propietario.                         |
| DELETE | `/api/organizer/events/:id/cover`            | Elimina la portada del borrador y el objeto asociado.                       |

Solo se aceptan JPG, PNG o WebP de máximo 8 MB. La API verifica la firma binaria, genera la clave
interna y guarda el objeto en el bucket privado de Cloudflare R2. Un evento publicado no admite
carga ni borrado; una solicitud de otro organizador responde como recurso no encontrado.
