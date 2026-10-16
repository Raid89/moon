# Moon — Requisitos no funcionales

## UX y accesibilidad
- Diseñar mobile-first, con jerarquía clara y CTA de inscripción destacado.
- Estados de carga, vacío, error, capacidad llena, evento cancelado, OTP y sesión caducados.
- HTML semántico, teclado, focus visible, mensajes accesibles y contraste suficiente; objetivo WCAG 2.2 AA donde aplique.
- Respetar `prefers-reduced-motion`; no confundir calidad visual con efectos excesivos.

## Rendimiento
- Core Web Vitals como indicadores de producto; monitorizar LCP, INP y CLS.
- Imágenes responsivas optimizadas, carga diferida de contenido no crítico, prioridad de portada y dimensiones conocidas para evitar saltos.
- Evitar JS y dependencias innecesarias, especialmente servicios de mapas en todas las tarjetas.

## SEO
- Detalles de eventos públicos con rutas compartibles, title/description, Open Graph y datos estructurados apropiados si procede.
- Determinar Angular SSR/prerender/hidratación con base en infraestructura/versiones, sin asumir que SSR está habilitado.
- No indexar panel organizador, perfil ni pantallas privadas.

## Confiabilidad/observabilidad
- Logs estructurados, request/correlation IDs, métricas de errores y latencia, alertas sobre fallos de email e inscripción.
- No loguear OTP, cookies, emails completos ni datos sensibles sin necesidad.
- Recuperación ante fallos parciales de correo y storage; reintentos idempotentes donde aplique.

## Seguridad y privacidad
- RBAC en API, rate limiting de OTP, controles de subida de imágenes, protección de datos y separación entre contenido público y lista privada de asistentes.

## Calidad de ingeniería
- Pruebas de reglas de cupos/concurrencia, autorización, OTP, formularios críticos, responsive y a11y.
- Solo afirmar checks ejecutados; documentar comandos reales después de inspeccionar scripts del workspace.
