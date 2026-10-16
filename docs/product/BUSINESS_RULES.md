# Moon — Reglas de negocio

`[C]` confirmado por el producto. `[P]` propuesta a validar. `[D]` decisión pendiente.

## Usuarios y roles
- [C] Los usuarios proporcionan nombre, email y ciudad de residencia en Colombia.
- [C] Autenticación con email + OTP; no contraseña en el MVP.
- [C] Solo el equipo Moon puede organizar/publicar eventos; no registro público de organizadores.
- [P] Email verificado y único por cuenta (normalizar espacios/case cuidadosamente).
- [P] La ciudad procede de un catálogo de municipios colombianos, idealmente con código oficial estable.
- [P] Las altas y cambios de rol se ejecutan con procedimiento administrativo controlado, con auditoría.

## Eventos
- [C] Cada evento tiene imágenes, título, descripción, lugar, mapa, dinámica, reglas y capacidad.
- [P] Fecha/hora inicio obligatorias, almacenadas en UTC; mostrar hora local y zona horaria del evento (Colombia normalmente `America/Bogota`).
- [P] Estados: `DRAFT`, `PUBLISHED`, `CANCELLED`, `COMPLETED`; publicación solo con datos obligatorios completos.
- [P] Un evento no publicado no aparece en vistas públicas.
- [D] Criterios de cierre de inscripción, mínimo de participantes, posibilidad de cambiar capacidad o lugar tras inscripciones.

## Inscripciones
- [C] Un usuario puede inscribirse a un evento; el público ve cantidad inscrita/cupo total.
- [P] Una sola inscripción **activa** por `(userId, eventId)`; reintento idempotente.
- [P] Contar solo inscripciones activas/confirmadas, nunca canceladas ni pendientes.
- [P] No superar capacidad: validación y escritura atómica/transaccional en backend, protegidas frente a concurrencia.
- [P] Inscripción requiere sesión y perfil mínimo completo.
- [P] Inscripción no permitida si el evento está cancelado, no publicado o fuera del periodo de inscripción.
- [P] Usuarios pueden cancelar inscripción; libera un cupo, sujeto a plazo [D].
- [D] Si se permite re-inscribir tras cancelar, si existe plazo límite, si se publica identidad de participantes, y si habrá lista de espera.

## Privacidad
- [P] El público solo ve cantidades agregadas, **no** correos, nombres o perfiles de los asistentes.
- [P] Organizadores autorizados acceden a datos mínimos de inscritos para administrar el evento.
- [D] Retención y borrado, texto de privacidad, aceptación de condiciones y política de menores.

## Invariantes para pruebas
1. `0 <= confirmedRegistrations <= capacity` para cada evento con cupo fijo.
2. Dos requests simultáneas nunca producen sobrecupo.
3. Ningún `USER` accede a mutaciones de organizador aunque llame directamente al API.
4. Un OTP expirado/usado/inválido no da acceso.
5. Eventos `DRAFT` son invisibles al público.
