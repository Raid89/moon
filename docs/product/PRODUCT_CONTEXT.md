# Moon — Product Context

## Visión [CONFIRMADO]
Moon es una **web para descubrir y gestionar eventos sociales presenciales oficiales de Moon** en Colombia. Su promesa es ayudar a personas a conocer gente nueva, unirse a planes y compartir experiencias reales. La primera versión es pequeña, pero debe causar una impresión visual y funcional excelente.

## Audiencias [CONFIRMADO]
- **Visitante**: explora eventos y ve información sin crear cuenta; requiere sesión al inscribirse (flujo propuesto para reducir fricción).
- **Participante (`USER`)**: inicia sesión por email OTP, completa perfil mínimo, se inscribe y consulta sus eventos.
- **Organizador (`ORGANIZER`)**: integrante autorizado del equipo Moon, crea y administra los eventos oficiales y consulta inscripciones. **No hay alta pública de organizadores**.

## Identidad [CONFIRMADO como dirección]
Estética nocturna cálida, negro profundo, naranja vibrante y crema; ilustración 2D expresiva y mascota Moon reconocible. Para implementación, obedecer la skill `moon-design-system` y respetar assets oficiales. No convertir cada pantalla en un afiche: la legibilidad, velocidad y claridad de inscripción son esenciales.

## Experiencia objetivo [PROPUESTA]
Descubrir evento → ver información, mapa y cupos → pulsar inscribirse → validar sesión mediante OTP si hace falta → completar nombre/ciudad si es nuevo → confirmar inscripción → ver resultado y consultar mis eventos.

## Principios del producto
1. Primero los eventos y la emoción de participar; luego la autenticación.
2. Una sola acción principal por pantalla; claridad sobre cupos, fecha, ubicación y reglas.
3. Experiencia mobile-first y accesible.
4. Datos personales mínimos; nunca solicitar teléfonos, documentos, fecha de nacimiento ni ubicación precisa del usuario sin necesidad aprobada.
5. El backend es la autoridad sobre roles, estados y capacidad.

## No inferir
Moon **no** es por ahora marketplace, plataforma de terceros, sistema de pagos, chat social, red de seguidores, ni aplicación móvil nativa. Cualquier ampliación necesita una decisión de producto.
