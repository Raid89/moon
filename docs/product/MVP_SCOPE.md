# MVP — Alcance y prioridades

## Confirmado
- Web pública de eventos organizados por Moon.
- Dos experiencias según rol: participante y organizador.
- Eventos con **imágenes, título, descripción, lugar/dirección con localización en mapa, dinámica, reglas y cupo máximo**.
- Participantes ven **inscritos confirmados / cupo máximo**, ejemplo `10/50`.
- Inscripción de usuarios a eventos.
- Perfil mínimo: **nombre, correo y ciudad de residencia en Colombia**.
- Login por correo mediante **código OTP**.
- Creación de eventos **solo por el equipo Moon**.

## Propuesto para entregar el flujo completo
- Fecha, hora de inicio y zona horaria del evento; opcional hora de fin.
- Listado público, detalle por URL compartible y buscador/filtro por ciudad (filtro sujeto a prioridad).
- Listado de mis inscripciones; cancelar inscripción si las reglas del evento lo permiten.
- Panel simple del organizador para crear/editar/publicar/cancelar, ver cupos y lista de inscritos.
- Confirmaciones y errores claros en el sitio; emails de confirmación diferentes del OTP por decidir.

## Fuera del MVP salvo autorización
- Registro público de organizadores, aprobación de terceros, marketplace.
- Pagos, entradas monetizadas, códigos QR, control de acceso o check-in.
- Chat, amigos, seguidores, reseñas, ranking, gamificación.
- Lista de espera, transferir cupos, grupos de reservas.
- Moderación comunitaria, recomendador personalizado, app móvil nativa.

## Definición de terminado por funcionalidad
- Estados loading/empty/error/success; vistas móvil y escritorio; teclado y contraste.
- Pruebas sobre casos felices, inválidos y concurrentes cuando aplique.
- Sin fuga de datos privados ni mecanismos de autorización basados solo en Angular.
- Copy y UI alineados con `moon-design-system`.
