# Moon — Seguridad y autenticación

## Decisiones confirmadas

- Login de usuarios mediante **OTP enviado por correo**, sin contraseñas.
- Organizadores son exclusivamente miembros autorizados del equipo Moon; no hay onboarding de organizadores externos.

## Diseño de seguridad recomendado [PROPUESTA]

1. OTP criptográficamente aleatorio de seis dígitos; expiración propuesta **5 minutos**.
2. Un solo uso; invalidar challenge tras éxito; limitar intentos (por ejemplo 5 por código), reenvíos y solicitudes por IP/email/dispositivo; comparar verificadores de forma segura.
3. Almacenar **HMAC/derivado seguro** del OTP con secreto del servidor y contexto del challenge, nunca el código en claro. Un OTP de seis dígitos tiene baja entropía: hash rápido simple no basta frente a ataques offline.
4. Evitar enumeración de cuentas: mensaje neutro en solicitud OTP; controlar diferencias de tiempo y métricas sin exponer datos personales.
5. Sesión con cookie `HttpOnly; Secure; SameSite` cuando arquitectura y dominio lo permitan; rotación/revocación y caducidad definidas. Proteger rutas mutantes frente a CSRF cuando corresponda.
6. HTTPS, configuración CORS estricta, validación de origin/host si aplica, secretos por entorno, logs sin OTP ni cookies.
7. Rol se resuelve de forma fiable en API en cada operación sensible; no aceptar `role` enviado por usuario; provisioning de organizadores por procedimiento administrativo protegido y auditable.
8. Validación del lado servidor sobre uploads: tipo real, tamaño, límites, escaneo según riesgo, nombres aleatorios y permisos de almacenamiento.
9. Usar controles de acceso y minimización de datos: los participantes no ven emails de otros. Cumplir política de privacidad y requisitos de tratamiento de datos aplicables en Colombia antes del lanzamiento.

## Puntos a decidir

Proveedor de email y antiabuso; almacenamiento/tiempo de vida de challenges; política de sesión; expiración y revocación; cookies vs arquitectura de dominios; protección de menores; medidas de prevención de abuso y recuperación de cuenta.

## Implementado

- MongoDB/Mongoose persiste usuarios, challenges y sesiones. Los códigos son HMAC, vencen a los cinco minutos, permiten cinco intentos y se consumen atómicamente.
- Sesiones opacas tienen vida de siete días, se almacenan como hash y se revocan con logout. La cookie es `HttpOnly`, `SameSite=Lax` y pasa a `Secure` en producción.
- Los límites son atómicos por correo/IP y ventana de una hora; el reenvío espera un minuto. Resend (`RESEND_API_KEY`, `RESEND_FROM`) y `OTP_SECRET` deben configurarse en el entorno antes de habilitar el flujo real.

## Pruebas mínimas

OTP incorrecto/expirado/reutilizado, múltiples solicitudes, intentos simultáneos, rate limit, logout, cookie/CSRF, escalamiento de rol y IDOR, inscripción duplicada/cupo lleno.
