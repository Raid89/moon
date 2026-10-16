# Moon — Registro de decisiones abiertas

Codex no debe resolver silenciosamente estas preguntas al implementar funciones críticas. Presentar alternativas y solicitar confirmación cuando impacten alcance, costo o seguridad.

| ID  | Tema                | Estado     | Pregunta / alternativas                                                                                        |
| --- | ------------------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| D01 | Base de datos y ORM | CONFIRMADO | MongoDB Atlas con Mongoose; base `moon1`.                                                                      |
| D02 | Email OTP           | CONFIRMADO | Resend API configurada por entorno; plantilla de OTP propia y limitación en API.                               |
| D03 | Sesión              | CONFIRMADO | Cookie HttpOnly de sesión opaca persistida, siete días y revocable.                                            |
| D04 | Mapas               | PARCIAL    | [C] Google Maps mediante enlace e inserción. [D] API key, geocoding y proveedor alterno.                       |
| D05 | Imágenes            | PARCIAL    | [C] Cloudflare R2 será el bucket. [D] Upload, límites, CORS, política de acceso, claves y URLs firmadas.       |
| D06 | Inscripciones       | PENDIENTE  | ¿Se permite cancelar y volver a inscribirse? ¿Cierre automático y ventanas?                                    |
| D07 | Evento              | PARCIAL    | [C] Publicar bloquea edición posterior. [P] Inicio obligatorio, sin fin. [D] Cancelación y reglas restantes.   |
| D08 | Privacidad          | PENDIENTE  | ¿Participantes ven solo contador o también nombres? Recomendado solo contador público.                         |
| D09 | Organizador         | PARCIAL    | [C] Lista `ORGANIZER_EMAILS` en API + OTP. [P] Acceso solo a eventos propios. [D] Gestión entre organizadores. |
| D10 | Comunicaciones      | PENDIENTE  | ¿Enviar correo de inscripción/cancelación o solo confirmación en web?                                          |
| D11 | SSR/SEO             | PARCIAL    | [C] El frontend Angular se desplegará en Vercel. [D] SPA, SSR o prerender; dominios y hosting de la API.       |
| D12 | Municipios          | CONFIRMADO | Copia versionada de DIVIPOLA/DANE, actualizada bajo revisión explícita.                                        |
| D13 | Público objetivo    | PENDIENTE  | ¿Hay restricciones de edad, condiciones de asistencia o consentimiento?                                        |

## Decisiones confirmadas (no reabrir sin indicación)

- C01: Monorepo Turborepo + pnpm; Angular web; NestJS API.
- C02: OTP por correo para autenticación.
- C03: Eventos organizados solo por el equipo oficial Moon.
- C04: Perfil mínimo nombre, correo, ciudad de residencia en Colombia.
- C05: Evento con imágenes, título, descripción, ubicación en mapa/dirección, dinámica, reglas y capacidad; mostrar inscritos/capacidad.

## Registro de ADRs

Cuando se apruebe una decisión técnica importante, crear `docs/decisions/ADR-XXXX-<tema>.md` con Contexto, Opciones, Decisión, Consecuencias y Fecha, y actualizar esta tabla. No presentar una propuesta como decisión adoptada.

## Refinamiento de acceso — 2026-10-15 [CONFIRMADO: alcance visual y usabilidad]

Se mantiene C02/C04: una sola entrada por correo OTP y perfil mínimo. El pulido de interfaz reutiliza las primitivas y tokens actuales, hace explícitos los pasos y añade recuperación visible ante fallos de carga/reenvío. No incorpora proveedores, datos personales ni decisiones pendientes adicionales. Implementación descrita en `docs/product/USER_FLOWS.md`.

## Acceso y publicación — 2026-10-15

El usuario confirmó lista de correos en entorno y publicación con bloqueo posterior de edición.
Véase [ADR-0001](ADR-0001-organizer-access-and-publishing.md) para alcance, alternativas y límites.
D04 usa Google Maps por enlace para el MVP; API key/geocoding siguen pendientes. D05 confirma
Cloudflare R2 como bucket, pero la selección de imagen actual sigue siendo una previsualización local:
no existe upload ni persistencia hasta implementar el flujo y sus controles. D11 confirma Vercel para
el frontend, sin seleccionar aún SPA, SSR o prerender ni el hosting de la API. Véase
[ADR-0002](ADR-0002-hosting-storage-and-database.md).
