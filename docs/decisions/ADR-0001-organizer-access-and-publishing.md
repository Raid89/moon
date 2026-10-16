# ADR-0001 — Acceso de organizadores y publicación

Fecha: 2026-10-15. Estado: aceptado para el alcance descrito.

## Contexto

El usuario solicitó registrar al equipo con correos definidos en `.env` y configurar eventos.
Confirmó incluir publicación y bloquear la edición posterior. OTP, MongoDB/Mongoose y sesiones
opacas ya estaban implementados.

## Opciones

- Asignación manual de roles en base de datos o lista autorizada en entorno.
- Solo borradores o publicación con bloqueo posterior.

## Decisión [C]

`ORGANIZER_EMAILS` contiene correos separados por comas, normalizados a minúsculas y sin espacios
externos. Se utiliza el OTP habitual, se completa el perfil y se entra en `/organizador/eventos`.
La API deriva el rol tanto al verificar OTP como al resolver cada sesión; quitar un correo y
reiniciar la API revoca su acceso de organizador en solicitudes siguientes. Una lista vacía no
autoriza organizadores. El navegador no envía ni asigna roles.

Un evento nace `DRAFT`; puede publicarse una sola vez con datos completos y fecha futura.
`PUBLISHED` bloquea toda edición en API, con predicados atómicos sobre estado y versión para detectar
cambios durante publicación.

## Elecciones de implementación reversibles [P]

Hasta definir acceso compartido, cada organizador solo consulta y modifica sus propios eventos.
Se conserva inicio obligatorio, sin fecha de fin, y `America/Bogota` como zona fija. El formulario
interpreta su fecha/hora en UTC-05:00 y la API recibe ISO con zona explícita, almacenado como Date UTC.
La ubicación se guarda como enlace de Google Maps y se previsualiza con un enlace de inserción de
Google Maps. La pantalla permite elegir una imagen local y verla antes de guardar, pero no la sube ni
la persiste hasta definir el bucket. Esto no selecciona un proveedor de almacenamiento ni habilita
uploads reales.

## Consecuencias y límites

Cambiar la lista requiere reiniciar la API. Una cuenta existente autorizada se promueve al resolver
su sesión, sin modificar MongoDB manualmente. Los datos personales no forman parte del contrato
de eventos. El listado es privado, paginado (20 por página) y protegido por propietario.

Esta entrega configura y publica el estado persistido; aún no incorpora catálogo público,
inscripciones, contador de asistentes, cancelación, eliminación ni edición tras publicar. No debe
interpretarse publicación como prueba de una página pública o un flujo de inscripciones existente.
Mapas, almacenamiento, acceso entre organizadores y políticas de cancelación siguen pendientes.
