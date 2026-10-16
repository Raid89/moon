# Moon — Flujos de usuario

## A. Descubrir e inscribirse [flujo sugerido]

1. Visitante entra a `/eventos` o landing; ve tarjetas con imagen, fecha, ciudad y `inscritos/capacidad`.
2. Abre detalle: imágenes, título, descripción, dinámica, reglas, dirección con mapa, capacidad, CTA.
3. Pulsa `Quiero ir`.
4. Si no tiene sesión: introduce email → recibe OTP → lo verifica; si es nuevo, introduce nombre y ciudad colombiana.
5. API valida estado del evento, cupos y duplicidad **en el momento de confirmar**.
6. Se muestra inscripción confirmada o un error accionable (sin cupos, evento cancelado, ya inscrito, etc.).
7. En `Mis eventos` visualiza inscripción y, si está habilitado, la cancela.

## B. Acceso por email OTP [confirmado a nivel de mecanismo]

1. Introducir email.
2. Solicitar código y mostrar estado de envío sin enumerar cuentas.
3. Introducir código numérico; verificar en backend.
4. Crear sesión segura; completar perfil si faltan datos.
5. Si error: código expirado, inválido, demasiados intentos, espera para reenviar; mensajes claros.

## C. Organizador oficial [flujo sugerido]

1. Integrante autorizado inicia sesión.
2. Accede al panel protegido por permisos de servidor.
3. Crea borrador de evento y sube portada/galería.
4. Configura título, descripción, dinámica, reglas, fecha/hora, ubicación y cupos.
5. Previsualiza, publica y revisa conteo/lista de inscritos.
6. Edita o cancela según restricciones definidas; el sitio comunica el nuevo estado.

## Estados esenciales UI

- Lista vacía; lista cargando; error de red; evento sin cupos; inscripción en progreso; inscripción exitosa; sesión expirada; OTP expirado; perfil incompleto; evento cancelado.
- En los botones deshabilitados explicar motivo, no solo ocultar acción.

## Pendientes para diseño UX

¿Se permite cancelar? ¿Se puede reservar a un acompañante? (asumir no hasta confirmar); ¿cuándo cierra inscripción? ¿cabe check-in? (fuera de MVP).

## Acceso y creación de cuenta: interfaz [IMPLEMENTADO EN REPOSITORIO]

- `/login` reúne entrada y creación de cuenta por OTP; explica antes del envío que las personas nuevas completan nombre y ciudad después de verificar el correo.
- Indicador de progreso: correo → código → perfil. El último paso solo se solicita cuando el perfil está incompleto; las personas con perfil completo continúan a `/cuenta`.
- El paso OTP conserva el correo al volver, permite pegar/autocompletar los seis dígitos y muestra vencimiento y espera de reenvío calculados desde las fechas de la API. La API sigue validando vigencia y límites.
- El reenvío conserva la pantalla de código ante fallos y permite reintentar. Cambiar de correo elimina el challenge guardado en el navegador.
- El perfil carga departamento y municipio de forma dependiente, comunica fallos con reintento y descarta respuestas de departamentos seleccionados anteriormente.
- Composición con bienvenida y asset oficial de Moon en escritorio; formulario prioritario y pasos compactos en móvil. Entradas escalonadas de bienvenida/formulario, encabezado animado al cambiar de paso y feedback breve de errores; las interacciones no esperan a las animaciones. Se respeta movimiento reducido.
