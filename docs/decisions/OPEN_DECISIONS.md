# Moon — Registro de decisiones abiertas

Codex no debe resolver silenciosamente estas preguntas al implementar funciones críticas. Presentar alternativas y solicitar confirmación cuando impacten alcance, costo o seguridad.

| ID  | Tema                | Estado     | Pregunta / alternativas                                                                               |
| --- | ------------------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| D01 | Base de datos y ORM | CONFIRMADO | MongoDB Atlas con Mongoose; base `moon1`.                                                             |
| D02 | Email OTP           | CONFIRMADO | SMTP configurado por entorno; plantilla de OTP propia y limitación en API.                            |
| D03 | Sesión              | CONFIRMADO | Cookie HttpOnly de sesión opaca persistida, siete días y revocable.                                   |
| D04 | Mapas               | PENDIENTE  | ¿Google Maps, Mapbox, OpenStreetMap u otro? Considerar costos y geocoding.                            |
| D05 | Imágenes            | PENDIENTE  | ¿S3, Cloudinary u otro almacenamiento? ¿Tamaños y cantidades?                                         |
| D06 | Inscripciones       | PENDIENTE  | ¿Se permite cancelar y volver a inscribirse? ¿Cierre automático y ventanas?                           |
| D07 | Evento              | PENDIENTE  | ¿Campos de fecha/fin obligatorios? ¿Edición posterior a publicar? ¿Qué hacer al cancelar?             |
| D08 | Privacidad          | PENDIENTE  | ¿Participantes ven solo contador o también nombres? Recomendado solo contador público.                |
| D09 | Organizador         | PENDIENTE  | ¿Quién asigna rol y mediante qué procedimiento? ¿Puede gestionar eventos de otros organizadores Moon? |
| D10 | Comunicaciones      | PENDIENTE  | ¿Enviar correo de inscripción/cancelación o solo confirmación en web?                                 |
| D11 | SSR/SEO             | PENDIENTE  | ¿Infraestructura de hosting y estrategia Angular SSR/prerender?                                       |
| D12 | Municipios          | CONFIRMADO | Copia versionada de DIVIPOLA/DANE, actualizada bajo revisión explícita.                               |
| D13 | Público objetivo    | PENDIENTE  | ¿Hay restricciones de edad, condiciones de asistencia o consentimiento?                               |

## Decisiones confirmadas (no reabrir sin indicación)

- C01: Monorepo Turborepo + pnpm; Angular web; NestJS API.
- C02: OTP por correo para autenticación.
- C03: Eventos organizados solo por el equipo oficial Moon.
- C04: Perfil mínimo nombre, correo, ciudad de residencia en Colombia.
- C05: Evento con imágenes, título, descripción, ubicación en mapa/dirección, dinámica, reglas y capacidad; mostrar inscritos/capacidad.

## Registro de ADRs

Cuando se apruebe una decisión técnica importante, crear `docs/decisions/ADR-XXXX-<tema>.md` con Contexto, Opciones, Decisión, Consecuencias y Fecha, y actualizar esta tabla. No presentar una propuesta como decisión adoptada.
