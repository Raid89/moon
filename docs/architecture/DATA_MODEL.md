# Moon — Modelo de datos conceptual (PROPUESTA)

No es un esquema SQL/ORM definitivo. Revisar base de datos, ORM y convenciones existentes antes de implementarlo.

## User

- `id` identificador estable
- `email` único/normalizado/verificado
- `name` obligatorio al completar perfil
- `cityCode` identificador estable del municipio colombiano; `cityName` para mostrar si conviene
- `role` enum `USER | ORGANIZER` (o roles existentes)
- `createdAt`, `updatedAt`

## Event

- `id`, `slug` único para URL compartible
- `organizerId` → User (miembro oficial)
- `title`, `description`, `activityDescription` (dinámica), `rules`
- `startsAt`, `endsAt?` (instantes UTC); `timeZone` (ej. `America/Bogota`)
- `capacity` entero positivo
- `status` enum `DRAFT | PUBLISHED | CANCELLED | COMPLETED` (propuesto)
- `createdAt`, `updatedAt`, `publishedAt?`

## EventLocation

- `eventId` → Event (1:1)
- `venueName?`, `address`, `cityCode`, `latitude`, `longitude`, `placeId?`
- Coordenadas geográficas válidas; la dirección de texto sigue disponible sin mapas.

## EventImage

- `id`, `eventId` → Event, `storageKey` o URL pública segura, `altText`, `position`, `isCover`, `createdAt`
- Limitar tamaño/tipo, sanitizar nombres y validar acceso a cargas.

## Registration

- `id`, `userId` → User, `eventId` → Event
- `status` enum `CONFIRMED | CANCELLED` (propuesto)
- `registeredAt`, `cancelledAt?`
- Restricción única para una inscripción por usuario/evento y política explícita de reactivación (decisión pendiente).

## OtpChallenge / Session (implementación pendiente)

- OTP: identidad/correo, expiración, intentos, usedAt, material de verificación derivado del código. Nunca guardar OTP plano.
- Sesión: ID opaco o mecanismo elegido, usuario, expiración, revocación; políticas pendientes.

## Relaciones

```text
User 1 ── N Event (organizerId)
Event 1 ── N EventImage
Event 1 ── 1 EventLocation
User 1 ── N Registration N ── 1 Event
```

## Restricciones críticas

- `capacity >= 1`; coordenadas y fechas válidas.
- Un `Registration` activo por persona/evento.
- Cupos calculados a partir de inscripciones confirmadas o contador transaccional consistente; definición única.
- **Operación de inscripción atómica** para evitar sobrecupos y duplicados bajo concurrencia.
- No exponer `User.email` en APIs públicas de eventos.

## Índices orientativos

- `users(email)` unique.
- `events(status, startsAt)`; `events(slug)` unique; potencial `(cityCode, startsAt)`.
- `registrations(eventId, status)` y restricción de unicidad para `(userId,eventId)` según política elegida.

## Implementado para acceso

`users.email`, `otp_challenges.challengeId`, `sessions.tokenHash` y `auth_rate_limits.key` tienen índices únicos. `otp_challenges.expiresAt`, `sessions.expiresAt` y `auth_rate_limits.expiresAt` usan TTL; la aplicación además comprueba las fechas para no depender del ciclo asíncrono de eliminación de MongoDB.

## Implementado: eventos de organizador

Colección `events` con Mongoose: `organizerId` ObjectId, campos de contenido, `startsAt` Date UTC,
`timeZone` fija `America/Bogota`, capacidad, lugar/dirección, `cityCode`, `mapLink` de Google Maps e
`imageKeys` contiene nombres opacos de objetos de R2, sin URL pública ni credenciales. La API
deriva rutas privadas de lectura para el organizador. Estados reales: `DRAFT | PUBLISHED`,
`publishedAt`, timestamps y `__v`. Índice declarado `{ organizerId: 1, _id: -1 }` para listado propio.
El índice físico no se ha verificado en esta entrega. No se ha implementado `registrations`.
La publicación comprueba estado/versión; edición modifica solo `DRAFT` y aumenta versión.
